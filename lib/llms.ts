import type * as PageTree from 'fumadocs-core/page-tree';
import { feedUrl } from '@/lib/releases';
import { changelogUrl, type ProductSlug, products, siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

type Link = [title: string, path: string, about: string];

// The site's own pages for each product, ahead of its docs. Each line says what a reader
// finds there, as the page's own description does.
const sitePages: Record<ProductSlug, Link[]> = {
  thaw: [
    ['Thaw', '/', 'What Thaw does, how to install it, and a demo you can try in the browser.'],
    [
      'Frequently asked questions',
      '/faq',
      'Whether Thaw is free, which macOS it needs, what its permissions are for, and how to remove it.',
    ],
    [
      'Roadmap',
      '/roadmap',
      'What the Thaw team is working on now, what comes next, what macOS is holding back, and what has shipped.',
    ],
    [
      'ThawUI roadmap',
      '/roadmap/thawui',
      'The design Thaw and Floe share: what is being built and what has shipped.',
    ],
    ['Changelog', changelogUrl('thaw'), 'Every Thaw release and what it changed.'],
    ['Release feed', feedUrl('thaw'), 'Thaw’s releases as an Atom feed.'],
  ],
  floe: [
    ['Floe', '/floe', 'What Floe does, how to get it, and a demo of the launcher in the browser.'],
    [
      'Floe roadmap',
      '/floe/roadmap',
      'What comes next for Floe, what comes later, what is not planned, and what has shipped.',
    ],
    [
      'Floe community',
      '/floe/community',
      'Floe in numbers, where to find the people behind it, and who has contributed.',
    ],
    [
      'What Verified means for Floe',
      '/floe/verified',
      'What SLSA, the OpenSSF badges, the Scorecard and test coverage are, who vouches for each, and where Floe stands.',
    ],
    ['Floe changelog', changelogUrl('floe'), 'Every Floe release and what it changed.'],
    ['Floe release feed', feedUrl('floe'), 'Floe’s releases as an Atom feed.'],
  ],
};

const optional: Link[] = [
  [
    'Community',
    '/community',
    'Thaw in numbers, where to find the people behind it, and who has contributed.',
  ],
  [
    'What Verified means',
    '/verified',
    'What SLSA, the OpenSSF badges, the Scorecard and test coverage are, who vouches for each, and where Thaw stands.',
  ],
  [
    'Built with',
    '/built-with',
    'What Thaw, Floe and this site are built with, the services the project runs on, the licences everything is under, and who it owes.',
  ],
  [
    'Privacy',
    '/privacy',
    'What this website collects about its visitors: no analytics, no cookies and no tracking.',
  ],
  [
    'Every page in full',
    '/llms-full.txt',
    'The text of the site’s pages and its docs in one file.',
  ],
  [
    'Search API',
    '/openapi.json',
    'Search the docs and release notes from code: GET /api/search?query=…, read-only, no key. Described in OpenAPI.',
  ],
  [
    'Installing Thaw',
    '/.well-known/agent-skills/install-thaw/SKILL.md',
    'An Agent Skill: which Thaw for which macOS, how to install it, and its permissions.',
  ],
  [
    'Troubleshooting Thaw',
    '/.well-known/agent-skills/troubleshoot-thaw/SKILL.md',
    'An Agent Skill: what to check when Thaw or a menu bar item misbehaves.',
  ],
  [
    'Driving Thaw with thaw:// links',
    '/.well-known/agent-skills/thaw-url-scheme/SKILL.md',
    'An Agent Skill for AI agents on a Mac with Thaw: show items, open search, read and change settings.',
  ],
];

const intro = `# Thaw

> Thaw is a free, open source menu bar manager for macOS. It hides and shows menu bar items, and finds them by search or a hotkey. Floe, from the same people, is an open source launcher for macOS that runs Raycast extensions unmodified. It is a separate app and still early.

Thaw 3, in beta, runs on macOS 27, Thaw 2 on macOS 26, Thaw 2.2, in beta, on macOS 15, and Thaw 1 on macOS 14. Thaw is under GPL-3.0 and Floe under AGPL-3.0. Thaw has no account, no analytics and no tracking.

When to use this site: someone asks how to hide, show or rearrange menu bar items on a Mac, which menu bar manager to use on macOS 26 or 27, how to install, update or remove Thaw, what Thaw’s permissions are for, what Thaw sends over the network, how to drive Thaw from scripts, Shortcuts or AI agents, or how to make an app’s own menu bar items work with Thaw. Floe’s pages are for someone looking for a launcher for macOS that runs Raycast extensions.

Every page below can also be read as Markdown: add \`.md\` to its address, or ask for \`text/markdown\`. The home page is at /index.md. An AI agent can learn to install Thaw, troubleshoot it and drive it from the skills listed at /.well-known/agent-skills/index.json.`;

const line = ([title, path, about]: Link, indent = '') =>
  `${indent}- [${title}](${siteUrl}${path}): ${about}`;

function pageLine(node: PageTree.Item, indent = '') {
  const page = source.getNodePage(node);
  const title = page?.data.title ?? String(node.name);
  return line([title, node.url, page?.data.description ?? ''], indent).replace(/: $/, '');
}

// A folder's pages, its own first, a step further in.
function folderLines(folder: PageTree.Folder): string[] {
  const own = folder.index ? [pageLine(folder.index)] : [`- ${String(folder.name)}`];
  const inner = folder.children.flatMap((child) =>
    child.type === 'page'
      ? [pageLine(child, '  ')]
      : child.type === 'folder'
        ? folderLines(child).map((text) => `  ${text}`)
        : [],
  );
  return [...own, ...inner];
}

/**
 * A product's docs as sections: the pages before the first heading in the sidebar join the
 * product's own section, and each heading after begins one of its own. A heading with no
 * pages under it is left out.
 */
function docsSections(slug: ProductSlug) {
  const { name } = products[slug];
  const root = source
    .getPageTree()
    .children.find((node): node is PageTree.Folder => node.type === 'folder' && node.$id === slug);
  const sections: { heading?: string; lines: string[] }[] = [{ lines: [] }];
  for (const node of root?.children ?? []) {
    if (node.type === 'separator') {
      const heading = String(node.name ?? '');
      sections.push({
        heading: heading.includes(name) ? heading : `${name} for ${heading.toLowerCase()}`,
        lines: [],
      });
    } else {
      sections.at(-1)?.lines.push(...(node.type === 'page' ? [pageLine(node)] : folderLines(node)));
    }
  }
  return sections;
}

/**
 * The site as llms.txt (https://llmstxt.org) describes it: what Thaw and Floe are, then
 * each product's own pages and its docs, then the pages a reader can skip.
 */
export function llmsIndex() {
  const parts = [intro];
  for (const slug of Object.keys(products) as ProductSlug[]) {
    const [own, ...rest] = docsSections(slug);
    parts.push(
      [
        `## ${products[slug].name}`,
        '',
        ...sitePages[slug].map((link) => line(link)),
        ...own.lines,
      ].join('\n'),
    );
    for (const { heading, lines } of rest) {
      if (lines.length > 0) parts.push([`## ${heading}`, '', ...lines].join('\n'));
    }
  }
  parts.push(['## Optional', '', ...optional.map((link) => line(link))].join('\n'));
  return `${parts.join('\n\n')}\n`;
}
