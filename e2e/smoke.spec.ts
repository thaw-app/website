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

test('the home page says which Thaw a Mac gets and what is only in the beta', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  if (isMobile) {
    // A phone gets the same facts as short blocks, with nothing pushed off the side.
    const versions = page.getByRole('listitem').filter({ hasText: /^macOS 2[67]/ });
    await expect(versions.filter({ hasText: 'macOS 26' })).toContainText('brew install thaw');
    await expect(versions.filter({ hasText: 'macOS 27' })).toContainText('brew install thaw@beta');
  } else {
    const versions = page.getByRole('table', { name: 'Which version of Thaw runs on which macOS' });
    await expect(versions.getByRole('row', { name: /macOS 26/ })).toContainText('Thaw 2');
    await expect(versions.getByRole('row', { name: /macOS 27/ })).toContainText('Thaw 3');
  }
  await expect(page.getByText('Thaw 3 beta').first()).toBeVisible();
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
    '/docs/thaw/changelog',
    '/docs/floe',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('h1').first(), path).toBeVisible();
  }
  // An address that was moved still arrives.
  await page.goto('/docs/thaw/roadmap');
  await expect(page).toHaveURL(/\/roadmap$/);
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
  const frame = page.locator('#try .desktop-wallpaper');
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
