import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { made, ours, packages, runsOn, thanks } from '@/lib/built-with';
import community from '@/lib/community.json';
import {
  contributors,
  counted,
  ways as joinIn,
  numbers,
  translatorCount,
} from '@/lib/community-page';
import { floeContributors, floeCounted, floeNumbers, floeWays } from '@/lib/floe-community';
import floeCommunity from '@/lib/floe-community.json';
import {
  floeAlso,
  floeAskAi,
  floeDownload,
  floeFeatures,
  floeInstallFacts,
  floeWorksWith,
} from '@/lib/floe-features';
import { installFacts, installWays } from '@/lib/install';
import { privacyFacts, privacyOthers } from '@/lib/privacy';
import { datedReleases } from '@/lib/releases';
import requests from '@/lib/roadmap-requests.json';
import {
  changelogUrl,
  docsRoute,
  type ProductSlug,
  products,
  repoUrl,
  siteUrl,
} from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { docsLlms, source } from '@/lib/source';
import { thawFaq } from '@/lib/thaw-faq';
import { thawAlso, thawFeatures, thawWorksWith } from '@/lib/thaw-features';
import { meanings, verifiedFrom } from '@/lib/verified';

// The site's own pages as Markdown, for AI tools: what each page says, read from the same
// data the page is drawn from, so the two cannot come to say different things. A page
// asked for with `Accept: text/markdown`, or at its address plus .md, is given this
// (proxy.ts).

type Named = string | { name: string; about?: string };

const absolute = (href: string) => (href.startsWith('/') ? `${siteUrl}${href}` : href);
const link = (text: string, href: string) => `[${text}](${absolute(href)})`;
const named = (item: Named) =>
  typeof item === 'string' ? `- ${item}` : `- ${item.name}${item.about ? `: ${item.about}` : ''}`;
const facts = (list: readonly { label: string; value: string; detail: string }[]) =>
  list.map((fact) => `- ${fact.label}: ${fact.value}. ${fact.detail}`);

function page(title: string, summary: string, ...sections: (string | string[])[]) {
  return `${[
    `# ${title}`,
    `> ${summary}`,
    ...sections.map((s) => (Array.isArray(s) ? s.join('\n') : s)),
  ]
    .join('\n\n')
    // Links inside the site's own text point at the site, wherever the file is read.
    .replace(/\]\(\//g, `](${siteUrl}/`)}\n`;
}

function home() {
  const ways = installWays.map((way) =>
    'command' in way
      ? [
          `### ${way.label}`,
          '',
          `${way.about} Run \`${way.command}\`.`,
          '',
          ...facts(installFacts[way.id]),
        ].join('\n')
      : [
          `### ${way.label}`,
          '',
          `${way.note} ${link('Releases', way.href)}`,
          '',
          ...facts(installFacts[way.id]),
        ].join('\n'),
  );
  return page(
    'Thaw',
    `${sitePages.home.title} ${sitePages.home.shared}`,
    '## Install',
    ways.join('\n\n'),
    '## Features',
    thawFeatures.map((feature) => `- **${feature.title}.** ${feature.detail}`),
    `Some of these features are only in Thaw 3. ${link('Which Thaw runs on which macOS', `${docsRoute}/thaw/versions`)}.`,
    ...thawAlso.flatMap((group) => [`### ${group.group}`, group.names.map(named)]),
    '## Works with',
    thawWorksWith.map((item) => `- ${link(item.name, item.href)}: ${item.how}`),
    '## Questions',
    thawFaq.slice(0, 4).map((entry) => `- **${entry.question}** ${entry.answer}`),
    `More in the ${link('frequently asked questions', '/faq')}, the ${link('documentation', `${docsRoute}/thaw`)} and the ${link('roadmap', '/roadmap')}.`,
  );
}

function floe() {
  const stable = datedReleases('floe').find((release) => release.channel === 'Stable');
  return page(
    'Floe',
    `${sitePages.floe.title} ${sitePages.floe.shared}`,
    '## Install',
    `${stable ? `Floe ${stable.tag}. ` : ''}Open the disk image and move Floe to Applications: ${link('Download Floe', floeDownload)}.`,
    facts(floeInstallFacts),
    '## Features',
    floeFeatures.map((feature) => `- **${feature.title}.** ${feature.detail}`),
    ...floeAlso.flatMap((group) => [`### ${group.group}`, group.names.map(named)]),
    '## Works with',
    floeWorksWith.map((item) => `- ${link(item.name, item.href)}: ${item.how}`),
    '## Ask AI with',
    floeAskAi.map((item) => `- ${link(item.name, item.href)}`),
    `Raycast is a trademark of Raycast Technologies Inc. Floe is not affiliated with Raycast. More in the ${link('Floe documentation', `${docsRoute}/floe`)} and on the ${link('Floe roadmap', '/floe/roadmap')}.`,
  );
}

