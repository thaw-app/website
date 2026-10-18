import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('the install tabs work from the keyboard and give the right command', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Ways to install Thaw' });
  const stable = tabs.getByRole('tab', { name: 'macOS 26' });
  const beta = tabs.getByRole('tab', { name: 'macOS 27' });
  await expect(stable).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('brew install thaw');

  // One stop in the tab order, and the arrows move within it.
  await stable.focus();
  await page.keyboard.press('ArrowRight');
  await expect(beta).toBeFocused();
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await expect(stable).toHaveAttribute('tabindex', '-1');
  // The panel is named by the tab that is chosen.
  await expect(page.getByRole('tabpanel', { name: 'macOS 27' })).toContainText(
    'brew install thaw@beta',
  );

  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'Without Homebrew' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(stable).toBeFocused();
});

test('the home page says some features need Thaw 3 and where versions are', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Some of these features are only in Thaw 3.')).toBeVisible();
  await page.getByRole('link', { name: 'See which Thaw your Mac gets' }).click();
  await expect(page).toHaveURL(/\/docs\/thaw\/versions$/);
  await expect(page.getByRole('row', { name: /macOS 26/ })).toContainText('Thaw 2');
});

test('every Verified value sits under its own name', async ({ page }) => {
  await page.goto('/verified');
  const rows = page.locator('dl > div');
  await expect(rows.filter({ hasText: 'SLSA build level' }).locator('dt')).toContainText('Level 3');
  // Whatever today's values are, a score is a score and a share is a share.
  const scorecard = rows.filter({ hasText: 'OpenSSF Scorecard' }).locator('dt');
  if ((await scorecard.locator('span').count()) > 1) await expect(scorecard).toContainText('/ 10');
  const coverage = rows.filter({ hasText: 'Test coverage' }).locator('dt');
  if ((await coverage.locator('span').count()) > 1) await expect(coverage).toContainText('%');
});

test('the pages a visitor moves between all answer', async ({ page }) => {
  for (const path of [
    '/',
    '/floe',
    '/floe/roadmap',
    '/community',
    '/verified',
    '/roadmap',
    '/built-with',
    '/faq',
    '/docs/thaw',
    '/docs/thaw/getting-started',
    '/changelog',
    '/changelog/floe',
    '/docs/floe',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1').first(), path).toBeVisible();
  }
  // An address that was moved still arrives.
  await page.goto('/docs/thaw/roadmap');
  await expect(page).toHaveURL(/\/roadmap$/);
  await page.goto('/docs/thaw/changelog/2.0.0');
  await expect(page).toHaveURL(/\/changelog\/2\.0\.0$/);
  // A release's address is its tag alone; the longer ones it had still arrive.
  await page.goto('/changelog/3.0.0/3.0.0-beta.2');
  await expect(page).toHaveURL(/\/changelog\/3\.0\.0-beta\.2$/);
  await page.goto('/docs/thaw/changelog/2.0.0/2.0.0-rc.3');
  await expect(page).toHaveURL(/\/changelog\/2\.0\.0-rc\.3$/);
});

test('search finds a docs page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the sidebar that holds the search button is folded away on a phone');
  await page.goto('/docs/thaw');
  await page
    .getByRole('button', { name: /^Search/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  // Not one of the suggestions the panel opens on, so finding it is the index answering.
  await dialog.getByRole('combobox').fill('URL schemes');
  await expect(dialog.getByRole('listbox').getByText('URL schemes').first()).toBeVisible();
});

test('the demo loads on a screen that can use it, and a phone gets a picture', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const frame = page.locator('.desktop-wallpaper');
  // The scripts fetched from here on, once the page's own have loaded. A line only the
  // demo says tells its code from a link's prefetched page.
  const fetched: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') fetched.push(request.url());
  });
  const demoCode = async () => {
    const sources = await Promise.all(
      fetched.map(async (url) => (await page.request.get(url)).text()),
    );
    return sources.filter((source) => source.includes('is not part of this demo')).length;
  };
  await frame.scrollIntoViewIfNeeded();
  if (isMobile) {
    await expect(frame.getByRole('img')).toBeVisible();
    // Given time to, it still fetches none of the demo's code.
    await page.waitForTimeout(1500);
    expect(await demoCode()).toBe(0);
    await expect(frame.getByRole('button')).toHaveCount(0);
  } else {
    await expect(frame.getByRole('button').first()).toBeVisible();
    // The same check finds the demo here, so it means something when it finds none.
    expect(await demoCode()).toBeGreaterThan(0);
    await expect(frame.getByRole('img', { name: /settings window/ })).toHaveCount(0);
  }
});

