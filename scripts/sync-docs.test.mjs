// The parsers that turn the app repos' Markdown into the site's pages. They fail quietly:
// a change in how a changelog is written upstream only mis-files releases here. These
// pin what each does with the shapes the changelogs have today.
import { expect, test } from 'bun:test';
import {
  channelOf,
  groupReleases,
  linkMentions,
  longDate,
  parseTag,
  peopleIn,
  readmeBody,
  rewriteLinks,
  splitReleases,
  stageRank,
  tidyNotes,
} from './sync-docs.mjs';

test('a tag says which channel a release is on', () => {
  expect(channelOf('2.0.1')).toBe('Stable');
  expect(channelOf('3.0.0-beta.2')).toBe('Beta');
  expect(channelOf('3.0.0-alpha.4.1')).toBe('Alpha');
  expect(channelOf('2.1.0-rc.1')).toBe('Release candidate');
  expect(channelOf('macos-27-preview-5')).toBe('Preview');
  expect(channelOf('Unreleased')).toBe('Unreleased');
});

test('a tag splits into its version and its stage', () => {
  expect(parseTag('3.0.0-beta.2')).toEqual({ version: '3.0.0', stage: 'beta.2' });
  expect(parseTag('2.0.1')).toEqual({ version: '2.0.1', stage: undefined });
  expect(parseTag('macos-27-preview-5')).toBeNull();
});

test('stages sort alpha, beta, release candidate, then the release itself', () => {
  const order = [undefined, 'rc.1', 'beta.2', 'beta.1', 'alpha.4.1', 'alpha.4']
    .map((stage) => ({ stage, rank: stageRank(stage) }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.rank.length, b.rank.length); i++) {
        const difference = (b.rank[i] ?? 0) - (a.rank[i] ?? 0);
        if (difference) return difference;
      }
      return 0;
    })
    .map((entry) => entry.stage);
  expect(order).toEqual([undefined, 'rc.1', 'beta.2', 'beta.1', 'alpha.4.1', 'alpha.4']);
});

const changelog = `# Changelog

## [3.0.0-beta.2] - 2026-10-06

**macOS 27 only · Build 112**

### New

- Triggers can show items while an app runs.

---

## [2.0.1] - 2026-09-02

### Fixed

- One thing.
`;

test('a changelog splits into its releases, each with its date and opening line', () => {
  const releases = splitReleases(changelog);
  expect(releases.map((release) => release.tag)).toEqual(['3.0.0-beta.2', '2.0.1']);
  expect(releases[0].date).toBe('2026-10-06');
  expect(releases[0].channel).toBe('Beta');
  expect(releases[0].summary).toBe('macOS 27 only · Build 112');
  // The rule between releases is not part of either.
  expect(releases[0].body).not.toContain('---');
  expect(releases[0].body).toContain('Triggers can show items');
  expect(releases[1].channel).toBe('Stable');
});

test('a release is given the commit its tag points at, whichever place its notes are', () => {
  const published = [
    { tag: '2.0.1', name: '2.0.1', body: '', date: '2026-09-02', commit: 'a1b2c3d4e5' },
    { tag: '1.2.0', name: '1.2.0', body: 'Older notes.', date: '2026-01-05', commit: 'f6e5d4c3b2' },
    { tag: '1.1.0', name: '1.1.0', body: 'A tag GitHub no longer lists.', date: '2025-12-01' },
  ];
  const releases = groupReleases(changelog, published, { repo: 'thaw-app/Thaw' }).flatMap(
    (group) => group.releases,
  );
  const commitOf = (tag) => releases.find((release) => release.tag === tag).commit;
  // In the changelog file, and only on GitHub.
  expect(commitOf('2.0.1')).toBe('a1b2c3d4e5');
  expect(commitOf('1.2.0')).toBe('f6e5d4c3b2');
  // Not published yet, and published without a tag left to find.
  expect(commitOf('3.0.0-beta.2')).toBeUndefined();
  expect(commitOf('1.1.0')).toBeUndefined();
});

test('what the changelog lists as not out yet is not a release', () => {
  const withUnreleased = changelog.replace(
    '## [3.0.0-beta.2]',
    '## [Unreleased]\n\n### Fixed\n\n- Not out yet.\n\n---\n\n## [3.0.0-beta.2]',
  );
  // The file is read as it is written, and the pages are made without it.
  expect(splitReleases(withUnreleased).map((release) => release.tag)).toContain('Unreleased');
  const tags = groupReleases(withUnreleased, [], { repo: 'thaw-app/Thaw' }).flatMap((group) =>
    group.releases.map((release) => release.tag),
  );
  expect(tags).toEqual(['3.0.0-beta.2', '2.0.1']);
});

