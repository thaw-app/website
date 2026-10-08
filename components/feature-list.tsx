import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { docsRoute } from '@/lib/shared';
import { betaOnly, thawAlso, thawFeatures } from '@/lib/thaw-features';

/**
 * What Thaw does, as a sheet to read down and not a wall to take in: the ten
 * main features in equal ruled cells, numbered; then everything else by name, filed under what it is
 * for. One cell size and two type sizes throughout, so any row can be read
 * against the next.
 */
/** Beside a feature the stable release does not have yet. */
function Beta() {
  return (
    <span className="border px-1.5 py-0.5 text-xs whitespace-nowrap text-fd-muted-foreground">
      Thaw 3 beta
    </span>
  );
}

export function FeatureList() {
  return (
    <div className="not-prose my-6">
      <ol className="crossed grid border-t border-l sm:grid-cols-2">
        {thawFeatures.map((feature, index) => (
          <li key={feature.title} className="flex flex-col gap-2 border-r border-b p-6">
            <span className="flex items-center justify-between gap-3">
              <span aria-hidden className="text-sm text-fd-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              {feature.beta === true && <Beta />}
            </span>
            <h3 className="font-display text-xl leading-tight font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="text-fd-muted-foreground text-pretty">{feature.detail}</p>
            {typeof feature.beta === 'string' && (
              <p className="text-sm text-fd-muted-foreground text-pretty">{feature.beta}</p>
            )}
          </li>
        ))}
      </ol>

      <SectionLabel as="h3">Also in Thaw</SectionLabel>
      <div className="crossed grid border-t border-l sm:grid-cols-2 lg:grid-cols-3">
        {thawAlso.map(({ group, names }) => (
          <section key={group} className="border-r border-b p-5">
            <h4 className="mb-2.5 text-sm font-medium">{group}</h4>
            <ul className="flex flex-col gap-1 text-sm text-fd-muted-foreground">
              {names.map((entry) =>
                typeof entry === 'string' ? (
                  <li key={entry} className="flex items-baseline justify-between gap-3">
                    {entry}
                    {betaOnly.has(entry) && <Beta />}
                  </li>
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
      {/* The list is Thaw 3's, and Install gives a Mac on macOS 26 Thaw 2: said once, quietly,
          with where to find which version a Mac gets. */}
      <p className="mt-4 text-sm text-fd-muted-foreground text-pretty">
        Features marked <Beta /> are not in Thaw 2 yet.{' '}
        <Link href={`${docsRoute}/thaw/versions`} className="tap text-fd-foreground link">
          Which Thaw your Mac gets
        </Link>{' '}
        is in the documentation.
      </p>
    </div>
  );
}