test('every response carries the security headers, and the policy blocks nothing the site needs', async ({
  page,
}) => {
  const blocked: string[] = [];
  await page.exposeFunction('blockedByPolicy', (what: string) => blocked.push(what));
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) =>
      // biome-ignore lint/suspicious/noExplicitAny: a function this test put on the page
      (window as any).blockedByPolicy(`${event.effectiveDirective} ${event.blockedURI}`),
    ),
  );
  for (const path of ['/', '/docs/thaw/getting-started', '/community']) {
    const response = await page.goto(path);
    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy'], path).toContain("default-src 'self'");
    expect(headers['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['x-frame-options'], path).toBe('DENY');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy'], path).toContain('camera=()');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  }
  expect(blocked).toEqual([]);
});

test('search engines and feed readers are told what they need', async ({ page, request }) => {
  await page.goto('/');
  // One address for the page, the app described, and the release feeds named.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
    (text) => JSON.parse(text),
  );
  const described = data.find((item) => item['@type'] === 'SoftwareApplication');
  expect(data.map((item) => item['@type'])).toEqual(['SoftwareApplication', 'WebSite', 'FAQPage']);
  expect(described.operatingSystem).toBe('macOS');
  expect(described.offers.price).toBe('0');
  await expect(page.locator('link[type="application/atom+xml"]')).toHaveCount(2);
  await page.goto('/community');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/community$/);

  const feed = await request.get('/feed/thaw.xml');
  expect(feed.headers()['content-type']).toContain('application/atom+xml');
  const text = await feed.text();
  expect(text).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
  expect(text.match(/<entry>/g)?.length).toBeGreaterThan(5);
  expect((await request.get('/manifest.webmanifest')).ok()).toBe(true);
  expect((await request.get('/privacy')).ok()).toBe(true);
});

test('the questions open one at a time, and search engines get the ones on the page', async ({
  page,
}) => {
  // The home page ends on the first of them, and leads to the rest.
  await page.goto('/');
  await expect(page.locator('.faq details')).toHaveCount(4);
  await page.getByRole('link', { name: /All \d+ questions/ }).click();
  await expect(page).toHaveURL(/\/faq$/);
  // None is open until one is asked for, and then only that one.
  const open = page.locator('.faq details[open]');
  await expect(open).toHaveCount(0);
  await page.getByText('Is Thaw free?').click();
  await expect(open).toHaveCount(1);
  await page.getByText('How do I uninstall it?').click();
  await expect(open).toHaveCount(1);
  await expect(open.locator('ol li')).toHaveCount(3);
  // Each question given to a search engine is one a visitor can read on the page.
  const questions = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(questions['@type']).toBe('FAQPage');
  expect(questions.mainEntity.length).toBeGreaterThan(0);
  for (const { name } of questions.mainEntity) await expect(page.getByText(name)).toBeVisible();
});

test('an earlier release opens its notes under its line', async ({ page }) => {
  await page.goto('/changelog');
  const row = page.locator('li.release-entry').first();
  const toggle = row.getByRole('button').first();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  // Read from the release's own page, so it has that page's sections.
  await expect(row.locator('.release-notes')).not.toBeEmpty();
  await toggle.click();
  await expect(row.locator('.release-notes')).toHaveCount(0);
});

