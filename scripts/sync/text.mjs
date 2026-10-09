// What the sync does to the words it fetches: the parsers and rewriters, none of which
// reads a file or the network, so each can be tested by what it returns.

import { posix } from 'node:path';

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

const digitsOf = (text) => (text.match(/\d+/g) ?? []).map(Number);

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
  return [kind, ...digitsOf(stage)];
}

// GitHub draws ":grin:" as a face; here it would stay as typed. The few that notes use.
const emoji = {
  grin: '😁',
  smile: '😄',
  tada: '🎉',
  rocket: '🚀',
  warning: '⚠️',
  bug: '🐛',
  heart: '❤️',
};

/** Turns GitHub's emoji shortcodes into the emoji, outside code. One it does not know is left. */
function emojiShortcodes(markdown) {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (fenced) return line;
      return line
        .split(/(`[^`]*`)/)
        .map((part) =>
          part.startsWith('`')
            ? part
            : part.replace(/:([a-z_]+):/g, (all, name) => emoji[name] ?? all),
        )
        .join('');
    })
    .join('\n');
}

/**
 * How many things a release's notes list as new and how many as fixed: the items of the
 * lists under a heading that says so ("New", "New Features", "New & Improved"; "Fixed",
 * "Fixes", "Improvements & Fixes"). Notes written some other way count as none, so a total
 * of these is a floor and not a tally.
 */
function countChanges(markdown) {
  const counted = { added: 0, fixed: 0 };
  let kind = null;
  let depth = 0;
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const heading = line.match(/^(#{2,4})\s+(.*)/);
    if (heading) {
      const level = heading[1].length;
      const name = heading[2].toLowerCase();
      // A deeper heading inside a counted section is still that section.
      if (kind === null || level <= depth) {
        kind = /\bfix/.test(name)
          ? 'fixed'
          : /\bnew\b|feature|added/.test(name) && !name.includes('contributor')
            ? 'added'
            : null;
        depth = level;
      }
      continue;
    }
    // One thing to an item, bulleted or numbered: what is listed under an item is part of it.
    if (kind && /^([-*]|\d+\.) /.test(line)) counted[kind]++;
  }
  return counted;
}

export {
  channelOf,
  countChanges,
  curlQuotes,
  descending,
  describe,
  digitsOf,
  emojiShortcodes,
  linkMentions,
  parseTag,
  promoteHeadings,
  readmeBody,
  rewriteLinks,
  roadmapBody,
  splitReleases,
  splitSummary,
  splitTitle,
  stageRank,
  swiftAttributes,
  tidyNotes,
};
