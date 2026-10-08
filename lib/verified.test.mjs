// The Verified block states what outside bodies say about Thaw. These pin that a value is
// never shown under another's name, and that the words beside it follow from the value.
import { expect, test } from 'bun:test';
import { meanings, readDays, verifiedFrom } from './verified.ts';

const full = { bestPractices: 'gold', baseline: 3, scorecard: 9.1, coverage: 92.3 };

test('every value has an explanation, and every explanation is of a known value', () => {
  const ids = verifiedFrom(full).map((entry) => entry.id);
  expect(ids).toEqual(meanings.map((entry) => entry.id));
});

test('a value that could not be read does not shift the others under the wrong name', () => {
  const values = verifiedFrom({ ...full, bestPractices: undefined, baseline: undefined });
  const shown = Object.fromEntries(
    meanings.map((entry) => [entry.id, values.find((value) => value.id === entry.id)?.value]),
  );
  expect(shown).toEqual({
    slsa: 'Level 3',
    bestPractices: undefined,
    baseline: undefined,
    scorecard: '9.1 / 10',
    coverage: '92.3%',
  });
});

test('only the highest badge and the top level are called that', () => {
  const said = (assurance, id) => verifiedFrom(assurance).find((entry) => entry.id === id)?.detail;
  expect(said(full, 'bestPractices')).toContain('The highest of three badges');
  expect(said({ bestPractices: 'silver' }, 'bestPractices')).toContain(
    'The second of three badges',
  );
  expect(said({ bestPractices: 'passing' }, 'bestPractices')).toContain(
    'The lowest of three badges',
  );
  expect(said(full, 'baseline')).toContain('Met at the top level');
  expect(said({ baseline: 2 }, 'baseline')).toContain('Met at Level 2 of 3');
  // A badge the site has no name for is left out, not drawn as no steps.
  expect(said({ bestPractices: 'in_progress' }, 'bestPractices')).toBeUndefined();
});

test('numbers kept from an earlier day are named as older', () => {
  const names = { scorecard: 'the Scorecard', coverage: 'test coverage', baseline: 'Baseline' };
  expect(readDays({ scorecard: '2026-10-01', coverage: '2026-10-08' }, names)).toEqual({
    day: '2026-10-08',
    older: [{ name: 'the Scorecard', day: '2026-10-01' }],
  });
  expect(readDays({}, names)).toEqual({ day: undefined, older: [] });
});