function faq() {
  return page(
    sitePages.faq.title.replace(/\.$/, ''),
    sitePages.faq.shared,
    ...thawFaq.map((entry) =>
      [
        `## ${entry.question}`,
        '',
        entry.answer,
        ...(entry.steps ? ['', ...entry.steps.map((step, i) => `${i + 1}. ${step}`)] : []),
        ...(entry.more ? ['', link(entry.more.label, entry.more.href)] : []),
      ].join('\n'),
    ),
  );
}

/** A roadmap's MDX, with its components said as headings and lists. */
function roadmap(file: string, title: string, summary: string) {
  const issues = `${repoUrl('thaw')}/issues`;
  const asked = (requests as { number: number; title: string; votes: number }[]).map(
    (request) => `- ${link(request.title, `${issues}/${request.number}`)} (${request.votes} votes)`,
  );
  const body = readFileSync(join(process.cwd(), 'content/site', file), 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<\/?Roadmap>/g, '')
    .replace(/<RoadmapList title="([^"]+)"[^>]*?note="([^"]+)"[^>]*>/g, '## $1\n\n$2\n')
    .replace(/<RoadmapList title="([^"]+)"[^>]*>/g, '## $1')
    .replace(/<RoadmapGroup name="([^"]+)"[^>]*>/g, '\n### $1')
    .replace(/<\/Roadmap(List|Group)>/g, '')
    .replace(/<Issue n=\{(\d+)\} \/>/g, `([#$1](${issues}/$1))`)
    .replace(/\s*<Marks of="[^"]*" \/>/g, '')
    .replace(
      /<RoadmapRequests \/>/g,
      [
        '## Asked for',
        '',
        'The feature requests open on GitHub, most wanted first.',
        '',
        ...asked,
      ].join('\n'),
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return page(title, summary, body);
}

function privacy() {
  return page(
    'Privacy',
    'This site does not track you. This page is about the website, not the Thaw app.',
    '## What the site collects',
    privacyFacts.map((fact) => `- **${fact.name}.** ${fact.said}`),
    '## Who else is involved',
    privacyOthers.map((other) => `- **${other.name}.** ${other.said}`),
    `What the app sends: ${link('What Thaw sends over the network', `${docsRoute}/thaw/network`)}. The site’s code is public: ${link('thaw-app/website', 'https://github.com/thaw-app/website')}.`,
  );
}

function changelog(product: ProductSlug) {
  const { name } = products[product];
  return page(
    `${name} changelog`,
    `Every release of ${name}, newest first, with the macOS it runs on. Each links to its notes.`,
    datedReleases(product).map(
      (release) =>
        `- ${link(`${name} ${release.tag}`, release.url)} (${release.date}, ${[release.channel, release.os].filter(Boolean).join(', ')})${release.summary ? `: ${release.summary}` : ''}`,
    ),
  );
}

function communityPage() {
  return page(
    'Community',
    'Thaw is free and open source, and built by the people who use it: they report its bugs, write its fixes and translate it.',
    '## In numbers',
    [
      ...numbers.map(
        (number) => `- ${number.label}: ${number.value.toLocaleString('en')} (${number.unit})`,
      ),
      '',
      `${counted.day ? `Counted on ${counted.day}. ` : ''}${counted.older.map((entry) => `${entry.name} are from ${entry.day}. `).join('')}Downloads count each time the app or an update was fetched, not how many people use it.`,
    ],
    '## The team',
    community.team.map(
      (member) => `- ${link(member.name ?? member.login, `https://github.com/${member.login}`)}`,
    ),
    `## Contributors (${contributors.length})`,
    contributors
      .map((person) => link(person.login, `https://github.com/${person.login}`))
      .join(', '),
    `## Translators (${translatorCount} people across ${community.translators.length} languages)`,
    community.translators.map(
      (group) => `- ${group.language}: ${group.people.map((person) => person.name).join(', ')}`,
    ),
    '## Take part',
    joinIn.map((way) => `- ${link(way.title, way.href)}: ${way.detail}`),
  );
}

