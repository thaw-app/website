// The changelog: every release a product has published, grouped by version, a page each.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { longDate } from '../../lib/format.mjs';
import { request } from '../request.mjs';
import { cacheFile, githubToken } from './config.mjs';
import {
  channelOf,
  descending,
  digitsOf,
  linkMentions,
  parseTag,
  splitReleases,
  splitSummary,
  stageRank,
  tidyNotes,
} from './text.mjs';

/**
 * The releases a repo has published on GitHub, newest first. The changelog file
 * only goes back so far and leaves some dates out; GitHub has every release.
 * The last answer is kept in .cache, and used when GitHub cannot be reached.
 */
async function publishedReleases(repo, slug) {
  const cache = cacheFile(`releases-${slug}.json`);
  const token = githubToken();
  try {
    const all = [];
    for (let page = 1; ; page++) {
      const response = await request(
        `https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      const batch = await response.json();
      all.push(...batch.filter((release) => !release.draft));
      if (batch.length < 100) break;
    }
    const kept = all.map(({ tag_name, name, body, published_at, html_url }) => ({
      tag: tag_name,
      name,
      body: body ?? '',
      date: published_at?.slice(0, 10),
      url: html_url,
    }));
    mkdirSync(join(cache, '..'), { recursive: true });
    writeFileSync(cache, JSON.stringify(kept));
    return kept;
  } catch (error) {
    if (existsSync(cache)) {
      console.warn(`${repo}: using the saved release list (${error.message}).`);
      // Marked, so a count taken from it is not dated today.
      return Object.assign(JSON.parse(readFileSync(cache, 'utf8')), { stale: true });
    }
    console.warn(`${repo}: no release list (${error.message}); the changelog file alone is used.`);
    return [];
  }
}

/**
 * Every release, from the changelog file and from GitHub, gathered by version
 * number: newest version first, and within one the final release, then its
 * release candidates, betas and alphas.
 */
function groupReleases(markdown, published, product) {
  const { repo, namedGroups = {} } = product;
  const online = new Map(published.map((release) => [release.tag, release]));
  const written = splitReleases(markdown).map((release) => ({
    ...release,
    date: release.date ?? online.get(release.tag)?.date,
    url: online.get(release.tag)?.url,
  }));
  const known = new Set(written.map((release) => release.tag));
  const older = published
    .filter((release) => !known.has(release.tag))
    .map((release) => ({
      tag: release.tag,
      slug: release.tag.toLowerCase(),
      date: release.date,
      url: release.url,
      channel: channelOf(release.tag),
      // A release named for more than its number, such as "1.2.0 - The Global Thaw".
      name: release.name && release.name !== release.tag ? release.name : undefined,
      // What the name adds to the number: "The Global Thaw".
      byname: parseTag(release.tag)
        ? release.name?.replace(release.tag, '').replace(/^[\s–—:-]+/, '') || undefined
        : undefined,
      onGitHubOnly: true,
      ...splitSummary(tidyNotes(release.body)),
    }));

  const groups = new Map();
  for (const release of [...written, ...older]) {
    const parsed = parseTag(release.tag);
    // A tag that is not a version, such as "macos-27-preview.3", groups by its name.
    const key = parsed?.version ?? release.tag.replace(/[.-]?\d+$/, '');
    const label = namedGroups[key]?.label
      ? namedGroups[key].label
      : parsed
        ? key
        : /unreleased/i.test(key)
          ? 'Unreleased'
          : (release.name?.replace(/\s*\d+\s*(\(.*\))?$/, '') ?? key);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        slug: key.toLowerCase(),
        label,
        note: namedGroups[key]?.note,
        releases: [],
      });
    }
    groups.get(key).releases.push({
      ...release,
      body: linkMentions(release.body, repo),
      stage: parsed?.stage,
      versioned: Boolean(parsed),
    });
  }

  // What is not out yet leads, the versions follow, and anything else comes last.
  const place = (key) => (/unreleased/i.test(key) ? 0 : parseTag(key) ? 1 : 2);
  const ordered = [...groups.values()].sort(
    (a, b) =>
      place(a.key) - place(b.key) ||
      (place(a.key) === 1
        ? descending(digitsOf(a.key), digitsOf(b.key))
        : a.key.localeCompare(b.key)),
  );
  // A named group moves up to sit under the version it led to.
  for (const [key, { after }] of Object.entries(namedGroups)) {
    const from = ordered.findIndex((group) => group.key === key);
    if (from < 0 || !after) continue;
    const [moved] = ordered.splice(from, 1);
    const target = ordered.findIndex((group) => group.key === after);
    ordered.splice(target < 0 ? ordered.length : target + 1, 0, moved);
  }
  for (const group of ordered) {
    group.releases.sort((a, b) =>
      a.versioned && b.versioned
        ? descending(stageRank(a.stage), stageRank(b.stage))
        : (b.date ?? '').localeCompare(a.date ?? ''),
    );
    // The release the version is named for, when it has come out.
    group.final = group.releases.find((release) => release.tag === group.key);
  }
  return ordered;
}

/**
 * Writes changelog/: an index, and one page per release. A version with
 * several releases gets a folder, opened by its final release when there is
 * one and by a list of its pre-releases when there is not.
 */
/** The macOS a release is for, when the notes or the product's version table say. */
function systemOf(release, product) {
  const stated = `${release.summary ?? ''} ${release.name ?? ''} ${release.tag}`.match(
    /macOS[\s-]?(\d+)/i,
  );
  if (stated) return `macOS ${stated[1]}`;
  return product.systems?.[release.tag.match(/^(\d+)\./)?.[1]];
}

function writeChangelog(markdown, repoPath, outDir, product, rewrite, published) {
  const dir = join(outDir, 'changelog');
  mkdirSync(dir, { recursive: true });
  const groups = groupReleases(markdown, published, product);

  const page = (fields, body) =>
    `${['---', ...Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`), '---', ''].join('\n')}${body}\n`;

  writeFileSync(
    join(dir, 'index.md'),
    page(
      {
        title: 'Changelog',
        description: `Every release of ${product.name}, newest first.`,
        source: repoPath,
        releaseIndex: true,
      },
      '',
    ),
  );

  let order = 0;
  for (const group of groups) {
    const folder = group.releases.length > 1;
    if (folder) mkdirSync(join(dir, group.slug), { recursive: true });

    for (const release of group.releases) {
      const { tag, date, channel, url, name } = release;
      const summary = release.summary ?? release.byname;
      const os = systemOf(release, product);
      const description = [date && longDate(date), summary].filter(Boolean).join(' · ');
      const file = !folder
        ? `${release.slug}.md`
        : release === group.final
          ? `${group.slug}/index.md`
          : `${group.slug}/${release.slug}.md`;
      writeFileSync(
        join(dir, file),
        page(
          {
            title: release.versioned || !name ? tag : name,
            ...(description ? { description } : {}),
            // Notes that are only on GitHub are opened there; the rest are in the changelog file.
            ...(release.onGitHubOnly && url ? { sourceUrl: url } : { source: repoPath }),
            release: {
              tag,
              version: group.key,
              ...(group.label !== group.key ? { versionLabel: group.label } : {}),
              ...(group.note ? { versionNote: group.note } : {}),
              channel,
              order: order++,
              final: release === group.final,
              ...(date ? { date } : {}),
              ...(summary ? { summary } : {}),
              ...(url ? { url } : {}),
              ...(name ? { name } : {}),
              ...(os ? { os } : {}),
            },
          },
          rewrite(release.body),
        ),
      );
    }

    if (!folder) continue;
    if (!group.final) {
      writeFileSync(
        join(dir, group.slug, 'index.md'),
        page(
          {
            title: group.label,
            description: parseTag(group.key)
              ? `The pre-releases of ${product.name} ${group.label}. It has no final release.`
              : (group.note ?? `The ${group.label} builds of ${product.name}.`),
            releaseGroup: group.key,
          },
          '',
        ),
      );
    }
    writeFileSync(
      join(dir, group.slug, 'meta.json'),
      `${JSON.stringify(
        {
          title: group.label,
          defaultOpen: false,
          // index.md is left out so the folder's own row opens it.
          pages: group.releases
            .filter((release) => release !== group.final)
            .map((release) => release.slug),
        },
        null,
        2,
      )}\n`,
    );
  }

  writeFileSync(
    join(dir, 'meta.json'),
    `${JSON.stringify(
      {
        title: 'Changelog',
        icon: product.icons.changelog,
        defaultOpen: false,
        // index.md is left out so the folder's own row opens it.
        pages: groups.map((group) =>
          group.releases.length > 1 ? group.slug : group.releases[0].slug,
        ),
      },
      null,
      2,
    )}\n`,
  );
  return order;
}

export { groupReleases, publishedReleases, systemOf, writeChangelog };
