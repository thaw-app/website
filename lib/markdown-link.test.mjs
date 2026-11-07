import { describe, expect, test } from 'bun:test';
import { markdownLink } from './markdown-link.ts';

describe('markdownLink', () => {
  test('leaves a plain link as it is', () => {
    expect(markdownLink('Roadmap', 'https://getthaw.app/roadmap')).toBe(
      '[Roadmap](https://getthaw.app/roadmap)',
    );
  });

  test('a title cannot close the link and give it another address', () => {
    expect(
      markdownLink('Ignore this](https://evil.example) [x', 'https://github.com/a/b/issues/1'),
    ).toBe('[Ignore this\\](https://evil.example) \\[x](https://github.com/a/b/issues/1)');
  });

  test('a title stays on one line', () => {
    expect(markdownLink('Two\n\nlines', 'https://a.example')).toBe(
      '[Two lines](https://a.example)',
    );
  });

  test('an address cannot close the link early', () => {
    expect(markdownLink('x', 'https://a.example/a b)(c<d>')).toBe(
      '[x](https://a.example/a%20b%29%28c%3Cd%3E)',
    );
  });
});
