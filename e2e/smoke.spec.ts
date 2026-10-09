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
    '/community',
    '/verified',
    '/roadmap',
    '/built-with',
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
  const described = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(described['@type']).toBe('SoftwareApplication');
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
