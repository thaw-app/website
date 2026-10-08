import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { docsRoute } from '@/lib/shared';
import { thawAlso, thawFeatures } from '@/lib/thaw-features';

/**
 * What Thaw does, as a sheet to read down and not a wall to take in: the ten
 * main features in equal ruled cells, numbered; then everything else by name, filed under what it is
 * for. One cell size and two type sizes throughout, so any row can be read
 * against the next.
 */
export function FeatureList() {
  return (
    <div className="not-prose my-6">
      <ol className="crossed sm:grid-cols-2">
        {thawFeatures.map((feature, index) => (
          <li key={feature.title} className="flex flex-col gap-2 p-6">
            <span aria-hidden className="text-sm text-fd-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display text-xl leading-tight font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="text-fd-muted-foreground text-pretty">{feature.detail}</p>
          </li>
        ))}
      </ol>

      <SectionLabel as="h3">Also in Thaw</SectionLabel>
      <div className="crossed sm:grid-cols-2 lg:grid-cols-3">
        {thawAlso.map(({ group, names }) => (
          <section key={group} className="p-5">
            <h4 className="mb-2.5 text-sm font-medium">{group}</h4>
            <ul className="flex flex-col gap-1 text-sm text-fd-muted-foreground">
              {names.map((entry) =>
                typeof entry === 'string' ? (
                  <li key={entry}>{entry}</li>
                ) : (
                  <li key={entry.name}>
                    <Link
                      href={entry.href}
                      className="tap underline decoration-fd-border underline-offset-4 hover:text-fd-foreground hover:decoration-current"
                    >
                      {entry.name}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
      {/* The lists are Thaw 3's, and Install gives a Mac on macOS 26 Thaw 2: said once, with
          where to find which version a Mac gets. */}
      <p className="mt-4 text-sm text-fd-muted-foreground text-pretty">
        Some of these features are only in Thaw 3.{' '}
        <Link href={`${docsRoute}/thaw/versions`} className="tap text-fd-foreground link">
          See which Thaw your Mac gets
        </Link>
        .
      </p>
    </div>
  );
}