function floeCommunityPage() {
  return page(
    'Floe community',
    'Floe is free and open source, under AGPL-3.0. It began in October 2026, and these are the people who have worked on it so far.',
    '## In numbers',
    [
      ...floeNumbers.map(
        (number) => `- ${number.label}: ${number.value.toLocaleString('en')} (${number.unit})`,
      ),
      '',
      `${floeCounted.day ? `Counted on ${floeCounted.day}. ` : ''}${floeCounted.older.map((entry) => `${entry.name} are from ${entry.day}. `).join('')}Downloads and Homebrew installs are added once Floe has a release to count them from.`,
    ],
    '## The team',
    floeCommunity.team.map(
      (member) => `- ${link(member.name ?? member.login, `https://github.com/${member.login}`)}`,
    ),
    `## Contributors (${floeContributors.length})`,
    floeContributors
      .map((person) => link(person.login, `https://github.com/${person.login}`))
      .join(', '),
    '## Take part',
    floeWays.map((way) => `- ${link(way.title, way.href)}: ${way.detail}`),
  );
}

function verifiedPage() {
  const now = verifiedFrom(community.assurance);
  return page(
    'What Verified means',
    `${sitePages.verified.title} These are the outside checks on how Thaw is built and released: what each one is, where Thaw stands, and who vouches for it.`,
    ...meanings.map((entry) => {
      const value = now.find((item) => item.id === entry.id)?.value;
      return [
        `## ${entry.term}${value ? `: ${value}` : ''}`,
        '',
        entry.meaning,
        '',
        `Who says so: ${entry.checkedBy} ${link(new URL(entry.href).hostname.replace(/^www\./, ''), entry.href)}`,
      ].join('\n');
    }),
    `How to check a release yourself: ${link('Verifying releases', `${docsRoute}/thaw/verifying-releases`)}.`,
  );
}

function builtWith() {
  const tools = (list: typeof made) =>
    list.map(
      (tool) =>
        `- ${link(tool.name, tool.href)}: ${tool.use}${tool.users ? ` (${tool.users.join(', ')})` : ''}`,
    );
  return page(
    'Built with',
    'What Thaw and Floe are built with: the languages and tools behind the two apps and this site, the services the project runs on, the licences everything is under, and the people and projects it owes.',
    '## Made with',
    tools(made),
    '## Runs on',
    tools(runsOn),
    '## Licences',
    ours.map((item) => `- ${link(item.name, item.href)}: ${item.license}. ${item.detail}`),
    '## Thanks',
    thanks.map((item) => `- ${link(item.to, item.href)}: ${item.forWhat}`),
    ...packages.flatMap(({ title, list }) => [
      `## ${title}`,
      list.map((item) => `- ${link(item.name, item.url)}: ${item.license ?? 'see its repository'}`),
    ]),
  );
}

const pages: Record<string, () => string | Promise<string>> = {
  '/': home,
  '/floe': floe,
  '/faq': faq,
  '/roadmap': () =>
    roadmap(
      'roadmap.mdx',
      'Thaw roadmap',
      'What the Thaw team is working on now, what comes next, what macOS is holding back, and what has shipped.',
    ),
  '/floe/roadmap': () => roadmap('floe-roadmap.mdx', 'Floe roadmap', sitePages.floeRoadmap.shared),
  '/privacy': privacy,
  '/community': communityPage,
  '/floe/community': floeCommunityPage,
  '/verified': verifiedPage,
  '/built-with': builtWith,
  [changelogUrl('thaw')]: () => changelog('thaw'),
  [changelogUrl('floe')]: () => changelog('floe'),
};

/** The site's own pages in Markdown, one after the other, for llms-full.txt. */
export async function allSiteMarkdown() {
  const texts = await Promise.all(Object.values(pages).map((made) => made()));
  return texts.join('\n\n');
}

/**
 * About how many tokens a Markdown text is, for the x-markdown-tokens header: about four
 * characters a token, which is close enough for a tool deciding whether to read it.
 */
export const roughTokens = (text: string) => String(Math.ceil(text.length / 4));

/** Every site address that has a Markdown version, release notes included. */
export function siteMarkdownPaths() {
  const releases = source
    .getPages()
    .filter((entry) => entry.url.startsWith(`${changelogUrl('thaw')}/`) && entry.data.release)
    .map((entry) => entry.url);
  return [...Object.keys(pages), ...releases];
}

/** A site page as Markdown, or nothing for an address that has none. */
export async function siteMarkdown(path: string) {
  const made = pages[path];
  if (made) return made();
  const release = source.getPages().find((entry) => entry.url === path && entry.data.release);
  return release ? docsLlms.page(release) : undefined;
}

/** What an address with no page says, for an AI tool that asked for Markdown. */
export function missingMarkdown(path: string) {
  return page('Not found', `There is no page at ${path} on this site.`, [
    `- ${link('Every page on the site, for AI tools', '/llms.txt')}`,
    `- ${link('Thaw documentation', `${docsRoute}/thaw`)}`,
    `- ${link('Floe documentation', `${docsRoute}/floe`)}`,
    `- ${link('Sitemap', '/sitemap.xml')}`,
  ]);
}
