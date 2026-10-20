import community from '@/lib/floe-community.json';
import { compact, docsRoute, links } from '@/lib/shared';
import { readDays } from '@/lib/verified';

// What Floe's community page says (app/(floe)/floe/community/page.tsx), kept here so the
// page's Markdown (lib/site-markdown.ts) says the same. Floe's numbers are read by the same
// sync as Thaw's, into lib/floe-community.json.

const teamLogins = new Set(community.team.map((member) => member.login));
export const floeContributors = community.people.filter((person) => !teamLogins.has(person.login));

export const floeCounted = readDays(community.readOn, {
  stars: 'Stars',
  downloads: 'Downloads',
  homebrewYear: 'Homebrew installs',
  contributors: 'Contributors',
  releases: 'Releases',
});

// The same numbers as Thaw's page, each shown once it can be counted: Floe has no release
// on GitHub, no Homebrew cask and no translation yet, so for now it has two.
const counts = community as Partial<Record<'downloads' | 'homebrewYear' | 'releases', number>>;
export const floeNumbers = [
  { label: 'GitHub stars', value: community.stars, unit: 'on thaw‑app/Floe' },
  { label: 'Downloads', value: counts.downloads, unit: 'of the app and its updates' },
  { label: 'Homebrew installs', value: counts.homebrewYear, unit: 'in the last year' },
  {
    label: 'Contributors',
    value: floeContributors.length + community.team.length,
    unit: 'with commits since October 2026',
  },
  community.translators.length > 0 && {
    label: 'Languages',
    value: community.translators.length + 1,
    unit: 'English and its translations',
  },
  { label: 'Releases', value: counts.releases, unit: 'published on GitHub' },
].filter(
  (number): number is { label: string; value: number; unit: string } =>
    !!number && typeof number.value === 'number',
);

export const floeWays = [
  {
    title: 'Fix something',
    detail: 'Where each kind of work happens, and what a pull request needs.',
    href: `${docsRoute}/floe/contribute`,
  },
  {
    title: 'Add an extension',
    detail: 'How Floe runs Raycast extensions, and how to add one.',
    href: `${docsRoute}/floe/development`,
  },
  {
    title: 'Translate it',
    detail: 'Done on Crowdin, with no pull request. No language is finished yet.',
    href: 'https://crowdin.com/project/floe',
  },
  {
    title: 'Talk to us',
    detail: community.discord
      ? `${compact.format(community.discord)} people are on the Discord server, which Floe shares with Thaw.`
      : 'Questions and conversation, on the Discord server Floe shares with Thaw.',
    href: links.discord,
  },
];
