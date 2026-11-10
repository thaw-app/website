// Reading everyone's location again is about a hundred and fifty requests, so when it is
// worth doing is pinned here: what is skipped, and what still asks for the whole crawl.
import { expect, test } from 'bun:test';
import { shouldCountCountries } from './numbers.mjs';

const today = '2026-05-01';
const before = { checked: '2026-04-20' };

test('nothing is counted without a token', () => {
  expect(shouldCountCountries({ token: undefined, before, today, env: {} })).toBe(false);
  expect(shouldCountCountries({ token: '', before: null, today, env: {} })).toBe(false);
});

test('nothing is counted twice on the same day', () => {
  expect(shouldCountCountries({ token: 'gh', before: { checked: today }, today, env: {} })).toBe(
    false,
  );
});

test('a Vercel build keeps the count it was committed', () => {
  expect(shouldCountCountries({ token: 'gh', before, today, env: { VERCEL: '1' } })).toBe(false);
});

test('a Vercel build counts when SYNC_WORLD=1 asks it to', () => {
  expect(
    shouldCountCountries({ token: 'gh', before, today, env: { VERCEL: '1', SYNC_WORLD: '1' } }),
  ).toBe(true);
});

test('a Vercel build with no count behind it counts anyway', () => {
  expect(shouldCountCountries({ token: 'gh', before: null, today, env: { VERCEL: '1' } })).toBe(
    true,
  );
});

test('elsewhere a count from an earlier day is read again', () => {
  expect(shouldCountCountries({ token: 'gh', before, today, env: {} })).toBe(true);
  expect(shouldCountCountries({ token: 'gh', before: null, today, env: {} })).toBe(true);
});
