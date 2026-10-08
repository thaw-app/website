// The parsers that turn the app repos' Markdown into the site's pages. They fail quietly:
// a change in how a changelog is written upstream only mis-files releases here. These
// pin what each does with the shapes the changelogs have today.
import { expect, test } from 'bun:test';
import {
  channelOf,
  linkMentions,
  longDate,
  parseTag,
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
