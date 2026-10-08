import type { Metadata } from 'next';
import Link from 'next/link';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Section } from '@/components/section-label';
import { pageAlternates } from '@/lib/releases';
import { docsRoute, links } from '@/lib/shared';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What this website collects about its visitors: no analytics, no cookies and no tracking.',
  alternates: pageAlternates('/privacy'),
};

// Each of these was checked against the running site, and is true of the code in this
// repo. One that stops being true (analytics added, a cookie set, an outside script
// loaded) has to be changed here in the same change.
const facts = [
  {
    name: 'Analytics and tracking',
    said: 'None. The site runs no analytics, no advertising and no tracking scripts, and nothing counts or follows visits.',
  },
  {
    name: 'Cookies',
    said: 'None. The site does not set any.',
  },
  {
    name: 'Kept in your browser',
    said: 'One thing: whether you chose the light or the dark theme, so the site opens that way next time. It stays in your browser and is not sent anywhere.',
  },
  {
    name: 'Search',
    said: 'What you type in the search panel is answered by this site’s own server. The site’s code does not keep it.',
  },
  {
    name: 'Fonts and scripts',
    said: 'Served from the site itself. No page loads a font or a script from another company.',
  },
];

const others = [
  {
    name: 'Vercel',
    said: 'The site is hosted by Vercel. Like any web host, its servers receive each request your browser makes, with your IP address and browser details, and it keeps logs of them under its own privacy policy.',
  },
  {
    name: 'GitHub',
    said: 'The community page shows contributors’ pictures, which your browser loads from GitHub. GitHub receives that request as it would for any picture on its own site. Following a link to GitHub, Discord or Crowdin takes you to them, under their policies.',
  },
];

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
          {facts.map((fact) => (
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
          {others.map((other) => (
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
