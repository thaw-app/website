import { createHash } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import floeCommunity from '../lib/floe-community.json';

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

  // macOS 15 is offered, after the two a visitor is more likely to be on.
  await page.keyboard.press('ArrowRight');
  const sequoia = page.getByRole('tabpanel', { name: 'macOS 15' });
  await expect(sequoia).toContainText('not on Homebrew yet');
  await expect(sequoia.getByRole('link', { name: 'Download Thaw from GitHub' })).toHaveAttribute(
    'href',
    /\/releases\/tag\/2\.2\.0-beta\.1$/,
  );

  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'Without Homebrew' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(stable).toBeFocused();
});

test('a changelog with only a few weeks of releases keeps its squares small', async ({ page }) => {
  await page.goto('/changelog/floe');
  const square = page
    .getByRole('img', { name: /releases between/ })
    .locator('> span')
    .first();
  const box = await square.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(28);
  // And they stay at the left, beside the days.
  expect(box?.x).toBeLessThan(150);
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

test('Floe’s page shows its own Verified values', async ({ page, request }) => {
  const { bestPractices, baseline, scorecard, coverage } = floeCommunity.assurance;
  const values = {
    'SLSA build': 'Level 3',
    'OpenSSF Best Practices': bestPractices.charAt(0).toUpperCase() + bestPractices.slice(1),
    'OpenSSF Baseline': `Level ${baseline}`,
    'OpenSSF Scorecard': `${scorecard} / 10`,
    'Test coverage': `${coverage}%`,
  };
  await page.goto('/floe');
  const section = page.locator('h2#verified + div');
  for (const [label, value] of Object.entries(values)) {
    await expect(section.locator('li').filter({ hasText: label }), label).toContainText(value);
  }
  // Its Markdown says the same, with the same links.
  const markdown = await (await request.get('/floe.md')).text();
  for (const [label, value] of Object.entries(values)) {
    expect(markdown, label).toContain(`${label}]`);
    expect(markdown, label).toContain(`: ${value}.`);
  }
  expect(markdown).toContain('/docs/floe/verifying-releases');
  await expect(
    section.locator('a[href*="bestpractices.dev/projects/15396"]').first(),
  ).toBeVisible();
  await section.locator('a[href="/docs/floe/verifying-releases"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Verifying');
  await page.goBack();
  await expect(section.locator('a[href*="projects/13303"]')).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Community' })).toHaveAttribute(
    'href',
    '/floe/community',
  );
  await expect(section.getByRole('link', { name: 'What does this mean?' })).toHaveAttribute(
    'href',
    '/floe/verified',
  );
});

test('the Verified page has one page for each product, and the way to the other', async ({
  page,
}) => {
  await page.goto('/verified');
  const whose = page.getByRole('navigation', { name: 'Whose checks' });
  await expect(whose.getByRole('link', { name: 'Thaw' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('dl > div').filter({ hasText: 'Test coverage' })).toContainText(
    'Thaw’s code',
  );
  await whose.getByRole('link', { name: 'Floe' }).click();
  await expect(page).toHaveURL(/\/floe\/verified$/);
  await expect(whose.getByRole('link', { name: 'Floe' })).toHaveAttribute('aria-current', 'page');
  const rows = page.locator('dl > div');
  await expect(rows.filter({ hasText: 'Test coverage' })).toContainText('Floe’s code');
  await expect(rows.filter({ hasText: 'OpenSSF Best Practices' }).locator('dt')).toContainText(
    floeCommunity.assurance.bestPractices.replace(/^./, (first) => first.toUpperCase()),
  );
  await expect(
    page.locator('header').first().getByRole('link', { name: 'Floe, home' }),
  ).toBeVisible();
});

test('the pages a visitor moves between all answer', async ({ page }) => {
  for (const path of [
    '/',
    '/floe',
    '/floe/roadmap',
    '/floe/community',
    '/floe/verified',
    '/community',
    '/verified',
    '/roadmap',
    '/roadmap/thawui',
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
  for (const path of ['/floe', '/floe/roadmap', '/floe/community', '/changelog/floe']) {
    await page.goto(path);
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: 'Floe, home' }), path).toBeVisible();
    await expect(header.getByRole('link', { name: 'Roadmap' }), path).toHaveAttribute(
      'href',
      '/floe/roadmap',
    );
    await expect(header.getByRole('link', { name: 'Community' }), path).toHaveAttribute(
      'href',
      '/floe/community',
    );
  }
  // Each roadmap leads to the other's, as each changelog does.
  await page.goto('/floe/roadmap');
  await page
    .getByRole('navigation', { name: 'Whose roadmap' })
    .getByRole('link', { name: 'Thaw', exact: true })
    .click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(
    page.getByRole('navigation', { name: 'Whose roadmap' }).getByRole('link', { name: 'Floe' }),
  ).toHaveAttribute('href', '/floe/roadmap');
  await page
    .getByRole('navigation', { name: 'Whose roadmap' })
    .getByRole('link', { name: 'ThawUI' })
    .click();
  await expect(page).toHaveURL(/\/roadmap\/thawui$/);
  await expect(page.getByRole('link', { name: 'ThawUI' })).toHaveAttribute('aria-current', 'page');
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

// The papel picado is up through November 4, 2026, so these say when they are looking.
const inSeason = new Date(2026, 10, 2, 12);

test('the papel picado comes down after November 4, and the drawings come back', async ({
  page,
}) => {
  const fetched: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/papel-picado/')) fetched.push(request.url());
  });
  // The last minute of the 4th, and the first of the 5th.
  await page.clock.setFixedTime(new Date(2026, 10, 4, 23, 59));
  await page.goto('/');
  await expect(page.locator('.papel-picado')).toBeVisible();
  await expect(page.locator('canvas.ascii-cube')).toBeHidden();
  await page.waitForLoadState('networkidle');
  await page.clock.setFixedTime(new Date(2026, 10, 5, 0, 1));
  await page.goto('about:blank');
  fetched.length = 0;
  for (const path of ['/', '/floe']) {
    await page.goto(path);
    await expect(page.locator('canvas.ascii-cube')).toBeVisible();
    await expect(page.locator('.papel-picado')).toBeHidden();
    await expect(page.locator('.papel-strip')).toBeHidden();
    await expect(page.locator('.papel-banner')).toBeHidden();
    await page.locator('footer').last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  expect(fetched).toEqual([]);
});

test('the paper hangs again when its room changes width', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a phone has one size of window');
  await page.clock.setFixedTime(inSeason);
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/');
  const string = page.locator('.papel-strip canvas').first();
  const drawn = () => string.evaluate((canvas: HTMLCanvasElement) => canvas.width);
  await expect.poll(drawn).toBeGreaterThan(1200);
  const wide = await drawn();
  await page.setViewportSize({ width: 900, height: 800 });
  // Drawn for the new width, and not a wide picture squeezed into it.
  await expect.poll(drawn).toBeLessThan(wide * 0.75);
});

test('where the paper cannot hang, the sheet stays a picture and the strings stand aside', async ({
  page,
}) => {
  await page.clock.setFixedTime(inSeason);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply: (real, canvas, args) =>
        args[0] === 'webgl2' ? null : Reflect.apply(real, canvas, args),
    });
  });
  await page.goto('/');
  await expect(page.locator('.papel-still')).toBeVisible();
  await expect(page.locator('.papel-strip')).toHaveCount(0);
  await page.locator('footer').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.papel-banner')).toHaveCount(0);
});

