import type { Metadata } from 'next';
import Link from 'next/link';
import { Contributors } from '@/components/contributors';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ResolvingText } from '@/components/resolving-text';
import { Section } from '@/components/section-label';
import { WorldMap } from '@/components/world-map';
import { floeContributors, floeCounted, floeNumbers, floeWays } from '@/lib/floe-community';
import community from '@/lib/floe-community.json';
import { pageAlternates } from '@/lib/releases';
import { compact, longDate, repoUrl } from '@/lib/shared';
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
        <dl className="crossed grid-cols-2 lg:grid-cols-3">
          {floeNumbers.map((number) => (
            <div key={number.label} className="group flex flex-col gap-1 p-4 sm:p-6">
              <dt className="text-sm text-fd-muted-foreground">{number.label}</dt>
              <dd className="font-display text-4xl font-semibold tracking-tight group-first:text-(--product-tone) xl:text-5xl">
                <ResolvingText>{compact.format(number.value)}</ResolvingText>
              </dd>
              <dd className="text-sm text-fd-muted-foreground">{number.unit}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
          {floeCounted.day && `Counted on ${longDate(floeCounted.day)}. `}
          {floeCounted.older.map((entry) => `${entry.name} are from ${longDate(entry.day)}. `)}
          Downloads and Homebrew installs are added once Floe has a release to count them from.
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
                  {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
                  <img
                    src={`${member.avatar}${member.avatar.includes('?') ? '&' : '?'}s=192`}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    className="size-24"
                  />
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
