// Copies each product's docs out of its app repo into content/docs/<product>
// before a build.
//
// The markdown stays in the app repo, next to the code it describes. This
// script fetches it, gives each file the frontmatter Fumadocs needs, and
// points links between the files at their pages on this site.
//
// Per product, with THAW or FLOE as the prefix:
//
//   <PREFIX>_DOCS_DIR  path to a local checkout, to preview unpushed docs
//   <PREFIX>_DOCS_REF  branch or tag to fetch when no checkout is given; the
//                      default is the product's `ref` below
//
// The pages are what a build cannot do without. The numbers and lists the pages quote
// (stars, downloads, the Verified values, the roadmap's issues, Built with) are refreshed
// after them and are optional: each keeps its committed copy when it cannot be read, and
// `--content` skips them altogether, which is what `next dev` and CI run.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { builtWith } from './built-with.mjs';
import { countCountries } from './countries.mjs';
import { request } from './request.mjs';

const contentDir = join(import.meta.dirname, '..', 'content', 'docs');

// extraPages are files outside docs/ that get a page too, keyed by their path
// in the repo. icons are Lucide names for the sidebar, keyed by page slug.
// titles replace a file's own heading where that is too long for the sidebar.
const products = [
  {
    slug: 'thaw',
    name: 'Thaw',
    repo: 'thaw-app/Thaw',
    ref: 'development',
    // The macOS each major version runs on, from the deployment target its tags were built with.
    // A release that says "macOS 27 only" in its notes is filed by that instead.
    systems: { 3: 'macOS 27', 2: 'macOS 26', 1: 'macOS 14 and 15' },
    // Thaw began as a fork of Ice on this day. Contributors are counted from it on, so
    // the people who only ever worked on Ice are not listed as Thaw's.
    contributorsSince: '2026-01-29',
    // Accounts that commit but are not people.
    // lathe-agent-oa's own profile calls it a machine account run by a contributor.
    notPeople: ['claude', 'cursoragent', 'lathe-agent-oa'],
    // Where the community page's numbers come from.
    // updatesRepo holds the files the app's own updater fetches, which count as downloads too.
    // team is who maintains the project, in the order they are shown.
    community: {
      discordInvite: 'KDfWjWDnR4',
      cask: 'thaw',
      updatesRepo: 'thaw-app/updates',
      team: ['stonerl', 'diazdesandi', 'nightah', 'alvst', 'camguillory'],
      // The project's entry on bestpractices.dev, which holds its OpenSSF badge and Baseline level.
      bestPractices: 13303,
    },
    // Pages this site writes itself, so the repo's file of the same name is not synced in.
    // The roadmap is content/site/roadmap.mdx, drawn at /roadmap; it says more than
    // docs/ROADMAP.md does, for now.
    writtenHere: ['roadmap'],
    // README sections the home page leaves out: it links to the docs itself, and the
    // contributors are on the community page and the licence in the footer.
    readmeLeavesOut: [
      'Project documentation',
      'Contributors',
      'License',
      // The home page has one job, getting Thaw installed; these two are in the docs and on
      // the community page.
      'Integrations',
      'Languages',
      // What Transparency lists is said where it applies: free and GPL-3.0 beside the
      // headline, Screen Recording under Install, no tracking in the footer.
      'Transparency',
    ],
    // Releases tagged in words: what their group is called, and the version it is listed under.
    namedGroups: {
      'macos-27-preview': {
        label: 'Pre-3.0.0',
        after: '3.0.0',
        note: 'Experimental builds for macOS 27, versioned 2.1.0 at the time. They branched from the 2.0.0 betas in June 2026 and were to become the macOS 27 release, until that work was rewritten as 3.0.0.',
      },
    },
    titles: {
      'frequent-issues': 'Frequent issues',
      'uri-schemes': 'URL schemes',
      'hidden-flags': 'Hidden flags',
      architecture: 'Architecture',
      releases: 'Releases and updates',
      'verifying-releases': 'Verifying releases',
      'assurance-case': 'Security assurance case',
      governance: 'Governance',
    },
    icons: {
      'frequent-issues': 'LifeBuoy',
      'uri-schemes': 'Link',
      'hidden-flags': 'Flag',
      roadmap: 'Map',
      changelog: 'ScrollText',
      development: 'Hammer',
      architecture: 'Layers',
      releases: 'Package',
      'verifying-releases': 'ShieldCheck',
      'assurance-case': 'FileCheck',
      governance: 'Scale',
    },
    extraPages: {
      'CHANGELOG.md': 'changelog',
      'FREQUENT_ISSUES.md': 'frequent-issues',
      '.github/GOVERNANCE.md': 'governance',
      // Shown on the home page, not in the docs sidebar.
      'README.md': 'readme',
    },
  },
  {
    slug: 'floe',
    name: 'Floe',
    repo: 'thaw-app/Floe',
    ref: 'main',
    titles: {},
    icons: { changelog: 'ScrollText', development: 'Hammer' },
    extraPages: { 'CHANGELOG.md': 'changelog' },
  },
];