test('with motion reduced the paper hangs still, and the close button is a stop on the keyboard', async ({
  page,
}) => {
  await page.clock.setFixedTime(inSeason);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const strip = page.locator('.papel-strip');
  await expect(strip.locator('canvas')).toHaveCount(2);
  await expect(strip.getByRole('img', { name: /papel picado/ })).toBeAttached();
  // However long it takes to settle, it does, and then nothing moves.
  await expect(async () => {
    const first = await strip.screenshot();
    await page.waitForTimeout(800);
    expect((await strip.screenshot()).equals(first)).toBe(true);
  }).toPass({ timeout: 20000 });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close Banner' })).toBeFocused();
});

test('on a phone a swipe scrolls past the paper, and holding it pulls it instead', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'phones only');
  await page.clock.setFixedTime(inSeason);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const sheet = page.locator('.papel-picado');
  await expect(sheet.locator('.papel-still')).toBeHidden();
  await page.waitForTimeout(3000);
  const box = await sheet.boundingBox();
  if (!box) throw new Error('no sheet');
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.7;
  const finger = await page.context().newCDPSession(page);
  const touch = (type: string, at?: { x: number; y: number }) =>
    finger.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: at ? [at] : [],
    } as never);
  const before = await sheet.screenshot();
  await touch('touchStart', { x, y });
  await page.waitForTimeout(350);
  for (let i = 1; i <= 8; i++) await touch('touchMove', { x: x + i * 3, y: y + i * 6 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect((await sheet.screenshot()).equals(before)).toBe(false);
  await touch('touchEnd');
  await touch('touchStart', { x, y });
  for (let i = 1; i <= 10; i++) await touch('touchMove', { x, y: y - i * 22 });
  await touch('touchEnd');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(20);
  const close = await page.getByRole('button', { name: 'Close Banner' }).boundingBox();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(close?.width).toBeGreaterThanOrEqual(44);
});

