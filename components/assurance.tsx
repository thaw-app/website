import { Heading } from 'fumadocs-ui/components/heading';
import Link from 'next/link';
import { ResolvingText } from '@/components/resolving-text';
import community from '@/lib/community.json';
import { compact } from '@/lib/shared';
import { type Verified, verifiedFrom } from '@/lib/verified';

// What outside bodies have verified about how Thaw is built and released.
export const verified = verifiedFrom(community.assurance);

/** The counts from a product's community file that sit under its values. */
export const countsFrom = (
  counts: Record<'stars' | 'downloads' | 'contributors' | 'releases', number>,
) =>
  [
    { value: counts.stars, label: 'GitHub stars' },
    { value: counts.downloads, label: 'downloads' },
    { value: counts.contributors, label: 'contributors' },
    { value: counts.releases, label: 'releases' },
  ].filter((entry) => typeof entry.value === 'number');

/**
 * How a project is run, small enough to read in passing: what has been independently
 * verified about its releases, and how many people use and build it. /verified explains
 * each one.
 */
export function VerifiedBlock({
  values,
  numbers,
  communityHref,
}: {
  values: Verified[];
  numbers: ReturnType<typeof countsFrom>;
  communityHref: string;
}) {
  const stepped = values.length === 5;
  return (
    <>
      <Heading as="h2" id="verified">
        Verified
      </Heading>
      <div className="not-prose my-6">
        {/* One row of five; on a phone they sit as two over three. Any other count falls back
            to even columns. */}
        <ul
          className={`crossed ${stepped ? 'grid-cols-6 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}
        >
          {values.map((entry, index) => (
            <li
              key={entry.id}
              className={stepped ? `${index < 2 ? 'col-span-3' : 'col-span-2'} sm:col-span-1` : ''}
            >
              <Link
                href={entry.href}
                title={entry.detail}
                className="flex h-full flex-col gap-1 p-3 transition-colors hover:bg-fd-accent"
              >
                <span className="text-xs text-fd-muted-foreground text-pretty">{entry.label}</span>
                <span className="mt-auto font-display text-lg leading-tight font-semibold tracking-tight">
                  <ResolvingText>{entry.value}</ResolvingText>
                </span>
                {/* How far up its scale the value is, in the colour its own badge has. */}
                <span aria-hidden className="mt-1 flex h-1 gap-1">
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
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fd-muted-foreground">
          {numbers.map((entry) => (
            <span key={entry.label}>
              <span className="font-medium text-fd-foreground">{compact.format(entry.value)}</span>{' '}
              {entry.label}
            </span>
          ))}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/verified" className="tap link">
            What does this mean?
          </Link>
          <Link href={communityHref} className="tap link">
            Community
          </Link>
        </p>
      </div>
    </>
  );
}

export function Assurance() {
  return (
    <VerifiedBlock values={verified} numbers={countsFrom(community)} communityHref="/community" />
  );
}