// What every product's docs carry a copy of: the policies both apps follow,
// which live in the organisation's own repo, and the pages in content/shared.
const shared = {
  repo: 'thaw-app/.github',
  ref: 'main',
  pages: {
    '.github/CONTRIBUTING.md': 'contribute/guidelines',
    '.github/CODE_OF_CONDUCT.md': 'contribute/code-of-conduct',
    '.github/SECURITY.md': 'security',
  },
  titles: {
    security: 'Security policy',
    'contribute/guidelines': 'Contribution guidelines',
    'contribute/code-of-conduct': 'Code of Conduct',
  },
  icons: { security: 'ShieldAlert' },
  // Written in this repo. "{{docs}}" in them stands for the product's own docs.
  dir: join(contentDir, '..', 'shared'),
};

/**
 * A README as the home page shows it: from its first section on, without the
 * header, the badges and the screenshots, which the page has its own of.
 */
function readmeBody(markdown, product) {
  const trimmed = markdown
    .slice(Math.max(0, markdown.search(/^## /m)))
    .replace(/<details>\s*<summary><b>Screenshots<\/b><\/summary>[\s\S]*?<\/details>\s*/, '')
    .replace(/^<a [^\n]*<img [^\n]*<\/a>\n/gm, '')
    .replace(/<p align="center">\s*<a [^>]*>\s*<img[\s\S]*?<\/p>\s*/g, '')
    // A bare asterisk inside a tag would open emphasis in MDX.
    .replace(/(<su[bp]>)\\?\*/g, '$1\\*');

  const sections = trimmed.split(/^(?=## )/m).map((section) => {
    // The install commands become tabs, which carry their own notes.
    if (/^## Install\b/.test(section)) {
      return (
        section
          .replace(/```sh\n[\s\S]*?```\n/, '<InstallTabs />\n')
          .replace(/^Or grab the `\.dmg`[^\n]*\n\n?/m, '')
          // What it needs and asks for is said under the tabs, per macOS (install-tabs.tsx).
          .replace(/^Needs macOS[^\n]*\n\n?/m, '')
      );
    }
    // The short feature list gives way to the site's own steps of squares, which rank the
    // features differently (lib/thaw-features.ts) and name the ones in the README's folded
    // full list, which is therefore left out.
    if (/^## Features\b/.test(section)) {
      return section
        .replace(/(?:^- .*\n)+/m, '<FeatureList />\n')
        .replace(/<details>[\s\S]*?<\/details>\s*/, '');
    }
    return section;
  });
  // Installing comes first on the page, ahead of the feature list.
  const install = sections.findIndex((section) => /^## Install\b/.test(section));
  if (install > 0) sections.unshift(...sections.splice(install, 1));
  // And last, how the project is run: its numbers and what outside bodies have verified.
  sections.push('\n<Assurance />\n');
  const leftOut = product.readmeLeavesOut ?? [];
  return sections
    .filter((section) => !leftOut.some((name) => section.startsWith(`## ${name}\n`)))
    .join('');
}

/**
 * A roadmap file as two lists: what is planned, by area, and what has shipped,
 * by release. A section that is only a list of items is one of the two, told
 * apart by a heading such as "Shipped in 2.1.0"; any other section is kept as
 * it was written, after the lists.
 */
function roadmapBody(markdown) {
  const [intro, ...sections] = markdown.split(/^(?=## )/m);
  const planned = [];
  const shipped = [];
  const prose = [];
  for (const section of sections) {
    const [heading, ...rest] = section.split('\n');
    const name = heading.replace(/^##\s+/, '').trim();
    const release = name.match(/^Shipped in (.+)$/i)?.[1];
    // An item is a bullet and the lines that continue it.
    const items = rest.join('\n').match(/^- .*(?:\n {2,}\S.*)*/gm) ?? [];
    if (!items.length) prose.push(section.trim());
    else (release ? shipped : planned).push({ name: release ?? name, items });
  }
  const count = (groups) => groups.reduce((sum, group) => sum + group.items.length, 0);
  const list = (title, groups, done) =>
    groups.length
      ? [
          `<RoadmapList title="${title}" count={${count(groups)}}${done ? ' done' : ''}>`,
          ...groups.flatMap((group) => [
            `<RoadmapGroup name="${group.name}" count={${group.items.length}}>`,
            '',
            ...group.items,
            '',
            '</RoadmapGroup>',
          ]),
          '</RoadmapList>',
          '',
        ]
      : [];
  return `${[intro.trim(), '', ...list('Up next', planned), ...list('Shipped', shipped, true), ...prose].join('\n')}\n`;
}

function checkout({ slug, repo }, ref) {
  const variable = `${slug.toUpperCase()}_DOCS_DIR`;
  const local = process.env[variable];
  if (local) {
    if (!existsSync(join(local, 'docs'))) {
      throw new Error(`${variable} has no docs folder: ${local}`);
    }
    return { root: local, cleanup: () => {} };
  }
  return clone(repo, ref, ['docs', '.github']);
}

/** A sparse, blobless clone: the named folders and the root files only. */
function clone(repo, ref, folders) {
  const root = mkdtempSync(join(tmpdir(), 'thaw-docs-'));
  const git = (...args) =>
    // A clone that hangs would hang the build with it.
    execFileSync('git', args, {
      cwd: root,
      stdio: ['ignore', 'ignore', 'inherit'],
      timeout: 120_000,
    });
  git(
    'clone',
    '--depth',
    '1',
    '--filter=blob:none',
    '--sparse',
    '--branch',
    ref,
    `https://github.com/${repo}.git`,
    '.',
  );
  git('sparse-checkout', 'set', ...folders);
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function slugOf(repoPath, extraPages) {
  return extraPages[repoPath] ?? posix.basename(repoPath, '.md').toLowerCase().replaceAll('_', '-');
}

/** Splits off the leading "# Title" so the page does not print it twice. */
function splitTitle(markdown, fallback) {
  const match = markdown.match(/^\s*#\s+(.+?)\s*\n/);
  if (!match) return { title: fallback, body: markdown };
  // A heading can carry a comment for other tools, such as a TOC generator.
  const title = match[1].replace(/<!--.*?-->/g, '').trim();
  return { title, body: markdown.slice(match[0].length) };
}

/** The first paragraph as plain text, for the page description. */
function describe(body) {
  const paragraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|\||```|>|-|\*|\d+\.|<)/.test(block));
  if (!paragraph) return undefined;
  const text = paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ');
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}...` : text;
}

/**
 * Straight quotes and apostrophes in a page's prose, curled, as the pages written on this
 * site have them: the app repos type them straight. Code, addresses, tags and what sits
 * inside a link's brackets-and-parentheses are left as typed, since there a quote is
 * syntax and not punctuation.
 */
function curlQuotes(markdown) {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }
      // A link defined on a line of its own keeps its title's quotes: they are how it is told.
      if (fenced || /^\s*\[[^\]]+\]:/.test(line)) return line;
      // What must not change is set aside and put back after, each as one mark that is
      // neither a space nor a letter, so a quote beside it is still read the right way.
      const kept = [];
      const held = line.replace(
        /`[^`]*`|\]\([^)]*\)|\]\[[^\]]*\]|<[^>]+>|https?:\/\/\S+/g,
        (part) => {
          kept.push(part);
          return String.fromCharCode(0xe000 + kept.length - 1);
        },
      );
      return held
        .replace(/(^|[\s([{*_—–-])"/g, '$1“')
        .replace(/"/g, '”')
        .replace(/(^|[\s([{*_—–-])'/g, '$1‘')
        .replace(/'/g, '’')
        .replace(/[-]/g, (mark) => kept[mark.charCodeAt(0) - 0xe000] ?? mark);
    })
    .join('\n');
}

/** Repoints relative links: to this site for a synced page, to GitHub otherwise. */
function rewriteLinks(body, repoPath, slugs, { product, repo, ref }) {
  const dir = posix.dirname(repoPath);
  let fenced = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return line;
      return line.replace(/\]\(([^)\s]+)\)/g, (whole, target) => {
        if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) return whole;
        const [path, fragment] = target.split('#');
        const resolved = posix.normalize(posix.join(dir, path));
        const hash = fragment ? `#${fragment}` : '';
        const slug = slugs.get(resolved);
        return slug
          ? `](/docs/${product}/${slug}${hash})`
          : `](https://github.com/${repo}/blob/${ref}/${resolved}${hash})`;
      });
    })
    .join('\n');
}

/**
 * Splits a changelog into its releases the way the release workflows do: a
 * section runs from "## [tag]" to the next "## ". The app repos own that
 * format, since the workflows cut release notes and the Sparkle appcast from
 * it, so this reads the file as it is and asks nothing more of it.
 */
function splitReleases(markdown) {
  const headings = [...markdown.matchAll(/^##\s+\[?([^\]\s]+)\]?(.*)$/gm)];
  return headings.map((heading, index) => {
    const end = index + 1 < headings.length ? headings[index + 1].index : markdown.length;
    let body = markdown.slice(heading.index + heading[0].length, end).trim();

    // A release can open with one bold line, such as "macOS 27 only · Build 111".
    const { summary, body: rest } = splitSummary(body);
    // The rule that separated it from the next release.
    body = rest.replace(/\n-{3,}\s*$/, '').trim();

    const tag = heading[1];
    return {
      tag,
      slug: tag.toLowerCase(),
      date: heading[2].match(/\d{4}-\d{2}-\d{2}/)?.[0],
      summary,
      channel: channelOf(tag),
      body: promoteHeadings(body),
    };
  });
}

function channelOf(tag) {
  if (/unreleased/i.test(tag)) return 'Unreleased';
  if (/preview/i.test(tag)) return 'Preview';
  if (/alpha/i.test(tag)) return 'Alpha';
  if (/beta/i.test(tag)) return 'Beta';
  if (/rc/i.test(tag)) return 'Release candidate';
  return 'Stable';
}

/** A release's sections start at "###" in the changelog and at "##" on its own page. */
function promoteHeadings(body) {
  let fenced = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return fenced ? line : line.replace(/^#(#{2,5}\s)/, '$1');
    })
    .join('\n');
}

// Written as lib/shared.ts's longDate writes one, which this cannot import: day first.
function longDate(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/**
 * The releases a repo has published on GitHub, newest first. The changelog file
 * only goes back so far and leaves some dates out; GitHub has every release.
 * The last answer is kept in .cache, and used when GitHub cannot be reached.
 */
async function publishedReleases(repo, slug) {
  const cache = join(contentDir, '..', '..', '.cache', `releases-${slug}.json`);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
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
 * The people with commits in a repo since a given day, most commits first.
 * GitHub's statistics give each contributor's commits week by week, which is
 * what lets a fork leave out those who only worked on the project it came from.
 * The last answer is kept in .cache, and used when GitHub cannot be reached.
 */
async function contributors({ repo, slug, contributorsSince, notPeople = [] }) {
  const cache = join(contentDir, '..', '..', '.cache', `contributors-${slug}.json`);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  // Weeks start on Sunday, so the week the day falls in counts from its start.
  const day = new Date(`${contributorsSince}T00:00:00Z`);
  const since = day.getTime() / 1000 - day.getUTCDay() * 86_400;
  try {
    let stats;
    // GitHub answers 202 while it works the numbers out, and has them a moment later.
    for (let attempt = 0; attempt < 5 && !stats; attempt++) {
      const response = await request(`https://api.github.com/repos/${repo}/stats/contributors`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.status === 202) await new Promise((resolve) => setTimeout(resolve, 3000));
      else if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      else stats = await response.json();
    }
    if (!Array.isArray(stats)) throw new Error('GitHub is still counting');
    const people = stats
      .filter(({ author }) => author?.type === 'User' && !notPeople.includes(author.login))
      .map(({ author, weeks }) => ({
        login: author.login,
        avatar: author.avatar_url,
        commits: weeks.filter((week) => week.w >= since).reduce((sum, week) => sum + week.c, 0),
      }))
      .filter((person) => person.commits > 0)
      .sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login));
    mkdirSync(join(cache, '..'), { recursive: true });
    writeFileSync(cache, JSON.stringify(people));
    return people;
  } catch (error) {
    if (existsSync(cache)) {
      console.warn(`${repo}: using the saved contributor list (${error.message}).`);
      return Object.assign(JSON.parse(readFileSync(cache, 'utf8')), { stale: true });
    }
    console.warn(`${repo}: no contributor list (${error.message}).`);
    return [];
  }
}

/**
 * The numbers on the community page, each fetched from where it is counted.
 * One that cannot be fetched keeps its last value, or is left off the page.
 */
/**
 * The translators named in a repo's CREDITS.md, by language. Crowdin has no
 * public list of a project's translators, and that file is the project's own
 * record of them: "- Display Name (username)" under a "### flags Language" heading.
 */
function translators(root) {
  const file = join(root, 'CREDITS.md');
  if (!existsSync(file)) return null;
  const section = readFileSync(file, 'utf8')
    .split(/^## Translators$/m)[1]
    ?.split(/^## /m)[0];
  if (!section) return null;
  return section
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const [heading, ...lines] = block.split('\n');
      const [, flags = '', language = heading] =
        heading.trim().match(/^((?:\p{RI}{2}\s*)+)(.*)$/u) ?? [];
      const people = lines
        .filter((line) => line.startsWith('- '))
        .map((line) => {
          const entry = line.slice(2).trim();
          // "Name (username)", or a username alone.
          const named = entry.match(/^(.*)\s\(([^()\s]+)\)$/);
          if (named) return { name: named[1], username: named[2] };
          // A bare username is its own name; anything with a space in it is not a username.
          return /\s/.test(entry) ? { name: entry } : { name: entry, username: entry };
        });
      return { language: language.trim(), flags: flags.trim(), people };
    })
    .filter((group) => group.people.length);
}

/**
 * Where the repo's stars, issues and pull requests come from, by country, from the location each gives on their GitHub profile (see countries.mjs for
 * how free text becomes a country). It reads every one of them, a hundred to a request,
 * so it needs a token and is done at most once a day; otherwise the last count stands.
 */
async function whereFrom(repo, before, token) {
  const today = new Date().toISOString().slice(0, 10);
  if (!token || before?.checked === today) return before ?? null;
  const [owner, name] = repo.split('/');
  const lists = {
    stargazers: ['stargazers', 'login location'],
    issues: ['issues', 'author { login ... on User { location } }'],
    pulls: ['pullRequests', 'author { login ... on User { location } }'],
  };
  try {
    const world = { checked: today };
    for (const [key, [field, node]] of Object.entries(lists)) {
      // A star is a person. An issue or a pull request is counted each time, for the
      // country of whoever opened it: someone with a hundred pull requests is a hundred.
      const places = [];
      for (let after = null; ; ) {
        const response = await request('https://api.github.com/graphql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${field}(first: 100, after: ${JSON.stringify(after)}) { pageInfo { hasNextPage endCursor } nodes { ${node} } } } }`,
          }),
        });
        if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
        const { data, errors } = await response.json();
        if (errors) throw new Error(errors[0].message);
        const page = data.repository[field];
        for (const entry of page.nodes) {
          const person = entry.author ?? entry;
          if (person?.login) places.push(person.location ?? null);
        }
        if (!page.pageInfo.hasNextPage) break;
        after = page.pageInfo.endCursor;
      }
      world[key] = countCountries(places);
    }
    return world;
  } catch (error) {
    console.warn(`Could not read where people are from (${error.message}).`);
    return before ?? null;
  }
}

/**
 * How often the app itself was fetched from a list of releases: its disk images and
 * archives, and the deltas its updater takes. The checksums, signatures and SBOMs
 * attached beside them are read by tools checking a download, and are not downloads.
 */
function appDownloads(releases) {
  let total = 0;
  for (const release of releases) {
    for (const asset of release.assets ?? []) {
      if (/\.(dmg|zip|pkg|delta)$/i.test(asset.name)) total += asset.download_count;
    }
  }
  return total;
}

/**
 * What was just read, laid over what was known, with the day each was last really read.
 * A source that could not be reached keeps its last value and its last day with it, so
 * the pages can say how old a number is and never date a kept one today.
 */
function settle(fresh, before = {}, beforeDays = {}, today) {
  const values = {};
  const days = {};
  for (const [key, value] of Object.entries(fresh)) {
    const read = value !== null && value !== undefined;
    values[key] = read ? value : before[key];
    days[key] = read ? today : values[key] === undefined ? undefined : beforeDays[key];
  }
  return { values, days };
}

async function communityNumbers(product, published, people, root) {
  const file = join(contentDir, '..', '..', 'lib', 'community.json');
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const github = token ? { Authorization: `Bearer ${token}` } : {};
  const read = async (url, headers = {}) => {
    try {
      const response = await request(url, { headers });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  const { discordInvite, cask, updatesRepo, team = [], bestPractices } = product.community;
  // Every release of a repo, however many pages that takes.
  const downloadsOf = async (name) => {
    let total = 0;
    for (let page = 1; ; page++) {
      const batch = await read(
        `https://api.github.com/repos/${name}/releases?per_page=100&page=${page}`,
        github,
      );
      if (!Array.isArray(batch)) return null;
      total += appDownloads(batch);
      if (batch.length < 100) return total;
    }
  };
  const [repo, fromReleases, fromUpdates, discord, brew] = await Promise.all([
    read(`https://api.github.com/repos/${product.repo}`, github),
    downloadsOf(product.repo),
    updatesRepo ? downloadsOf(updatesRepo) : 0,
    read(`https://discord.com/api/v9/invites/${discordInvite}?with_counts=true`),
    read(`https://formulae.brew.sh/api/cask/${cask}.json`),
  ]);
  // Only a full count replaces the last one: half of it would read as a drop.
  const downloads =
    fromReleases === null || fromUpdates === null ? null : fromReleases + fromUpdates;
  // Each team member as their GitHub profile shows them; one that cannot be read keeps
  // the last copy, or falls back to the bare login.
  const profiles = await Promise.all(
    team.map(async (login) => {
      const profile = await read(`https://api.github.com/users/${login}`, github);
      const kept = before.team?.find((member) => member.login === login);
      return profile
        ? { login, name: profile.name ?? undefined, avatar: profile.avatar_url }
        : (kept ?? { login, avatar: `https://github.com/${login}.png?size=200` });
    }),
  );
  // What outside bodies say about how the project is run, read from them directly.
  const [practices, scorecard, everyProject, coverage] = await Promise.all([
    bestPractices ? read(`https://www.bestpractices.dev/projects/${bestPractices}.json`) : null,
    read(`https://api.securityscorecards.dev/projects/github.com/${product.repo}`),
    // How many projects hold each badge, to say how common Thaw's are.
    read('https://www.bestpractices.dev/project_stats.json', { Accept: 'application/json' }),
    read(
      `https://sonarcloud.io/api/measures/component?component=${product.repo.replace('/', '_')}&metricKeys=coverage`,
    ),
  ]);
  // The newest day's count: every project on the list, those with Gold, and those that
  // meet every Baseline control at its top level.
  const newest = Array.isArray(everyProject) ? everyProject.at(-1) : null;
  const field = newest?.percent_2_ge_100
    ? {
        projects: newest.percent_ge_0,
        gold: newest.percent_2_ge_100,
        baseline3: newest.percent_baseline_3_ge_100,
      }
    : null;
  const covered = Number(coverage?.component?.measures?.[0]?.value);
  const baseline = practices
    ? [3, 2, 1].find((level) => practices[`badge_percentage_baseline_${level}`] === 100)
    : undefined;
  const today = new Date().toISOString().slice(0, 10);
  // A file from before each number had its own day has one day for all of them.
  const beforeDays = before.readOn ?? {};
  const dayOf = (key) => beforeDays[key] ?? before.checked;
  const counts = settle(
    {
      stars: repo?.stargazers_count,
      downloads: downloads || null,
      homebrewYear: brew?.analytics?.install?.['365d']?.[cask],
      discord: discord?.approximate_member_count,
      // A list from .cache is the last one read, not today's.
      contributors: people.stale ? null : people.length || null,
      releases: published.stale ? null : published.length || null,
    },
    before,
    Object.fromEntries(
      ['stars', 'downloads', 'homebrewYear', 'discord', 'contributors', 'releases'].map((key) => [
        key,
        dayOf(key),
      ]),
    ),
    today,
  );
  const outside = settle(
    {
      bestPractices: practices?.badge_level,
      baseline,
      scorecard: scorecard?.score,
      coverage: Number.isFinite(covered) ? covered : null,
      field,
    },
    before.assurance,
    Object.fromEntries(
      ['bestPractices', 'baseline', 'scorecard', 'coverage', 'field'].map((key) => [
        key,
        dayOf(key),
      ]),
    ),
    today,
  );
  const numbers = {
    ...counts.values,
    // The day each number above and each Verified value below was last read from its source.
    readOn: { ...counts.days, ...outside.days },
    people: people.length ? people : (before.people ?? []),
    team: profiles,
    assurance: outside.values,
    translators: translators(root) ?? before.translators ?? [],
    world: await whereFrom(product.repo, before.world?.checked ? before.world : null, token),
  };
  writeFileSync(file, `${JSON.stringify(numbers, null, 2)}\n`);
}

/**
 * Whether each issue the roadmap links to is open or closed, so the page can
 * say so beside the link. One that cannot be read keeps what was known before.
 */
async function roadmapIssues(product) {
  const page = join(contentDir, '..', 'site', 'roadmap.mdx');
  const file = join(contentDir, '..', '..', 'lib', 'roadmap-issues.json');
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const numbers = existsSync(page)
    ? [
        ...new Set(
          [...readFileSync(page, 'utf8').matchAll(/<Issue n=\{(\d+)\}/g)].map((hit) => hit[1]),
        ),
      ]
    : [];
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const states = {};
  await Promise.all(
    numbers.map(async (number) => {
      try {
        const response = await request(
          `https://api.github.com/repos/${product.repo}/issues/${number}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!response.ok) throw new Error(String(response.status));
        const issue = await response.json();
        states[number] = { state: issue.state, reason: issue.state_reason ?? null };
      } catch {
        if (before[number]) states[number] = before[number];
      }
    }),
  );
  writeFileSync(file, `${JSON.stringify(states, null, 2)}\n`);
}

/**
 * The feature requests open in the project's repository, most thumbs-up first, for the
 * roadmap's "Asked for". GitHub's issue type tells a request from a bug. If they cannot be
 * read, the last list stays.
 */
async function roadmapRequests(product) {
  const file = join(contentDir, '..', '..', 'lib', 'roadmap-requests.json');
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const query = new URLSearchParams({
    q: `repo:${product.repo} is:issue is:open type:Feature`,
    sort: 'reactions-+1',
    order: 'desc',
    per_page: '12',
  });
  try {
    const response = await request(`https://api.github.com/search/issues?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(String(response.status));
    const found = (await response.json()).items
      // A request about how the project is run is not one for the app.
      .filter((issue) => !issue.labels.some((label) => label.name === 'ops'))
      .map((issue) => ({
        number: issue.number,
        // The issue form puts what kind of issue it is in front of every title.
        title: issue.title.replace(/^\s*\[[^\]]*\]\s*/, '').trim(),
        votes: issue.reactions?.['+1'] ?? 0,
      }));
    writeFileSync(file, `${JSON.stringify(found, null, 2)}\n`);
  } catch (error) {
    console.warn(`  could not read ${product.repo}'s feature requests (${error.message})`);
    if (!existsSync(file)) writeFileSync(file, '[]\n');
  }
}

/** Release notes written on GitHub, shaped like a changelog section's body. */
function tidyNotes(markdown) {
  const lines = markdown.replace(/\r/g, '').trim().split('\n');
  // Notes start their sections at any depth; on the site a release's sections are "##".
  let fenced = false;
  let shallowest = 6;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const depth = fenced ? 0 : (line.match(/^(#{1,6})\s/)?.[1].length ?? 0);
    if (depth) shallowest = Math.min(shallowest, depth);
  }
  fenced = false;
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      const marks = fenced ? null : line.match(/^(#{1,6})(\s.*)$/);
      return marks ? '#'.repeat(Math.min(6, marks[1].length - shallowest + 2)) + marks[2] : line;
    })
    .join('\n');
}

// Swift attributes that release notes mention in prose, which are not people.
const swiftAttributes = new Set(
  'Animatable AnimatableIgnored AppStorage Binding Environment EnvironmentObject MainActor Observable ObservationIgnored ObservedObject Published Sendable State StateObject available escaping objc unchecked'.split(
    ' ',
  ),
);

/** Turns "#123" and "@name" into links, as GitHub does when it shows the same text. */
function linkMentions(markdown, repo) {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      // Code, links, tags and addresses are passed over untouched.
      return line
        .split(/(`[^`]*`|!?\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\[[^\]]*\]|<[^>]+>|https?:\/\/\S+)/)
        .map((part, index) =>
          index % 2
            ? part
            : part
                .replace(/(^|[\s(,])#(\d+)\b/g, `$1[#$2](https://github.com/${repo}/issues/$2)`)
                .replace(
                  /(^|[\s(,])@([A-Za-z\d](?:[A-Za-z\d-]{0,37}[A-Za-z\d])?)\b(?![.@])/g,
                  (whole, before, name) =>
                    swiftAttributes.has(name)
                      ? whole
                      : `${before}[@${name}](https://github.com/${name})`,
                ),
        )
        .join('');
    })
    .join('\n');
}

/** The opening bold line of a release, if it has one, and the notes without it. */
function splitSummary(body) {
  const summary = body.match(/^\*\*([^*\n]+)\*\*[ \t]*(\n|$)/);
  return summary
    ? { summary: summary[1].trim(), body: body.slice(summary[0].length).trim() }
    : { body };
}

/** "2.0.0-rc.3" as its version and what follows it; null for a tag that is not a version. */
function parseTag(tag) {
  const parts = tag.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  return parts && { version: `${parts[1]}.${parts[2]}.${parts[3]}`, stage: parts[4] };
}

const numbers = (text) => (text.match(/\d+/g) ?? []).map(Number);

/** Orders two lists of numbers, larger first. */
function descending(a, b) {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (b[index] ?? 0) - (a[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

/** Where a release stands within its version: the final one first, then rc, beta, alpha. */
function stageRank(stage) {
  if (!stage) return [4];
  const kind = /unreleased/i.test(stage)
    ? 3
    : /^rc/i.test(stage)
      ? 2
      : /^beta/i.test(stage)
        ? 1
        : 0;
  return [kind, ...numbers(stage)];
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
        ? descending(numbers(a.key), numbers(b.key))
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

/**
 * The numbers and lists a product's pages quote. None of it is needed to build: whatever
 * cannot be read keeps the copy in lib/, and a failure here is said and passed over.
 */
async function refreshNumbers(product, published, root) {
  const jobs = [];
  if (product.community) {
    jobs.push(
      (async () => {
        const people = product.contributorsSince ? await contributors(product) : [];
        await communityNumbers(product, published, people, root);
      })(),
    );
  }
  if (product.writtenHere?.includes('roadmap')) {
    jobs.push(roadmapIssues(product), roadmapRequests(product));
  }
  for (const result of await Promise.allSettled(jobs)) {
    if (result.status === 'rejected') {
      console.warn(`${product.repo}: a number was not refreshed (${result.reason?.message}).`);
    }
  }
}

async function main() {
  const contentOnly = process.argv.includes('--content');
  // The organisation's policies are the same for every product, so they are fetched once.
  const other = clone(shared.repo, shared.ref, ['.github']);
  try {
    for (const product of products) await syncProduct(product, other, contentOnly);
  } finally {
    other.cleanup();
  }

  // Last, what all of it is made with.
  if (!contentOnly) await builtWith();
}

async function syncProduct(product, other, contentOnly) {
  const { slug: productSlug, repo, extraPages } = product;
  const prefix = productSlug.toUpperCase();
  const ref = process.env[`${prefix}_DOCS_REF`] || product.ref;
  const outDir = join(contentDir, productSlug);
  const { root, cleanup } = checkout(product, ref);
  const published = await publishedReleases(repo, productSlug);
  try {
    // Every page to write: where its file is, and which repo it came from.
    const own = [
      ...readdirSync(join(root, 'docs'))
        .filter((name) => name.endsWith('.md'))
        .map((name) => `docs/${name}`),
      ...Object.keys(extraPages).filter((path) => existsSync(join(root, path))),
    ].map((path) => ({ path, root, repo, ref, slug: slugOf(path, extraPages) }));
    const borrowed = Object.entries(shared.pages)
      .filter(([path]) => existsSync(join(other.root, path)))
      .map(([path, slug]) => ({
        path,
        root: other.root,
        repo: shared.repo,
        ref: shared.ref,
        slug,
      }));
    const sources = [...own, ...borrowed];
    const slugs = new Map(sources.map((source) => [source.path, source.slug]));

    // Everything this script wrote last time; .mdx pages and meta.json are kept.
    const generated = (dir) =>
      existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')) : [];
    for (const name of generated(outDir)) rmSync(join(outDir, name));
    rmSync(join(outDir, 'contribute'), { recursive: true, force: true });
    // readme.mdx and roadmap.mdx are written over in place: removing them first makes a
    // running dev server lose the page for a moment, and sometimes for good.
    // The shared pages written in this repo, pointed at this product's docs.
    for (const name of readdirSync(shared.dir, { recursive: true })) {
      const from = join(shared.dir, name);
      if (!/\.(mdx|json)$/.test(name)) continue;
      mkdirSync(join(outDir, name, '..'), { recursive: true });
      writeFileSync(
        join(outDir, name),
        readFileSync(from, 'utf8').replaceAll('{{docs}}', `/docs/${productSlug}`),
      );
    }
    rmSync(join(outDir, 'changelog'), { recursive: true, force: true });
    let releaseCount = 0;

    for (const source of sources) {
      const { path: repoPath, slug } = source;
      const links = { product: productSlug, repo: source.repo, ref: source.ref };
      const markdown = readFileSync(join(source.root, repoPath), 'utf8');
      if (slug === 'changelog') {
        const rewrite = (body) => rewriteLinks(body, repoPath, slugs, links);
        releaseCount = writeChangelog(markdown, repoPath, outDir, product, rewrite, published);
        continue;
      }
      if (product.writtenHere?.includes(slug)) continue;
      if (slug === 'readme') {
        writeFileSync(
          // As MDX, so the README's own HTML (its folded list, its table) is kept.
          join(outDir, 'readme.mdx'),
          `${[
            '---',
            `title: ${JSON.stringify(`${product.name} readme`)}`,
            `description: ${JSON.stringify(`The README of the ${product.name} repository.`)}`,
            `source: ${JSON.stringify(repoPath)}`,
            '---',
            '',
          ].join('\n')}${rewriteLinks(readmeBody(markdown, product), repoPath, slugs, links)}`,
        );
        continue;
      }
      const split = splitTitle(markdown, slug);
      const title = curlQuotes(split.title);
      const body = curlQuotes(split.body);
      const description = describe(body);
      const frontmatter = [
        '---',
        `title: ${JSON.stringify(product.titles[slug] ?? shared.titles[slug] ?? title)}`,
        ...(description ? [`description: ${JSON.stringify(description)}`] : []),
        ...((product.icons[slug] ?? shared.icons[slug])
          ? [`icon: ${product.icons[slug] ?? shared.icons[slug]}`]
          : []),
        `source: ${JSON.stringify(repoPath)}`,
        // Where to open the file, for a page whose file is not in the product's own repo.
        ...(source.repo === repo
          ? []
          : [
              'shared: true',
              `sourceUrl: ${JSON.stringify(`https://github.com/${source.repo}/blob/${source.ref}/${repoPath}`)}`,
            ]),
        '---',
        '',
      ].join('\n');
      // The roadmap is written as MDX, so its lists can be drawn as a board.
      const file = join(outDir, slug === 'roadmap' ? 'roadmap.mdx' : `${slug}.md`);
      mkdirSync(join(file, '..'), { recursive: true });
      const linked = rewriteLinks(body, repoPath, slugs, links);
      writeFileSync(file, frontmatter + (slug === 'roadmap' ? roadmapBody(linked) : linked));
    }

    console.log(
      `Synced ${sources.length} ${productSlug} pages and ${releaseCount} releases from ${process.env[`${prefix}_DOCS_DIR`] ?? `${repo}@${ref}`}`,
    );
    // After the pages, and while the checkout is still there to read CREDITS.md from.
    if (!contentOnly) await refreshNumbers(product, published, root);
  } finally {
    cleanup();
  }
}

// Imported by its tests, this file does nothing; run, it syncs.
if (import.meta.main) await main();

export {
  appDownloads,
  channelOf,
  curlQuotes,
  linkMentions,
  longDate,
  parseTag,
  settle,
  splitReleases,
  stageRank,
  tidyNotes,
};