test('when the graphics are taken away the picture comes back, and then the paper', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the same on either');
  await page.clock.setFixedTime(inSeason);
  await page.goto('/');
  const still = page.locator('.papel-still');
  await expect(still).toBeHidden();
  const lose = (how: 'loseContext' | 'restoreContext') =>
    page
      .locator('.papel-picado canvas')
      .first()
      .evaluate((canvas: HTMLCanvasElement, how) => {
        const keep = window as unknown as { lostExtension?: WEBGL_lose_context | null };
        keep.lostExtension ??= canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
        keep.lostExtension?.[how]();
      }, how);
  await lose('loseContext');
  await expect(still).toBeVisible();
  await lose('restoreContext');
  await expect(still).toBeHidden();
});

test('the paper sheet is one size on a short window and a tall one', async ({ page, isMobile }) => {
  await page.clock.setFixedTime(inSeason);
  test.skip(isMobile, 'a phone has one size of window');
  // The drawing over the headline once gave up height on a short window.
  for (const path of ['/', '/floe']) {
    const heights: number[] = [];
    for (const height of [620, 900]) {
      await page.setViewportSize({ width: 1280, height });
      await page.goto(path);
      const sheet = page.locator('.papel-picado');
      await expect.poll(async () => (await sheet.boundingBox())?.height ?? 0).toBeGreaterThan(300);
      heights.push(Math.round((await sheet.boundingBox())?.height ?? 0));
    }
    expect(heights[0]).toBe(heights[1]);
    // The canvas takes over from the picture.
    await expect(page.locator('.papel-still')).toBeHidden();
  }
});

test('a sheet can be pulled, and the headline stays where it was', async ({ page, isMobile }) => {
  await page.clock.setFixedTime(inSeason);
  test.skip(isMobile, 'a finger on a phone is tried by hand');
  for (const path of ['/', '/floe']) {
    await page.goto(path);
    await expect(page.locator('.papel-still')).toBeHidden();
    const headline = await page.locator('h1').boundingBox();
    const box = await page.locator('.papel-picado').boundingBox();
    if (!box) throw new Error('no sheet');
    await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height * 1.3, { steps: 8 });
    await page.mouse.up();
    expect(await page.locator('h1').boundingBox()).toEqual(headline);
  }
});

test('the short string is real paper, over a product’s own page, and stays closed once closed', async ({
  page,
}) => {
  await page.clock.setFixedTime(inSeason);
  for (const path of ['/', '/floe']) {
    await page.goto(path);
    await expect(page.locator('.papel-strip canvas')).toHaveCount(2);
    await expect(page.locator('.papel-strip img')).toHaveCount(0);
  }
  for (const path of ['/community', '/docs/thaw']) {
    await page.goto(path);
    await expect(page.locator('.papel-strip')).toHaveCount(0);
  }
  await page.goto('/');
  await page.getByRole('button', { name: 'Close Banner' }).click();
  await expect(page.locator('.papel-strip')).toBeHidden();
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.papel-strip')).toBeHidden();
});

test('the strings follow the pattern, and the footer’s is fetched only when it is near', async ({
  page,
  isMobile,
}) => {
  await page.clock.setFixedTime(inSeason);
  const fetched: string[] = [];
  page.on('request', (request) => {
    const name = /\/papel-picado\/(small-)?([a-z]+)\.svg/.exec(request.url());
    if (name) fetched.push(`${name[1] ?? ''}${name[2]}`);
  });
  await page.goto('/');
  await expect(page.locator('.papel-strip canvas')).toHaveCount(2);
  // The short string: its three marks, and traditional ones that do not come round twice.
  for (const mark of ['small-floe', 'small-cube', 'small-droppy']) {
    await expect.poll(() => fetched).toContain(mark);
  }
  await page.waitForTimeout(300);
  const traditional = fetched.filter(
    (name) => name.startsWith('small-') && !/floe|cube|droppy/.test(name),
  );
  expect(traditional.length).toBeGreaterThanOrEqual(2);
  expect(new Set(traditional).size).toBe(traditional.length);
  // No skulls, and nothing of the footer's yet.
  expect(fetched.filter((name) => !name.startsWith('small-'))).toEqual([]);
  const room = await page.locator('.papel-banner').boundingBox();
  await page.locator('.papel-banner').scrollIntoViewIfNeeded();
  await expect(page.locator('.papel-banner canvas')).toHaveCount(2);
  const full = () => fetched.filter((name) => !name.startsWith('small-'));
  await expect.poll(() => full().length).toBeGreaterThan(0);
  await expect.poll(() => full().length).toBe(isMobile ? 3 : 7);
  for (const mark of ['floe', 'cube', 'droppy']) expect(full()).toContain(mark);
  // Its room was kept, so nothing moved when it arrived.
  expect((await page.locator('.papel-banner').boundingBox())?.height).toBe(room?.height);
});

