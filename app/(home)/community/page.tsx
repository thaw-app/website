import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Contributors } from '@/components/contributors';
import { NumberCells } from '@/components/number-cells';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Section } from '@/components/section-label';
import { WorldMap } from '@/components/world-map';
import community from '@/lib/community.json';
import {
  contributorNumbers,
  contributors,
  counted,
  numbers,
  translatorNumbers,
  ways,
} from '@/lib/community-page';
import { pageAlternates } from '@/lib/releases';
import { docsRoute, longDate, repoUrl } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/community', '/community.md'),
  openGraph: { images: '/og/site/community/image.png' },
  title: 'Community',
  description: 'Thaw in numbers, where to find the people behind it, and who has contributed.',
};

const repo = repoUrl('thaw');

export default function CommunityPage() {
  return (
    <PageShell>
      <PageHeader {...sitePages.community}>
        <Lead>
          Thaw is free and open source. The people who use it report its bugs, write its fixes and
          translate it.
        </Lead>
      </PageHeader>

      <Section label="In numbers">
        <NumberCells numbers={numbers} accent className="grid-cols-1 sm:grid-cols-3" />
        <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
          {counted.day && `Counted on ${longDate(counted.day)}. `}
          {counted.older.map((entry) => `${entry.name} are from ${longDate(entry.day)}. `)}
          Downloads count each time the app or an update was fetched, not how many people use it.{' '}
          <a href="https://trendshift.io/repositories/21173" className="tap link">
            Trendshift
          </a>{' '}
          has had Thaw as GitHub’s #1 trending repository of the day, according to its badge.
        </p>
      </Section>

      {community.world && community.world.stargazers.list.length > 0 && (
        <Section label="Worldwide">
          <WorldMap counts={community.world} />
        </Section>
      )}

      {community.team.length > 0 && (
        <Section label="The team">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {community.team.map((member) => (
              <li key={member.login}>
                <a
                  href={`https://github.com/${member.login}`}
                  className="group flex flex-col gap-4"
                >
                  <Image src={member.avatar} alt="" width={96} height={96} className="size-24" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-lg leading-tight font-semibold tracking-tight underline-offset-4 group-hover:underline">
                      {'name' in member && member.name ? member.name : member.login}
                    </span>
                    <span className="text-sm text-fd-muted-foreground">@{member.login}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {community.people.length > 0 && (
        <Section label="Contributors">
          <NumberCells numbers={contributorNumbers} />
          <Contributors people={contributors} />
          <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
            Everyone else with a commit since Thaw began in January 2026. Translators are listed
            below.
          </p>
        </Section>
      )}

      {community.translators.length > 0 && (
        <Section label="Translators">
          <NumberCells numbers={translatorNumbers} />
          <dl className="grid border-t md:grid-cols-2 md:gap-x-10">
            {community.translators.map((group) => (
              <div key={group.language} className="flex flex-col gap-1 border-b py-4">
                <dt className="flex items-baseline justify-between gap-4 font-medium">
                  {group.language}
                  <span className="text-sm font-normal text-fd-muted-foreground tabular-nums">
                    {group.people.length}
                  </span>
                </dt>
                <dd className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fd-muted-foreground">
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
          <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
            From Thaw’s{' '}
            <a href={`${repo}/blob/development/CREDITS.md`} className="tap link">
              credits
            </a>
            . Each name opens its Crowdin profile. Is your language missing or unfinished?{' '}
            <Link href={`${docsRoute}/thaw/contribute/translations`} className="tap link">
              Translate it on Crowdin
            </Link>
            , with no pull request.
          </p>
        </Section>
      )}

      <Section label="Take part">
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {ways.map((way) => (
            <li key={way.title}>
              <Link href={way.href} className="group flex flex-col gap-1.5">
                <span className="font-display text-xl font-semibold tracking-tight link group-hover:decoration-current">
                  {way.title}
                </span>
                <span className="text-sm text-fd-muted-foreground text-pretty">{way.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
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
      </Section>
    </PageShell>
  );
}
