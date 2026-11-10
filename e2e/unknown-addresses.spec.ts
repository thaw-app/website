import { expect, test } from '@playwright/test';

// An address that was not built is not there: it is a 404, and is not rendered on request.
// The site's own addresses next to each one show the check lets them through.

test('a feed or a share picture is only one the site has', async ({ request }) => {
  // `constructor` is a name every object has, and is not a product or a page.
  expect((await request.get('/feed/constructor.xml')).status()).toBe(404);
  const feed = await request.get('/feed/thaw.xml');
  expect(feed.status()).toBe(200);
  expect(feed.headers()['content-type']).toContain('application/atom+xml');

  expect((await request.get('/og/site/constructor/image.png')).status()).toBe(404);
  const picture = await request.get('/og/site/home/image.png');
  expect(picture.status()).toBe(200);
  expect(picture.headers()['content-type']).toContain('image/png');

  // A docs page's picture is at its address under /og/docs, ending in image.png.
  expect((await request.get('/og/docs/nope/image.png')).status()).toBe(404);
});

test('a docs page or a release that does not exist is a 404', async ({ request }) => {
  expect((await request.get('/docs/no/such/page')).status()).toBe(404);
  expect((await request.get('/docs/thaw')).status()).toBe(200);

  expect((await request.get('/changelog')).status()).toBe(200);
  expect((await request.get('/changelog/no-such-release')).status()).toBe(404);
  expect((await request.get('/changelog/floe')).status()).toBe(200);
  expect((await request.get('/changelog/floe/no-such-release')).status()).toBe(404);
});

test('the API’s 404s and 400s can be kept by the CDN, and a wrong method cannot', async ({
  request,
}) => {
  const missing = await request.get('/api/nothing-here');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['cdn-cache-control']).toContain('max-age=86400');

  const noQuery = await request.get('/api/search');
  expect(noQuery.status()).toBe(400);
  expect(noQuery.headers()['cdn-cache-control']).toContain('max-age=86400');

  const post = await request.post('/api/search');
  expect(post.status()).toBe(405);
  expect(post.headers()['cdn-cache-control']).toBeUndefined();
});

test('an address with no page, asked for in Markdown, says so in Markdown', async ({ request }) => {
  const response = await request.get('/no-such-page', { headers: { Accept: 'text/markdown' } });
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('/llms.txt');
});
