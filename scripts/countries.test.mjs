// What a profile's free-text location is taken to mean. Each case is one a real profile
// had, or one that must stay uncounted.
import { expect, test } from 'bun:test';
import { countCountries, countryOf } from './countries.mjs';

test('a country by its name, in English or its own language', () => {
  expect(countryOf('Germany')).toBe('DE');
  expect(countryOf('México')).toBe('MX');
  expect(countryOf('Türkiye')).toBe('TR');
  expect(countryOf('Seoul, Republic of Korea')).toBe('KR');
});

test('a town with its country, however it is punctuated', () => {
  expect(countryOf('Melbourne, Australia')).toBe('AU');
  expect(countryOf('Goiânia | Brazil')).toBe('BR');
  expect(countryOf('Shenzhen，Guangzhou，China')).toBe('CN');
  expect(countryOf('Shanghai China')).toBe('CN');
  expect(countryOf('Canary Islands, Spain.')).toBe('ES');
});

test('a US state, by name or as the code after a town', () => {
  expect(countryOf('California')).toBe('US');
  expect(countryOf('Oakland, CA')).toBe('US');
  expect(countryOf('Santa Clara, California')).toBe('US');
});

test('a town alone, when it is on the list', () => {
  expect(countryOf('Tübingen')).toBe('DE');
  expect(countryOf('Lyon')).toBe('FR');
  expect(countryOf('Budapest')).toBe('HU');
});

test('a country code after a town, and a common one standing alone', () => {
  expect(countryOf('Zürich, CH')).toBe('CH');
  expect(countryOf('cn')).toBe('CN');
});

test('someone in two places is counted in the first', () => {
  expect(countryOf('SF, U.S. | SYD, AUS')).toBe('US');
});

test('what could be two places, or is no place, stays uncounted', () => {
  // India or Indiana; Canada or California.
  expect(countryOf('IN')).toBeNull();
  expect(countryOf('CA')).toBeNull();
  // Shenzhen far more often than Eswatini.
  expect(countryOf('SZ')).toBeNull();
  expect(countryOf('localhost:8000')).toBeNull();
  expect(countryOf('Earth')).toBeNull();
  // Not a country, though it has a code.
  expect(countryOf('European Union')).toBeNull();
});

test('counting keeps how many were asked and how many placed', () => {
  const counted = countCountries(['Germany', 'Berlin', null, 'Mars', 'France']);
  expect(counted.people).toBe(5);
  expect(counted.placed).toBe(3);
  expect(counted.list[0]).toEqual({ code: 'DE', name: 'Germany', people: 2 });
});
