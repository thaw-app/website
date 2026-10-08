import { defineConfig, devices } from '@playwright/test';

// Smoke tests against the built site, as a visitor gets it: `bun run build`, then
// `bun run test:e2e`. They cover the paths a unit test cannot: installing, searching,
// getting about, and what a phone is and is not sent.
const port = 3210;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Chromium at a phone's size, so one browser download serves both.
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `bunx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
