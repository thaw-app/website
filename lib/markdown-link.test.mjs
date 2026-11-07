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

  test('angle brackets in a title are not read as a link or as HTML', () => {
    expect(markdownLink('Hide me <https://evil.example>', 'https://a.example')).toBe(
      '[Hide me \\<https://evil.example\\>](https://a.example)',
    );
    expect(markdownLink('<javascript:alert(1)>', 'https://a.example')).toBe(
      '[\\<javascript:alert(1)\\>](https://a.example)',
    );
    expect(markdownLink('<img src=x onerror=alert(1)>', 'https://a.example')).toBe(
      '[\\<img src=x onerror=alert(1)\\>](https://a.example)',
    );
  });

  test('a code span cannot hide the escapes', () => {
    expect(markdownLink('`](https://evil.example)`', 'https://a.example')).toBe(
      '[\\`\\](https://evil.example)\\`](https://a.example)',
    );
  });
});