test('the conure is on the page that is not there, and not in its footer too', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'There is no page at this address.',
  );
  // 24 pixels by 22, the top two for a hat, each drawn three across.
  const bird = page.locator('.stray-conure canvas');
  await expect.poll(async () => (await bird.boundingBox())?.width).toBe(72);
  expect((await bird.boundingBox())?.height).toBe(66);
  // The footer's art arrives when the foot of the page is near, and brings no second bird.
  await page.locator('.footer-art').scrollIntoViewIfNeeded();
  await expect(page.locator('.footer-art canvas.footer-wordmark')).toBeVisible();
  await expect(page.locator('.footer-conure')).toHaveCount(0);
});

test('the conure can be given a hat', async ({ page }) => {
  await page.goto('/no-such-page?conure-hat=sheriff');
  // Standing, the bird's crown is on the fifth row, so anything above that is the hat.
  const hat = () =>
    page.locator('.stray-conure canvas').evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, 4).data ?? [];
      return pixels.some((value, index) => index % 4 === 3 && value > 0);
    });
  await expect.poll(hat).toBe(true);
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
  for (const path of [
    '/floe',
    '/floe/roadmap',
    '/floe/community',
    '/changelog/floe',
    '/docs/floe',
  ]) {
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
    '/floe/community',
    '/floe/verified',
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

test('the community page shows where people are on a globe, and on the flat map without WebGL', async ({
  page,
}) => {
  await page.goto('/community');
  const globe = page.getByRole('img', { name: /^A world with \d+ countries lit/ });
  await expect(globe).toBeVisible();
  await expect(globe).toHaveJSProperty('tagName', 'CANVAS');
  // The view switch still changes what it counts.
  await page.getByRole('button', { name: 'Pull requests' }).click();
  await expect(page.getByText('Share of the pull requests from people')).toBeVisible();

  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.reload();
  const map = page.getByRole('img', { name: /^A world with \d+ countries lit/ });
  await expect(map).toHaveJSProperty('tagName', 'svg');
});

test('the demo’s Thaw window switches page tabs, picks pills, and toggles reveal ways', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'a phone gets a picture of the demo');
  await page.goto('/#try');
  const window = page.locator('.thaw-window');
  await window
    .locator('.thaw-sidebar')
    .getByRole('button', { name: 'Layout', exact: true })
    .click();

  // The page's tabs: one chosen, the arrows move along them, and the page follows.
  const tabs = window.getByRole('tablist', { name: 'Layout sections' });
  await expect(tabs.getByRole('tab', { name: 'Options' })).toHaveAttribute('aria-selected', 'true');
  await tabs.getByRole('tab', { name: 'Options' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Groups' })).toHaveAttribute('aria-selected', 'true');
  await expect(window.getByText('No item groups.', { exact: false })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Options' }).click();

  // A pill choice: one checked at a time.
  const arrangement = window.getByRole('radiogroup', { name: 'Item arrangement' });
  await arrangement.getByRole('radio', { name: 'Manual' }).click();
  await expect(arrangement.getByRole('radio', { name: 'Manual' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(arrangement.getByRole('radio', { name: 'Automatic' })).toHaveAttribute(
    'aria-checked',
    'false',
  );

  // Click, Hover and Scroll are a native segmented control: each one toggles on its own.
  await window
    .locator('.thaw-sidebar')
    .getByRole('button', { name: 'Visibility', exact: true })
    .click();
  const hover = window.getByRole('button', { name: 'Hover', exact: true });
  await expect(hover).toHaveAttribute('aria-pressed', 'false');
  await hover.click();
  await expect(hover).toHaveAttribute('aria-pressed', 'true');
  await expect(window.getByRole('button', { name: 'Click', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test.describe('the shooting gallery in the footer', () => {
  const gallery = (page: Page) => page.getByRole('dialog', { name: 'Shooting gallery' });

  // With reduced motion the bird sits still on the ampersand, so it can be clicked, once
  // the wordmark has said where the ampersand is.
  async function atTheFoot(page: Page) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.footer-art').scrollIntoViewIfNeeded();
    await expect(page.locator('.footer-conure')).toBeVisible();
    await expect
      .poll(() =>
        page.locator('.footer-art').evaluate((art) => art.style.getPropertyValue('--perch-x')),
      )
      .not.toBe('');
  }
  async function touchTheBird(page: Page) {
    const box = await page.locator('.footer-conure').boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  test('three touches open it, it waits for Start, and a hit scores', async ({ page }) => {
    await atTheFoot(page);
    await touchTheBird(page);
    await touchTheBird(page);
    await expect(gallery(page)).toHaveCount(0);
    await touchTheBird(page);
    const start = page.getByRole('button', { name: 'Start' });
    await expect(start).toBeFocused();
    await expect(page.locator('.footer-shootout-target')).toHaveCount(0);
    await start.click();
    const target = page.locator('.footer-shootout-target').first();
    await target.waitFor();
    await target.dispatchEvent('pointerdown');
    await expect(page.locator('.footer-shootout-board')).toContainText('1 point');
    // The arrows bring up the sights to aim with.
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.footer-shootout-sights')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(gallery(page)).toHaveCount(0);
  });

  test('the keyboard can get there, and comes back to where it was', async ({ page }) => {
    await atTheFoot(page);
    await page.getByRole('button', { name: 'Wave at the conure' }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Wave again' }).press('Enter');
    await page.getByRole('button', { name: 'Open the shooting gallery' }).press('Enter');
    await page.getByRole('button', { name: 'Start' }).press('Enter');
    await expect(gallery(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open the shooting gallery' })).toBeFocused();
  });

  test('six shots empty the revolver, and it fills itself again', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('conure-shootout-found', '1'));
    await atTheFoot(page);
    await touchTheBird(page);
    await page.getByRole('button', { name: 'Start' }).press('Enter');
    await expect(page.getByRole('img', { name: '6 shots left' })).toBeVisible();
    for (let shot = 0; shot < 6; shot++) await page.keyboard.press('1');
    await expect(page.getByRole('img', { name: 'Reloading' })).toBeVisible();
    await expect(page.getByRole('img', { name: '6 shots left' })).toBeVisible();
  });

  test('the conure on the page that is not there opens it too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/no-such-page');
    const bird = page.locator('.stray-conure canvas');
    await expect.poll(async () => (await bird.boundingBox())?.width).toBe(72);
    const box = await bird.boundingBox();
    if (!box) throw new Error('no bird');
    for (let touch = 0; touch < 2; touch++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(gallery(page)).toHaveCount(0);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    // Over the section it stands in, without going anywhere, and with the links out of reach.
    const start = page.getByRole('button', { name: 'Start' });
    await expect(start).toBeInViewport();
    await expect(page.locator('.stray-stage .footer-shootout')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Frequent issues' }).first()).toBeVisible();
    await expect(page.locator('.stray-stage a')).toHaveCount(4);
    await expect(page.locator('.stray-stage [inert] a').first()).toBeAttached();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole('button', { name: 'Back to page' }).click();
    await expect(gallery(page)).toHaveCount(0);
    await expect(page.locator('.stray-stage [inert]')).toHaveCount(0);
    await expect(bird).toBeInViewport();
    // Still only one bird, and the headline has no button in it.
    await expect(page.locator('.footer-conure')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'There is no page at this address.',
    );
  });

  test('the keyboard can get to it from the page that is not there', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/no-such-page');
    await page.getByRole('button', { name: 'Wave at the conure' }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Wave again' }).press('Enter');
    await page.getByRole('button', { name: 'Open the shooting gallery' }).press('Enter');
    await expect(page.getByRole('button', { name: 'Start' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open the shooting gallery' })).toBeFocused();
  });

  test('scrolling away stops the clock', async ({ page }) => {
    // Someone who has been here before, for whom one touch is enough.
    await page.addInitScript(() => localStorage.setItem('conure-shootout-found', '1'));
    await atTheFoot(page);
    await touchTheBird(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(
      page.getByRole('button', { name: 'Carry on', includeHidden: true }),
    ).toBeAttached();
  });

  test('a phone gets three places and a Stop a finger can press', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', 'phones only');
    await atTheFoot(page);
    await touchTheBird(page);
    await touchTheBird(page);
    await touchTheBird(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('.footer-shootout-cover')).toHaveCount(3);
    const stop = await page.getByRole('button', { name: 'Stop' }).boundingBox();
    expect(stop?.height).toBeGreaterThanOrEqual(44);
    expect(stop?.width).toBeGreaterThanOrEqual(44);
  });
});
