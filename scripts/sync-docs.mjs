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

// The parsers are tested through here, where they have always been imported from.
export { longDate } from '../lib/format.mjs';
export { appDownloads, settle } from './sync/numbers.mjs';
export {
  channelOf,
  curlQuotes,
  linkMentions,
  parseTag,
  splitReleases,
  stageRank,
  tidyNotes,
} from './sync/text.mjs';
