import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Contributors } from '@/components/contributors';
import { NumberCells } from '@/components/number-cells';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Section } from '@/components/section-label';
import { WorldMap } from '@/components/world-map';
import {
  floeContributorNumbers,
  floeContributors,
  floeCounted,
  floeNumbers,
  floeWays,
} from '@/lib/floe-community';
import community from '@/lib/floe-community.json';
import { pageAlternates } from '@/lib/releases';
import { longDate, repoUrl } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/floe/community', '/floe/community.md'),
  openGraph: { images: '/og/site/floeCommunity/image.png' },
  title: 'Floe community',
  description: 'Floe in numbers, where to find the people behind it, and who has contributed.',
};

const repo = repoUrl('floe');

// Thaw's community page, for a project a few weeks old: the same sections, each shown once
// there is something in it.
export default function FloeCommunityPage() {
  return (
    <PageShell tone="floe">
      <PageHeader {...sitePages.floeCommunity}>
        <Lead>
          Floe is free and open source, under AGPL-3.0. It began in October 2026, and these are the
          people who have worked on it so far.
        </Lead>
      </PageHeader>

      <Section label="In numbers">
        <NumberCells
          numbers={floeNumbers}
          accent
          className={floeNumbers.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}
        />
        <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
          {floeCounted.day && `Counted on ${longDate(floeCounted.day)}. `}
          {floeCounted.older.map((entry) => `${entry.name} are from ${longDate(entry.day)}. `)}
          Homebrew installs are added once Floe has a cask.
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
                      {member.name ?? member.login}
                    </span>
                    <span className="text-sm text-fd-muted-foreground">@{member.login}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {floeContributors.length > 0 && (
        <Section label="Contributors">
          <NumberCells numbers={floeContributorNumbers} />
          <Contributors people={floeContributors} />
          <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
            Everyone else with a commit since Floe began in October 2026.
          </p>
        </Section>
      )}

      <Section label="Take part">
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {floeWays.map((way) => (
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
          Found a bug or want something Floe doesn’t do?{' '}
          <a href={`${repo}/issues`} className="tap text-fd-foreground link">
            Open an issue
          </a>
          . What Floe is built from, Thaw among it, is in its{' '}
          <a href={`${repo}/blob/main/CREDITS.md`} className="tap text-fd-foreground link">
            credits
          </a>
          .
        </p>
      </Section>
    </PageShell>
  );
}