test('a version the changelog dates as unreleased is not a release yet', () => {
  const withNext = changelog.replace(
    '## [3.0.0-beta.2]',
    '## [3.0.0-beta.3] - Unreleased\n\n### Fixed\n\n- Not out yet.\n\n---\n\n## [3.0.0-beta.2]',
  );
  const tags = groupReleases(withNext, [], { repo: 'thaw-app/Thaw' }).flatMap((group) =>
    group.releases.map((release) => release.tag),
  );
  expect(tags).toEqual(['3.0.0-beta.2', '2.0.1']);
});

test('issue numbers and names become links, and code is left alone', () => {
  const linked = linkMentions('Fixed by @diazdesandi in #1223.', 'thaw-app/Thaw');
  expect(linked).toContain('[@diazdesandi](https://github.com/diazdesandi)');
  expect(linked).toContain('[#1223](https://github.com/thaw-app/Thaw/issues/1223)');
  // A Swift attribute is not a person, and nothing inside code is touched.
  expect(linkMentions('Moved to @Observable.', 'thaw-app/Thaw')).toBe('Moved to @Observable.');
  expect(linkMentions('Run `gh issue view #12`.', 'thaw-app/Thaw')).toBe(
    'Run `gh issue view #12`.',
  );
  expect(linkMentions('```\n@someone #5\n```', 'thaw-app/Thaw')).toBe('```\n@someone #5\n```');
});

test('the people a release credits are the ones its notes name, each once', () => {
  const notes = linkMentions(
    'Fixed by @diazdesandi. Reported by @mi3suuu and @Diazdesandi.\n\n- Bumped by @dependabot.\n- Moved to @Observable.\n- Run `gh pr view @someone`.',
    'thaw-app/Thaw',
  );
  // In the order first named; a bot, a Swift attribute and a name inside code are no one.
  expect(peopleIn(notes)).toEqual(['diazdesandi', 'mi3suuu']);
  expect(peopleIn('Nobody is named here.')).toEqual([]);
});

test('release notes have their headings brought up to start at the second level', () => {
  expect(tidyNotes('#### New\n\ntext\n\n##### Detail')).toBe('## New\n\ntext\n\n### Detail');
  // A "#" inside a code block is not a heading.
  expect(tidyNotes('### A\n\n```\n# not a heading\n```')).toBe('## A\n\n```\n# not a heading\n```');
});

test('a date is written day first, as the pages write theirs', () => {
  expect(longDate('2026-10-07')).toBe('7 October 2026');
});

// What the pages state as fact. Both of these fail quietly too: a wrong count or a wrong
// date still renders.
const { appDownloads, settle } = await import('./sync-docs.mjs');

test('only the app and its updates count as downloads', () => {
  const releases = [
    {
      assets: [
        { name: 'Thaw.dmg', download_count: 100 },
        { name: 'Thaw_2.0.1.zip', download_count: 40 },
        { name: 'Thaw2-1.delta', download_count: 7 },
        { name: 'Thaw.dmg.sigstore.json', download_count: 3 },
        { name: 'Thaw_2.0.1.cdx.json', download_count: 5 },
        { name: 'Thaw_2.0.1.cdx.json.sha256', download_count: 5 },
        { name: 'Thaw_2.0.1.cdx.json.intoto.jsonl', download_count: 5 },
      ],
    },
    // A release with nothing attached, as a tag-only one has.
    { assets: [] },
    {},
  ];
  expect(appDownloads(releases)).toBe(147);
});

test('a number that could not be read keeps its value and the day it was read', () => {
  const { values, days } = settle(
    { stars: 12_000, downloads: null, discord: undefined, homebrewYear: 0 },
    { stars: 11_000, downloads: 300_000, discord: 340 },
    { stars: '2026-10-01', downloads: '2026-10-01', discord: '2026-09-20' },
    '2026-10-08',
  );
  expect(values).toEqual({ stars: 12_000, downloads: 300_000, discord: 340, homebrewYear: 0 });
  // Read today, kept from the 1st, kept from September; and a real zero is a reading.
  expect(days).toEqual({
    stars: '2026-10-08',
    downloads: '2026-10-01',
    discord: '2026-09-20',
    homebrewYear: '2026-10-08',
  });
});

test('a number never read has no value and no day', () => {
  const { values, days } = settle({ scorecard: null }, {}, {}, '2026-10-08');
  expect(values.scorecard).toBeUndefined();
  expect(days.scorecard).toBeUndefined();
});

