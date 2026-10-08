import type { Metadata } from 'next';
import Link from 'next/link';
import { verified } from '@/components/assurance';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import community from '@/lib/community.json';
import { longDate } from '@/lib/shared';
import { meanings, readDays } from '@/lib/verified';

export const metadata: Metadata = {
  openGraph: { images: '/og/site/verified/image.png' },
  title: 'What Verified means',
  description:
    'What SLSA, the OpenSSF badges, the Scorecard and test coverage are, who vouches for each, and where Thaw stands.',
};

const read = readDays(community.readOn, {
  bestPractices: 'The Best Practices badge',
  baseline: 'The Baseline level',
  scorecard: 'The Scorecard',
  coverage: 'Test coverage',
});

/**
 * The page behind "What does this mean?" on the home page: each thing in the
 * Verified block, what it is, where Thaw stands on it today, and who says so.
 */
export default function VerifiedPage() {
  return (
    <PageShell>
      <PageHeader
        label="Verified"
        labelHref="/#verified"
        title="Privacy only works if the security around it does."
      >
        <Lead>
          Thaw asks for permissions that reach across your Mac. These are the outside checks on how
          it is built and released: what each one is, and who vouches for it. A score a machine
          gives is not the same as a checklist a project fills in, so each says which it is.
        </Lead>
      </PageHeader>

      <dl className="border-t">
        {meanings.map((entry) => {
          // Matched by what it is: a value that could not be read is missing from the list.
          const now = verified.find((value) => value.id === entry.id);
          return (
            <div
              key={entry.term}
              className="grid gap-x-10 gap-y-3 border-b py-8 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <dt className="flex flex-col gap-1">
                <span className="text-sm text-fd-muted-foreground">{entry.term}</span>
                {now && (
                  <span className="font-display text-3xl leading-tight font-semibold tracking-tight">
                    {now.value}
                  </span>
                )}
              </dt>
              <dd className="flex max-w-2xl flex-col gap-3">
                <p className="text-pretty">{entry.meaning}</p>
                <p className="text-fd-muted-foreground text-pretty">
                  <span className="text-fd-foreground">Who says so.</span> {entry.checkedBy}
                </p>
                <p>
                  <a href={entry.href} className="tap link">
                    {new URL(entry.href).hostname.replace(/^www\./, '')}
                  </a>
                </p>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="text-sm text-fd-muted-foreground">
        {read.day && `Values read on ${longDate(read.day)}. `}
        {read.older.map((entry) => `${entry.name} is from ${longDate(entry.day)}. `)}
        <Link href="/docs/thaw/verifying-releases" className="tap link">
          How to verify a release yourself
        </Link>
        .
      </p>
    </PageShell>
  );
}
