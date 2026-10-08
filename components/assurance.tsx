import Link from 'next/link';
import community from '@/lib/community.json';
import { compact, longDate } from '@/lib/shared';
import { readDays, verifiedFrom } from '@/lib/verified';

const plain = new Intl.NumberFormat('en');
const { assurance } = community;

// What outside bodies have verified about how Thaw is built and released.
export const verified = verifiedFrom(assurance);

// The sentence that counts Thaw among the Gold and Level 3 projects is only true of one.
const amongTheFew = assurance.bestPractices === 'gold' && assurance.baseline === 3;

const stepped = verified.length === 5;

const read = readDays(community.readOn, {
  bestPractices: 'the Best Practices badge',
  baseline: 'the Baseline level',
  scorecard: 'the Scorecard',
  coverage: 'test coverage',
});

const numbers = [
  { value: community.stars, label: 'GitHub stars' },
  { value: community.downloads, label: 'downloads' },
  { value: community.contributors, label: 'contributors' },
  { value: community.releases, label: 'releases' },
].filter((entry) => typeof entry.value === 'number');

/**
 * How the project is run, in two rows: what has been independently verified
 * about its releases, and how many people use and build it.
 */
export function Assurance() {
  return (
    <>
      <h2 id="verified">Verified</h2>
      <div className="not-prose my-6">
        {/* Why any of this is on the page, in the words the maintainer gave when asked what
            Thaw's permissions are for (issue 687). */}
        <p className="mb-3 font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
          Privacy only works if the security around it does.
        </p>
        <p className="mb-6 text-fd-muted-foreground text-pretty">
          Thaw asks for permissions that reach across your Mac, so we look at the whole release
          process and not only at what the app does.
          {assurance.field && (
            <>
              {' '}
              Of the {plain.format(assurance.field.projects)} projects on OpenSSF’s Best Practices
              list, {assurance.field.gold} hold Gold and {assurance.field.baseline3} meet every
              Baseline control at Level 3.
              {amongTheFew && ' Thaw, a free menu bar app, is one of them.'}
            </>
          )}
        </p>
        {/* Five cells sit as two over three; any other count falls back to even columns. */}
        <ul
          className={`crossed grid border-t border-l ${stepped ? 'sm:grid-cols-6' : 'sm:grid-cols-2 xl:grid-cols-4'}`}
        >
          {verified.map((entry, index) => (
            <li
              key={entry.id}
              className={`border-r border-b ${stepped ? (index < 2 ? 'sm:col-span-3' : 'sm:col-span-2') : ''}`}
            >
              <Link
                href={entry.href}
                className="flex h-full flex-col gap-1 p-5 transition-colors hover:bg-fd-accent"
              >
                <span className="text-sm text-fd-muted-foreground">{entry.label}</span>
                <span className="font-display text-3xl leading-tight font-semibold tracking-tight">
                  {entry.value}
                </span>
                {/* How far up its scale the value is, in the colour its own badge has. */}
                <span aria-hidden className="my-1.5 flex h-1 gap-1">
                  {entry.steps ? (
                    Array.from({ length: entry.steps }, (_, step) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: fixed steps of one scale
                        key={step}
                        className="flex-1 bg-fd-foreground/10"
                        style={step < (entry.reached ?? 0) ? { background: entry.tone } : undefined}
                      />
                    ))
                  ) : (
                    <span className="flex-1 bg-fd-foreground/10">
                      <span
                        className="block h-full"
                        style={{ width: `${(entry.share ?? 0) * 100}%`, background: entry.tone }}
                      />
                    </span>
                  )}
                </span>
                {/* What the value means, in a line. */}
                <span className="text-sm text-fd-muted-foreground text-pretty">{entry.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fd-muted-foreground text-pretty">
          {read.day && `Read from OpenSSF and SonarQube Cloud on ${longDate(read.day)}. `}
          {/* One whose source could not be reached since is an older reading, and says so. */}
          {read.older.map(
            (entry) => `The value for ${entry.name} is from ${longDate(entry.day)}. `,
          )}
          The SLSA level is the one Thaw’s release pipeline is built to.
        </p>
        <Link
          href="/verified"
          className="tap mt-3 flex items-center justify-between border px-5 py-3 font-medium transition-colors hover:bg-fd-accent"
        >
          What does this mean?
          <span aria-hidden className="text-fd-muted-foreground">
            Each one explained
          </span>
        </Link>
        <p className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-fd-muted-foreground">
          {numbers.map((entry) => (
            <span key={entry.label}>
              <span className="font-medium text-fd-foreground tabular-nums">
                {compact.format(entry.value)}
              </span>{' '}
              {entry.label}
            </span>
          ))}
          <Link href="/community" className="tap text-fd-foreground link">
            Community
          </Link>
        </p>
      </div>
    </>
  );
}
