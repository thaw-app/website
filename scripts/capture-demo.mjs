// Takes the two pictures of the running site that are kept in the repo: the demo as phones
// are shown it (assets/desktop-still.png), and the cube for shared links (assets/og/cube.png).
// Run by hand when the demo changes, against a running site:
//
//   bun run dev            # or: bun run start
//   node scripts/capture-demo.mjs [http://localhost:3000]
//
// It needs the browser Playwright drives: `bunx playwright install chromium`.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const site = process.argv[2] ?? 'http://localhost:3000';
const file = join(import.meta.dirname, '..', 'assets', 'desktop-still.png');

const browser = await chromium.launch();
try {
  // The demo is drawn at up to 1512px, the width of the screen it copies, inside 40px of
  // page on each side. One pixel per point: a phone shows it at a quarter of that width.
  const page = await browser.newPage({ viewport: { width: 1592, height: 1200 } });
  page.setDefaultTimeout(30_000);
  // The link straight to the demo loads it without scrolling.
  await page.goto(`${site}/#try`);
  const demo = page.locator('.desktop-wallpaper');
  // The frame is there from the start; the menu bar is there once the demo has loaded.
  await demo.locator('button').first().waitFor();
  // Its own pictures only: one further down the page is not loaded until it is scrolled to.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.desktop-wallpaper img')].every((image) => image.complete),
  );
  await demo.screenshot({ path: file, animations: 'disabled' });
  console.log(`Wrote ${file}`);

  // The cube from the top of the home page, for the picture a shared link shows
  // (lib/og.tsx). In the dark theme and held still, so it is the same frame every time,
  // and read off its own canvas so the ground behind it stays clear.
  const dark = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  dark.setDefaultTimeout(30_000);
  await dark.goto(site);
  await dark.locator('html.dark canvas.ascii-cube').waitFor();
  await dark.waitForTimeout(500);
  const cube = await dark.evaluate(() =>
    document.querySelector('canvas.ascii-cube').toDataURL('image/png'),
  );
  const cubeFile = join(import.meta.dirname, '..', 'assets', 'og', 'cube.png');
  writeFileSync(cubeFile, Buffer.from(cube.split(',')[1], 'base64'));
  console.log(`Wrote ${cubeFile}`);
} finally {
  await browser.close();
}
