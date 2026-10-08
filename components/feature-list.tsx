import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { docsRoute } from '@/lib/shared';
import { betaOnly, thawAlso, thawFeatures, thawVersions } from '@/lib/thaw-features';

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
      {/* The list is Thaw 3's, and Install gives most Macs Thaw 2: which one a Mac gets,
          said before the features, so nobody installs for a feature they will not have. */}
      <p className="mb-3 text-fd-muted-foreground text-pretty">
        Your macOS decides which Thaw you get. Features marked <Beta /> are in Thaw 3 and not yet in
        Thaw 2, the stable release.
      </p>
      {/* Four columns do not fit a phone, and the last one is the one to act on: there
          each version is a short block with its command under it. */}
      <ul className="mb-6 divide-y border text-sm sm:hidden">
        {thawVersions.map((version) => (
          <li key={version.thaw} className="flex flex-col gap-1 px-4 py-3">
            <span>
              <span className="font-medium">{version.macos}</span>{' '}
              <span className="text-fd-muted-foreground">
                gets {version.thaw}. {version.channel}.
              </span>
            </span>
            {version.install.startsWith('brew ') ? (
              <code className="font-mono">{version.install}</code>
            ) : (
              <span className="text-fd-muted-foreground">{version.install}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mb-6 overflow-x-auto border max-sm:hidden">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Which version of Thaw runs on which macOS</caption>
          <thead className="text-fd-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="px-4 py-2.5 font-normal">
                Your Mac runs
              </th>
              <th scope="col" className="px-4 py-2.5 font-normal">
                You get
              </th>
              <th scope="col" className="px-4 py-2.5 font-normal">
                Channel
              </th>
              <th scope="col" className="px-4 py-2.5 font-normal">
                Install
              </th>
            </tr>
          </thead>
          <tbody>
            {thawVersions.map((version) => (
              <tr key={version.thaw} className="border-b last:border-b-0">
                <th scope="row" className="px-4 py-2.5 font-medium whitespace-nowrap">
                  {version.macos}
                </th>
                <td className="px-4 py-2.5 whitespace-nowrap">{version.thaw}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-fd-muted-foreground">
                  {version.channel}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-fd-muted-foreground">
                  {version.install.startsWith('brew ') ? (
                    <code className="font-mono text-fd-foreground">{version.install}</code>
                  ) : (
                    version.install
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      <p className="mt-4 text-sm text-fd-muted-foreground">
        The{' '}
        <Link href={`${docsRoute}/thaw`} className="tap text-fd-foreground link">
          Thaw documentation
        </Link>{' '}
        covers installing it, its permissions, fixes for common problems and scripting it with
        thaw:// links.
      </p>
    </div>
  );
}
