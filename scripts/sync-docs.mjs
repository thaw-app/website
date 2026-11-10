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

//
// The work is in scripts/sync: what is read and written (config), the parsers (text), the
// changelog, the numbers and the roadmap. This file fetches the repos and writes the pages.

import { execFile } from 'node:child_process';
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
import { publishedReleases, writeChangelog } from './sync/changelog.mjs';
import { contentDir, products, shared } from './sync/config.mjs';
import { communityNumbers, contributors } from './sync/numbers.mjs';
import { roadmapIssues, roadmapRequests } from './sync/roadmap.mjs';
import {
  curlQuotes,
  describe,
  readmeBody,
  rewriteLinks,
  roadmapBody,
  splitTitle,
} from './sync/text.mjs';

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

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs fn, and again after each pause when it throws; the last error is the one thrown.
 * Tries once more than there are pauses.
 */
async function retry(fn, pauses = [2_000, 5_000], wait = pause) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= pauses.length) throw error;
      console.warn(
        `Attempt ${attempt + 1} failed (${error.message.split('\n')[0]}); trying again in ${pauses[attempt] / 1000} s.`,
      );
      await wait(pauses[attempt]);
    }
  }
}

/** git, run without blocking, so the clones and fetches of the products overlap. */
function git(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'git',
      args,
      // A clone that hangs would hang the build with it.
      { cwd, timeout: 120_000 },
      (error, _stdout, stderr) => {
        // What git says goes to the build log, as it did when it ran with stderr inherited.
        if (stderr) process.stderr.write(stderr);
        if (error) reject(error);
        else resolve();
      },
    );
    child.stdin?.end();
  });
}

/**
 * A sparse, blobless clone: the named folders and the root files only. A clone is the one
 * network step a build cannot do without, so a failed one is tried again, each time in a
 * fresh folder.
 */
function clone(repo, ref, folders) {
  return retry(async () => {
    const root = mkdtempSync(join(tmpdir(), 'thaw-docs-'));
    try {
      await git(root, [
        'clone',
        '--depth',
        '1',
        '--filter=blob:none',
        '--sparse',
        '--branch',
        ref,
        `https://github.com/${repo}.git`,
        '.',
      ]);
      await git(root, ['sparse-checkout', 'set', ...folders]);
    } catch (error) {
      rmSync(root, { recursive: true, force: true });
      throw error;
    }
    return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
  });
}

function slugOf(repoPath, extraPages) {
  return extraPages[repoPath] ?? posix.basename(repoPath, '.md').toLowerCase().replaceAll('_', '-');
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
  if (product.roadmap) {
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
  // It is fetched while the products fetch theirs; each waits for it only when it needs it.
  const other = clone(shared.repo, shared.ref, ['.github']);
  other.catch(() => {});
  try {
    // The products write to folders and files of their own (content/docs/<slug>, and
    // lib/ and .cache/ files named for the product), so they run side by side. All are
    // let finish, so each cleans up its checkout, before a failure is thrown.
    const results = await Promise.allSettled(
      products.map((product) => syncProduct(product, other, contentOnly)),
    );
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
  } finally {
    (await other.catch(() => null))?.cleanup();
  }

  // Last, what all of it is made with.
  if (!contentOnly) await builtWith();
}

async function syncProduct(product, other, contentOnly) {
  const { slug: productSlug, repo, extraPages } = product;
  const prefix = productSlug.toUpperCase();
  const ref = process.env[`${prefix}_DOCS_REF`] || product.ref;
  const outDir = join(contentDir, productSlug);
  // The checkout and the release list do not depend on each other, so they are fetched together.
  const [fetched, published] = await Promise.allSettled([
    Promise.resolve().then(() => checkout(product, ref)),
    publishedReleases(repo, productSlug),
  ]).then(([checked, releases]) => {
    if (checked.status === 'rejected') throw checked.reason;
    return [checked.value, releases.value];
  });
  const { root, cleanup } = fetched;
  try {
    // Every page to write: where its file is, and which repo it came from.
    const own = [
      ...readdirSync(join(root, 'docs'))
        .filter((name) => name.endsWith('.md'))
        .map((name) => `docs/${name}`),
      ...Object.keys(extraPages).filter((path) => existsSync(join(root, path))),
    ].map((path) => ({ path, root, repo, ref, slug: slugOf(path, extraPages) }));
    const { root: otherRoot } = await other;
    const borrowed = Object.entries(shared.pages)
      .filter(([path]) => existsSync(join(otherRoot, path)))
      .map(([path, slug]) => ({
        path,
        root: otherRoot,
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
      const description =
        // biome-ignore lint/correctness/usePlaywrightValidDescribeCallback: our own describe, not Playwright's
        product.descriptions?.[slug] ?? shared.descriptions[slug] ?? describe(body);
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

// The parsers are tested through here, where they have always been imported from.
export { longDate } from '../lib/format.mjs';
export { groupReleases, systemOf } from './sync/changelog.mjs';
export { appDownloads, settle } from './sync/numbers.mjs';
export {
  channelOf,
  countChanges,
  curlQuotes,
  emojiShortcodes,
  linkMentions,
  parseTag,
  peopleIn,
  readmeBody,
  releaseBoilerplate,
  rewriteLinks,
  splitReleases,
  stageRank,
  tidyNotes,
} from './sync/text.mjs';
// Tested through here too.
export { retry };