test('Floe’s page opens the demo on the launcher', async ({ page, isMobile }) => {
  await page.goto('/floe');
  await expect(page.locator('h1')).toHaveText('The open source launcher for macOS.');
  const frame = page.locator('.desktop-wallpaper');
  await frame.scrollIntoViewIfNeeded();
  if (isMobile) await expect(frame.getByRole('img', { name: /launcher/ })).toBeVisible();
  else await expect(frame.getByPlaceholder(/Search apps/)).toBeVisible();
});

test('Floe’s pages are under Floe’s own header', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the header’s links are in a menu on a phone');
  for (const path of ['/floe', '/floe/roadmap', '/changelog/floe']) {
    await page.goto(path);
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: 'Floe, home' }), path).toBeVisible();
    await expect(header.getByRole('link', { name: 'Roadmap' }), path).toHaveAttribute(
      'href',
      '/floe/roadmap',
    );
  }
  // Each roadmap leads to the other's, as each changelog does.
  await page.goto('/floe/roadmap');
  await page
    .getByRole('navigation', { name: 'Whose roadmap' })
    .getByRole('link', { name: 'Thaw' })
    .click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(
    page.getByRole('navigation', { name: 'Whose roadmap' }).getByRole('link', { name: 'Floe' }),
  ).toHaveAttribute('href', '/floe/roadmap');
  // The name in the header leads to its product's own page, and the last of the header's
  // links to the other product's.
  await page.goto('/changelog');
  const header = page.locator('header').first();
  await expect(header.getByRole('link', { name: 'Thaw, home' })).toHaveAttribute('href', '/');
  await header.getByRole('link', { name: 'Floe', exact: true }).click();
  await expect(page).toHaveURL(/\/floe$/);
  await expect(header.getByRole('link', { name: 'Floe, home' })).toHaveAttribute('href', '/floe');
  await header.getByRole('link', { name: 'Thaw', exact: true }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});

test('the cube is one size on a short window and a tall one', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a phone has one size of window');
  // It once gave up height on a short window, and came out a third smaller on a laptop.
  for (const path of ['/', '/floe']) {
    const widths: number[] = [];
    for (const height of [620, 900]) {
      await page.setViewportSize({ width: 1280, height });
      await page.goto(path);
      const cube = page.locator('canvas.ascii-cube');
      await expect.poll(async () => (await cube.boundingBox())?.width ?? 0).toBeGreaterThan(300);
      widths.push(Math.round((await cube.boundingBox())?.width ?? 0));
    }
    expect(widths[0]).toBe(widths[1]);
  }
});

test('the conure is on the page that is not there, and not in its footer too', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'There is no page at this address.',
  );
  // 24 pixels by 20, each drawn three across.
  const bird = page.locator('.stray-conure canvas');
  await expect.poll(async () => (await bird.boundingBox())?.width).toBe(72);
  expect((await bird.boundingBox())?.height).toBe(60);
  // The footer's art arrives when the foot of the page is near, and brings no second bird.
  await page.locator('.footer-art').scrollIntoViewIfNeeded();
  await expect(page.locator('.footer-art canvas.footer-wordmark')).toBeVisible();
  await expect(page.locator('.footer-conure')).toHaveCount(0);
});

test('the footer’s band keeps growing with a wide window', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a phone is never this wide');
  // A limit on it once squeezed the words on a wide window and cut their tops off.
  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.goto('/faq');
  // A quarter of the window's width, near enough: the limit was 480 pixels.
  const band = await page.locator('.footer-art').boundingBox();
  expect(band?.height).toBeGreaterThan(650);
});

test('the tab shows Floe’s icon on Floe’s pages and Thaw’s on the rest', async ({ page }) => {
  const icon = page.locator('link[rel="icon"]');
  for (const path of ['/floe', '/floe/roadmap', '/changelog/floe', '/docs/floe']) {
    await page.goto(path);
    await expect(icon).toHaveAttribute('href', /\/icons\/floe-96\.png/);
  }
  for (const path of ['/', '/docs/thaw']) {
    await page.goto(path);
    await expect(icon).toHaveAttribute('href', /\/icon\.png/);
  }
});

