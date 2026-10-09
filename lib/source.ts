import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins/remark-mdx-mermaid';
import { createGetUrl, llms, loader } from 'fumadocs-core/source';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { z } from 'zod';
import { remarkGithubAlerts } from './remark-github-alerts';
import { changelogUrl, docsRoute, products } from './shared';

function withoutIcon<Node extends { icon?: unknown }>(node: Node) {
  node.icon = undefined;
  return node;
}

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // All set by scripts/sync-docs.mjs. source is the file's path in the app
    // repo; release marks one release's page in a changelog, releaseIndex the
    // page that lists them all, and releaseGroup a page that lists one
    // version's pre-releases.
    schema: pageSchema.extend({
      source: z.string().optional(),
      sourceUrl: z.string().optional(),
      // True for a page every product's docs carry a copy of.
      shared: z.boolean().optional(),
      releaseIndex: z.boolean().optional(),
      releaseGroup: z.string().optional(),
      release: z
        .object({
          tag: z.string(),
          // The version number the release belongs to, such as "2.0.0" for "2.0.0-rc.3".
          version: z.string(),
          // What to call that group when it is not a number, such as "Pre-3.0.0".
          versionLabel: z.string().optional(),
          // A line about that group, where its history needs telling.
          versionNote: z.string().optional(),
          channel: z.string(),
          order: z.number(),
          // True for the release its version is named for.
          final: z.boolean(),
          url: z.string().optional(),
          name: z.string().optional(),
          // The macOS the release runs on, such as "macOS 27".
          os: z.string().optional(),
          date: z.string().optional(),
          summary: z.string().optional(),
          // How many things its notes list as new and as fixed, counted by their headings.
          added: z.number().optional(),
          fixed: z.number().optional(),
        })
        .optional(),
    }),
    // Mermaid code blocks become diagrams, and GitHub's "> [!NOTE]" quotes
    // become callouts.
    mdxOptions: applyMdxPreset({ remarkPlugins: [remarkMdxMermaid, remarkGithubAlerts] }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

const docsUrl = createGetUrl(docsRoute);

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  // A changelog and its releases are kept with their product's docs, where the sync writes
  // them, and served as the site's own pages: everything that asks a page for its address
  // (search, the feeds, the sitemap, a link in a release's notes) is given that one.
  url: (slugs, locale) =>
    slugs[1] === 'changelog' && slugs[0] in products
      ? changelogUrl(slugs[0], slugs.slice(2))
      : docsUrl(slugs, locale),
  source: docs.toFumadocsSource(),
  // No icon is drawn beside a page's name in the sidebar: a column of twenty-odd of them
  // was the busiest thing on a docs page. A page may still name one (`icon`); it is taken
  // off here, since a name left as it is would be printed as a word.
  plugins: [
    {
      name: 'thaw:no-icons',
      transformPageTree: { file: withoutIcon, folder: withoutIcon, separator: withoutIcon },
    },
  ],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