const { curlQuotes } = await import('./sync-docs.mjs');

test('quotes in synced prose are curled, and code and addresses are left alone', () => {
  expect(curlQuotes("Thaw's own icon is missing")).toBe('Thaw’s own icon is missing');
  expect(curlQuotes('the "dancing" icons won\'t stop')).toBe('the “dancing” icons won’t stop');
  expect(curlQuotes('**"Reset"** and (\'Layout\')')).toBe('**“Reset”** and (‘Layout’)');
  // Code in a line and in a block, a tag's attributes and a link's address keep theirs.
  expect(curlQuotes('run `open "thaw://x"` and it\'s done')).toBe(
    'run `open "thaw://x"` and it’s done',
  );
  expect(curlQuotes('```sh\necho "it\'s"\n```\nit\'s')).toBe('```sh\necho "it\'s"\n```\nit’s');
  expect(curlQuotes('<a href="x">it\'s</a>')).toBe('<a href="x">it’s</a>');
  expect(curlQuotes('[it\'s here](/a "title") and `x`\'s')).toBe(
    '[it’s here](/a "title") and `x`’s',
  );
  expect(curlQuotes('[ref]: https://example.com "Title"')).toBe(
    '[ref]: https://example.com "Title"',
  );
});

const { countChanges } = await import('./sync-docs.mjs');

test('what a release lists as new and as fixed is counted by its own headings', () => {
  const notes = [
    '## New Features',
    '- One',
    '- Two',
    '  - a detail of two, not a third',
    '### Appearance',
    '- Three, under a heading inside New',
    '## Improvements & Fixes',
    '- A fix',
    '```',
    '- not an item: this is code',
    '```',
    '## New Contributors',
    '- someone, who is not a feature',
    '## Donations',
    '- nor is this',
  ].join('\n');
  expect(countChanges(notes)).toEqual({ added: 3, fixed: 1 });
  expect(countChanges('Just a paragraph.')).toEqual({ added: 0, fixed: 0 });
  expect(countChanges('## Fixed\n1. One\n2. Two\n   - part of two')).toEqual({
    added: 0,
    fixed: 2,
  });
});

const { emojiShortcodes } = await import('./sync-docs.mjs');

test('an emoji shortcode becomes the emoji, except in code or when it is not one', () => {
  expect(emojiShortcodes('A new beta :grin:.')).toBe('A new beta 😁.');
  expect(emojiShortcodes('Run `:grin:` at 10:30:15, or :not_one:')).toBe(
    'Run `:grin:` at 10:30:15, or :not_one:',
  );
});

test("a README is shown install first, with the site's own parts only where it has them", () => {
  const readme = [
    '# App',
    'A header.',
    '## Features',
    '- One',
    '## Install',
    'Download it.',
    '## License',
    'Free.',
    '',
  ].join('\n');
  const leaves = { readmeLeavesOut: ['License'] };
  expect(readmeBody(readme, leaves)).toBe('## Install\nDownload it.\n## Features\n- One\n');
  expect(
    readmeBody(readme, {
      ...leaves,
      readmeParts: { features: '<FeatureList />', last: '<Assurance />' },
    }),
  ).toBe('## Install\nDownload it.\n## Features\n<FeatureList />\n\n<Assurance />\n');
  // An install section with no commands gives way to the site's own box whole.
  expect(readmeBody(readme, { ...leaves, readmeParts: { install: '<Box />' } })).toBe(
    '## Install\n\n<Box />\n\n## Features\n- One\n',
  );
});

test('a link to another synced file goes to its docs page, and one to the README to the product page', () => {
  const slugs = new Map([
    ['docs/PERMISSIONS.md', 'permissions'],
    ['README.md', 'readme'],
  ]);
  const links = { product: 'thaw', repo: 'thaw-app/Thaw', ref: 'development' };
  const body = [
    'See [permissions](PERMISSIONS.md#screen-recording).',
    'The [feature list](../README.md#features).',
    'The [code](../Thaw/App.swift).',
  ].join('\n');
  expect(rewriteLinks(body, 'docs/VERSIONS.md', slugs, links).split('\n')).toEqual([
    'See [permissions](/docs/thaw/permissions#screen-recording).',
    'The [feature list](/#features).',
    'The [code](https://github.com/thaw-app/Thaw/blob/development/Thaw/App.swift).',
  ]);
  expect(
    rewriteLinks('[it](../README.md)', 'docs/X.md', slugs, { ...links, product: 'floe' }),
  ).toBe('[it](/floe)');
});
