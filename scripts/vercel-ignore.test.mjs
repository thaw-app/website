// A wrong answer here either deploys for nothing or, worse, leaves a change undeployed,
// so the cases that must build are pinned as well as the ones that skip.
import { expect, test } from 'bun:test';
import { canSkip } from './vercel-ignore.mjs';

test("Dependabot's branches are skipped, whatever they change", () => {
  expect(canSkip({ branch: 'dependabot/bun/minor-and-patch', files: ['bun.lock'] })).toBe(true);
  expect(canSkip({ branch: 'dependabot/github_actions/x', files: null })).toBe(true);
});

test('a commit that only touches .github is skipped', () => {
  expect(canSkip({ branch: 'main', files: ['.github/dependabot.yml'] })).toBe(true);
  expect(
    canSkip({ branch: 'main', files: ['.github/workflows/ci.yml', '.github/dependabot.yml'] }),
  ).toBe(true);
});

test('a commit that touches the site builds', () => {
  expect(canSkip({ branch: 'main', files: ['app/page.tsx'] })).toBe(false);
  expect(canSkip({ branch: 'main', files: ['.github/dependabot.yml', 'package.json'] })).toBe(
    false,
  );
  expect(canSkip({ branch: 'feature', files: ['.githubish/file'] })).toBe(false);
});

test('a commit that only touches the notes at the root is skipped', () => {
  expect(canSkip({ branch: 'main', files: ['README.md'] })).toBe(true);
  expect(canSkip({ branch: 'main', files: ['DESIGN.md', 'AGENTS.md', 'CLAUDE.md'] })).toBe(true);
});

test('a commit that only touches the end-to-end tests is skipped', () => {
  expect(canSkip({ branch: 'main', files: ['e2e/smoke.spec.ts'] })).toBe(true);
  expect(canSkip({ branch: 'main', files: ['playwright.config.ts'] })).toBe(true);
});

test('a commit with a test file and .gitignore is skipped', () => {
  expect(
    canSkip({ branch: 'main', files: ['lib/markdown-link.test.ts', '.gitignore', 'biome.json'] }),
  ).toBe(true);
});

test('a README inside the content builds', () => {
  expect(canSkip({ branch: 'main', files: ['content/shared/README.md'] })).toBe(false);
});

test('a file the site is built from builds', () => {
  expect(canSkip({ branch: 'main', files: ['lib/markdown-link.ts'] })).toBe(false);
});

test('a commit that mixes the root README with a page builds', () => {
  expect(canSkip({ branch: 'main', files: ['README.md', 'app/page.tsx'] })).toBe(false);
});

test('it builds when the changed files are unknown', () => {
  expect(canSkip({ branch: 'main', files: null })).toBe(false);
  expect(canSkip({ branch: 'main', files: [] })).toBe(false);
  expect(canSkip({ branch: undefined, files: null })).toBe(false);
});
