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
