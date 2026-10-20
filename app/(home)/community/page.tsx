import type { Metadata } from 'next';
import Link from 'next/link';
import { Contributors } from '@/components/contributors';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ResolvingText } from '@/components/resolving-text';
import { Section } from '@/components/section-label';
import { WorldMap } from '@/components/world-map';
import community from '@/lib/community.json';
import { contributors, counted, numbers, translatorCount, ways } from '@/lib/community-page';
import { pageAlternates } from '@/lib/releases';
import { compact, longDate, repoUrl } from '@/lib/shared';
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
        <dl className="crossed grid-cols-2 lg:grid-cols-3">
          {numbers.map((number) => (
            <div key={number.label} className="group flex flex-col gap-1 p-4 sm:p-6">
              <dt className="text-sm text-fd-muted-foreground">{number.label}</dt>
              {/* The first number, the stars, is the one in the accent. */}
              <dd className="font-display text-4xl font-semibold tracking-tight group-first:text-(--product-tone) xl:text-5xl">
                <ResolvingText>{compact.format(number.value)}</ResolvingText>
              </dd>
              <dd className="text-sm text-fd-muted-foreground">{number.unit}</dd>
            </div>
          ))}
        </dl>
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
                  {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
                  <img
                    // GitHub's own address gives the full picture unless told a size: twice the
                    // 96px it is drawn at, for sharp screens.
                    src={`${member.avatar}${member.avatar.includes('?') ? '&' : '?'}s=192`}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    className="size-24"
                  />
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
          <Contributors people={contributors} />
          <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
            Everyone else with a commit since Thaw began in January 2026. Translators are listed
            below.
          </p>
        </Section>
      )}

      {community.translators.length > 0 && (
        <Section label="Translators">
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
          <p className="max-w-3xl text-sm text-fd-muted-foreground text-pretty">
            {translatorCount} people across {community.translators.length} languages, from Thaw’s{' '}
            <a href={`${repo}/blob/development/CREDITS.md`} className="tap link">
              credits
            </a>
            . Listed alphabetically within each language. Each name opens its Crowdin profile.
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