test('llms.txt says what Thaw and Floe are, and every page it names answers', async ({
  request,
}) => {
  const text = await (await request.get('/llms.txt')).text();
  expect(text).toMatch(/^# Thaw\n\n> Thaw is /);
  // A heading always has pages under it.
  expect(text).not.toMatch(/^## .+\n\n(?!- )/m);
  const paths = [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(
    ([, url]) => new URL(url).pathname,
  );
  expect(paths).toEqual(
    expect.arrayContaining(['/', '/faq', '/floe', '/docs/thaw/getting-started']),
  );
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
});

test('AI tools get each page as Markdown, a Markdown not-found, and a skill', async ({
  request,
}) => {
  const markdown = { headers: { Accept: 'text/markdown' } };
  for (const path of [
    '/',
    '/floe',
    '/faq',
    '/roadmap',
    '/privacy',
    '/community',
    '/verified',
    '/built-with',
    '/changelog/2.1.0',
  ]) {
    const response = await request.get(path, markdown);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain('text/markdown');
    expect(response.headers().vary, path).toContain('Accept');
    expect(Number(response.headers()['x-markdown-tokens']), path).toBeGreaterThan(0);
    expect(await response.text(), path).toMatch(/^# /);
  }
  expect((await request.get('/index.md')).headers()['content-type']).toContain('text/markdown');
  // An address with no page says so, in Markdown.
  const missing = await request.get('/no-such-page', markdown);
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('/llms.txt');

  const home = await request.get('/');
  expect(home.headers().link).toContain('rel="describedby"');
  expect(await (await request.get('/robots.txt')).text()).toContain('Content-Signal:');

  // Each skill is where the index says, and is what its digest says.
  const index = await (await request.get('/.well-known/agent-skills/index.json')).json();
  expect(index.skills.map((skill: { name: string }) => skill.name)).toEqual([
    'install-thaw',
    'troubleshoot-thaw',
    'thaw-url-scheme',
  ]);
  for (const skill of index.skills) {
    const body = await (await request.get(new URL(skill.url).pathname)).text();
    expect(body, skill.name).toContain(`name: ${skill.name}`);
    // A description is quoted, so YAML reads one with a colon in it.
    expect(body, skill.name).toContain(`description: ${JSON.stringify(skill.description)}`);
    const digest = createHash('sha256').update(body).digest('hex');
    expect(skill.digest, skill.name).toBe(`sha256:${digest}`);
  }
  expect(await (await request.get('/llms-full.txt')).text()).toContain('# Built with');
});

test('the search API is described, and says what went wrong in JSON', async ({ request }) => {
  const found = await request.get('/api/search?query=permissions&limit=3');
  expect(found.ok()).toBe(true);
  const results = await found.json();
  expect(results.length).toBeGreaterThan(0);
  expect(results.length).toBeLessThanOrEqual(3);

  for (const [path, status, code] of [
    ['/api/search', 400, 'missing_query'],
    ['/api/search?query=x&limit=0', 400, 'invalid_limit'],
    ['/api/nothing-here', 404, 'not_found'],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(status);
    expect(response.headers()['content-type'], path).toContain('application/problem+json');
    const problem = await response.json();
    expect(problem.code, path).toBe(code);
    expect(problem.resolution, path).toBeTruthy();
  }
  expect((await request.post('/api/search')).status()).toBe(405);

  const spec = await (await request.get('/openapi.json')).json();
  expect(spec.paths['/api/search'].get.operationId).toBe('searchDocs');
  const catalog = await request.get('/.well-known/api-catalog');
  expect(catalog.headers()['content-type']).toContain('application/linkset+json');
  expect((await catalog.json()).linkset[0]['service-desc'][0].href).toContain('/openapi.json');
  const ard = await (await request.get('/.well-known/ard.json')).json();
  expect(ard.entries.map((entry: { identifier: string }) => entry.identifier)).toContain(
    'urn:air:localhost:api:search',
  );
});
