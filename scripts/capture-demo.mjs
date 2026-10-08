// Takes the picture of the demo that phones are shown in its place (assets/desktop-still.png).
// Run by hand when the demo changes, against a running site:
//
//   bun run dev            # or: bun run start
//   node scripts/capture-demo.mjs [http://localhost:3000]
//
// It needs the browser Playwright drives: `bunx playwright install chromium`.
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
  const demo = page.locator('#try .desktop-wallpaper');
  // The frame is there from the start; the menu bar is there once the demo has loaded.
  await demo.locator('button').first().waitFor();
  // Its own pictures only: one further down the page is not loaded until it is scrolled to.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('#try .desktop-wallpaper img')].every((image) => image.complete),
  );
  await demo.screenshot({ path: file, animations: 'disabled' });
  console.log(`Wrote ${file}`);
} finally {
  await browser.close();
}
