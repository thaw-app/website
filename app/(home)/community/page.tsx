import type { Metadata } from 'next';
import Link from 'next/link';
import { Contributors } from '@/components/contributors';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { SectionLabel } from '@/components/section-label';
import { WorldMap } from '@/components/world-map';
import community from '@/lib/community.json';
import { compact, docsRoute, links, longDate, repoUrl } from '@/lib/shared';
import { readDays } from '@/lib/verified';

export const metadata: Metadata = {
  openGraph: { images: '/og/site/community/image.png' },
  title: 'Community',
  description: 'Thaw in numbers, where to find the people behind it, and who has contributed.',
};

const repo = repoUrl('thaw');

// The team is shown on its own, so it is left out of the list of contributors.
const teamLogins = new Set(community.team.map((member) => member.login));
const contributors = community.people.filter((person) => !teamLogins.has(person.login));

// A person who translates into two languages is one person.
const translatorCount = new Set(
  community.translators.flatMap((group) =>
    group.people.map((person) => ('username' in person && person.username) || person.name),
  ),
).size;

// The day the numbers were read, and any kept from an earlier day.
const counted = readDays(community.readOn, {
  stars: 'Stars',
  downloads: 'Downloads',
  homebrewYear: 'Homebrew installs',
  contributors: 'Contributors',
  releases: 'Releases',
  discord: 'Discord members',
});

// Every number is fetched when the site is built; one that could not be is left out.
const numbers = [
  { label: 'GitHub stars', value: community.stars, unit: 'on thaw\u2011app/Thaw' },
  // Every fetch of the app or of an update to it: one person on ten releases is ten.
  { label: 'Downloads', value: community.downloads, unit: 'of the app and its updates' },
  { label: 'Homebrew installs', value: community.homebrewYear, unit: 'in the last year' },
  {
    label: 'Countries',
    value: community.world?.stargazers.list.length,
    unit: 'its stars come from',
  },
  {
    label: 'Contributors',
    value: contributors.length + community.team.length,
    unit: 'with commits since January 2026',
  },
  // English, which Thaw is written in, and every language it has been translated into.
  {
    label: 'Languages',
    value: community.translators.length + 1,
    unit: 'English and its translations',
  },
  { label: 'Releases', value: community.releases, unit: 'published on GitHub' },
  { label: 'Discord members', value: community.discord, unit: 'on the Thaw server' },
].filter((number) => typeof number.value === 'number');

// The ways in, each to the place it happens. One row, since the footer has the same doors.
const ways = [
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

export default function CommunityPage() {
  return (
    <PageShell>
      <PageHeader label="Community" title="Thaw is built by the people who use it.">
        <Lead>
          Thaw is free and open source. The people who use it report its bugs, write its fixes and
          translate it.
        </Lead>
      </PageHeader>

      <section className="flex flex-col gap-6">
        <SectionLabel>In numbers</SectionLabel>
        <dl className="crossed grid grid-cols-2 border-t border-l lg:grid-cols-4">
          {numbers.map((number) => (
            <div key={number.label} className="flex flex-col gap-1 border-r border-b p-4 sm:p-6">
              <dt className="text-sm text-fd-muted-foreground">{number.label}</dt>
              <dd className="font-display text-4xl font-semibold tracking-tight xl:text-5xl">
                {compact.format(number.value)}
              </dd>
              <dd className="text-sm text-fd-muted-foreground">{number.unit}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-fd-muted-foreground">
          {counted.day && `Counted on ${longDate(counted.day)}. `}
          {counted.older.map((entry) => `${entry.name} are from ${longDate(entry.day)}. `)}
          Downloads count each time the app or an update was fetched, not how many people use it.{' '}
          <a href="https://trendshift.io/repositories/21173" className="tap link">
            Trendshift
          </a>{' '}
          has had Thaw as GitHub’s #1 trending repository of the day, according to its badge.
        </p>
      </section>

      {community.world && community.world.stargazers.list.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionLabel>Worldwide</SectionLabel>
          <WorldMap />
        </section>
      )}

      {community.team.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionLabel>The team</SectionLabel>
          <ul className="crossed grid border-t border-l sm:grid-cols-3 lg:grid-cols-5">
            {community.team.map((member) => (
              <li key={member.login} className="border-r border-b">
                <a
                  href={`https://github.com/${member.login}`}
                  className="flex h-full flex-col gap-4 p-5 transition-colors hover:bg-fd-accent"
                >
                  {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
                  <img
                    src={member.avatar}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    className="size-24"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-lg leading-tight font-semibold tracking-tight">
                      {'name' in member && member.name ? member.name : member.login}
                    </span>
                    <span className="text-sm text-fd-muted-foreground">@{member.login}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {community.people.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionLabel>Contributors</SectionLabel>
          <Contributors people={contributors} />
          <p className="text-sm text-fd-muted-foreground">
            Everyone else with a commit since Thaw began in January 2026. Translators are listed
            below.
          </p>
        </section>
      )}

      {community.translators.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionLabel>Translators</SectionLabel>
          <dl className="border-t">
            {community.translators.map((group) => (
              <div
                key={group.language}
                className="grid gap-x-8 gap-y-1 border-b py-4 sm:grid-cols-[14rem_minmax(0,1fr)]"
              >
                <dt className="font-medium">{group.language}</dt>
                <dd className="flex flex-wrap gap-x-4 gap-y-1 text-fd-muted-foreground">
                  {group.people.map((person) =>
                    'username' in person && person.username ? (
                      <a
                        key={person.name}
                        href={`https://crowdin.com/profile/${person.username}`}
                        className="tap transition-colors hover:text-fd-foreground"
                      >
                        {person.name}
                      </a>
                    ) : (
                      // Someone whose Crowdin account is gone has a name and no profile.
                      <span key={person.name} className="tap">
                        {person.name}
                      </span>
                    ),
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-fd-muted-foreground">
            {translatorCount} people across {community.translators.length} languages, from Thaw’s{' '}
            <a href={`${repo}/blob/development/CREDITS.md`} className="tap link">
              credits
            </a>
            . Listed alphabetically within each language. Each name opens its Crowdin profile.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <SectionLabel>Take part</SectionLabel>
        <ul className="crossed grid border-t border-l sm:grid-cols-2 lg:grid-cols-4">
          {ways.map((way) => (
            <li key={way.title} className="border-r border-b">
              <Link
                href={way.href}
                className="flex h-full flex-col gap-1.5 p-6 transition-colors hover:bg-fd-accent"
              >
                <span className="font-display text-xl font-semibold tracking-tight">
                  {way.title}
                </span>
                <span className="text-sm text-fd-muted-foreground text-pretty">{way.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-fd-muted-foreground">
          New here? There is a list of{' '}
          <a
            href={`${repo}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
            className="tap text-fd-foreground link"
          >
            good first issues
          </a>
          . The tools and services the project runs on, and its licences, are on{' '}
          <Link href="/built-with" className="tap text-fd-foreground link">
            Built with
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
