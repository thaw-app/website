import type { Metadata } from 'next';
import Link from 'next/link';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Section } from '@/components/section-label';
import { privacyFacts, privacyOthers } from '@/lib/privacy';
import { pageAlternates } from '@/lib/releases';
import { docsRoute, links } from '@/lib/shared';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What this website collects about its visitors: no analytics, no cookies and no tracking.',
  alternates: pageAlternates('/privacy', '/privacy.md'),
};

/**
 * What the website itself collects, which is separate from what the app does: the app's
 * own network calls are in the docs.
 */
export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader label="Privacy" title="This site does not track you.">
        <Lead>
          This page is about the website. What the Thaw app sends over the network is{' '}
          <Link href={`${docsRoute}/thaw/network`} className="tap text-fd-foreground link">
            in the documentation
          </Link>
          .
        </Lead>
      </PageHeader>

      <Section label="What the site collects">
        <dl className="border-t">
          {privacyFacts.map((fact) => (
            <div
              key={fact.name}
              className="grid gap-x-8 gap-y-1 border-b py-4 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <dt className="font-medium">{fact.name}</dt>
              <dd className="max-w-2xl text-fd-muted-foreground text-pretty">{fact.said}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label="Who else is involved">
        <dl className="border-t">
          {privacyOthers.map((other) => (
            <div
              key={other.name}
              className="grid gap-x-8 gap-y-1 border-b py-4 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <dt className="font-medium">{other.name}</dt>
              <dd className="max-w-2xl text-fd-muted-foreground text-pretty">{other.said}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <p className="text-sm text-fd-muted-foreground">
        The site’s code is public, so any of this can be checked.{' '}
        <a href={`${links.github}/website`} className="tap link">
          Read it on GitHub
        </a>
        , or open an issue there if something here looks wrong.
      </p>
    </PageShell>
  );
}
