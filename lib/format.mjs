// Small things said the same way by the pages and by the scripts that fetch for them. Plain
// JavaScript, with nothing imported, so both can read it: the scripts are run by Node as
// they are, and cannot read the site's TypeScript.

/**
 * "In numbers" as "in-numbers": what a name is called in an address.
 * @param {string} text
 * @returns {string}
 */
export function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * "2026-10-07" as "7 October 2026", for a date a person reads: day first.
 * @param {string} day
 * @returns {string}
 */
export function longDate(day) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
