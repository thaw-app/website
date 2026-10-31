import community from '@/lib/community.json';
import { compact, docsRoute, links } from '@/lib/shared';
import { readDays } from '@/lib/verified';

// What the community page says (app/(home)/community/page.tsx), kept here so the page's
// Markdown (lib/site-markdown.ts) says the same.

// The team is shown on its own, so it is left out of the list of contributors.
const teamLogins = new Set(community.team.map((member) => member.login));
export const contributors = community.people.filter((person) => !teamLogins.has(person.login));

// A person who translates into two languages is one person.
export const translatorCount = new Set(
  community.translators.flatMap((group) =>
    group.people.map((person) => ('username' in person && person.username) || person.name),
  ),
).size;

// The day the numbers were read, and any kept from an earlier day.
export const counted = readDays(community.readOn, {
  stars: 'Stars',
  downloads: 'Downloads',
  homebrewYear: 'Homebrew installs',
  contributors: 'Contributors',
  issuesFixed: 'Issues fixed',
  discord: 'Discord members',
});

// Every number is fetched when the site is built; one that could not be is left out. Each
// is said once on the page, with what it counts: the countries beside the map, the
// Discord's members where the page says how to join it, and these first three at the top.
const counts = (list: { label: string; value?: number; unit: string }[]) =>
  list.filter(
    (number): number is { label: string; value: number; unit: string } =>
      typeof number.value === 'number',
  );

export const numbers = counts([
  { label: 'GitHub stars', value: community.stars, unit: 'on thaw\u2011app/Thaw' },
  // Every fetch of the app or of an update to it: one person on ten releases is ten.
  { label: 'Downloads', value: community.downloads, unit: 'of the app and its updates' },
  { label: 'Homebrew installs', value: community.homebrewYear, unit: 'in the last year' },
]);

export const contributorNumbers = counts([
  {
    label: 'Contributors',
    value: contributors.length + community.team.length,
    unit: 'with commits since January 2026',
  },
  { label: 'Issues fixed', value: community.issuesFixed, unit: 'closed as done on GitHub' },
]);

export const translatorNumbers = counts([
  // English, which Thaw is written in, and every language it has been translated into.
  {
    label: 'Languages',
    value: community.translators.length + 1,
    unit: 'English and its translations',
  },
  { label: 'Translators', value: translatorCount, unit: 'on Crowdin' },
]);

// The ways in, each to the place it happens. One row, since the footer has the same doors.
export const ways = [
  {
    title: 'Fix something',
    detail: 'Where each kind of work happens, and what a pull request needs.',
    href: `${docsRoute}/thaw/contribute`,
  },
  {
    title: 'Translate it',
    detail: 'Done on Crowdin, with no pull request. This is how to join.',
    href: `${docsRoute}/thaw/contribute/translations`,
  },
  {
    title: 'Talk to us',
    detail: community.discord
      ? `${compact.format(community.discord)} people are on the Discord server.`
      : 'Questions and conversation, on Discord.',
    href: links.discord,
  },
  {
    title: 'Sponsor it',
    detail: 'Through GitHub Sponsors, for support and partnerships.',
    href: links.sponsors,
  },
];
