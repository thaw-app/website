import { expect, test } from '@playwright/test';

test('the proxy answers Markdown where asked, and HTML everywhere else', async ({ request }) => {
  const accept = (value: string) => ({ headers: { Accept: value } });
  const expectMarkdown = async (path: string, value?: string) => {
    const response = await request.get(path, value ? accept(value) : undefined);
    expect(response.status(), `${path} ${value ?? ''}`).toBe(200);
    expect(response.headers()['content-type'], `${path} ${value ?? ''}`).toContain('text/markdown');
  };

  // An address ending in .md, whatever the Accept header says.
  for (const path of ['/index.md', '/faq.md', '/docs/thaw.md']) await expectMarkdown(path);

  // Each Markdown type in Accept.
  await expectMarkdown('/docs/thaw', 'text/markdown');
  await expectMarkdown('/faq', 'text/markdown');
  await expectMarkdown('/faq', 'text/plain');
  await expectMarkdown('/faq', 'text/x-markdown');
  // A release's tag ends in a dot and a number, and is still a page.
  await expectMarkdown('/changelog/2.1.0', 'text/markdown');

  // HTML ranked above Markdown, and a browser's Accept, get the page.
  for (const value of [
    'text/html, text/markdown;q=0.5',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  ]) {
    const response = await request.get('/faq', accept(value));
    expect(response.status(), value).toBe(200);
    expect(response.headers()['content-type'], value).toContain('text/html');
  }

  // An address with no page says so, in Markdown.
  const missing = await request.get('/no-such-page', accept('text/markdown'));
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('/llms.txt');

  // The site's own text files are left alone.
  const index = await request.get('/llms.txt', accept('text/plain'));
  expect(index.status()).toBe(200);
  expect(await index.text()).toMatch(/^# /);
});
