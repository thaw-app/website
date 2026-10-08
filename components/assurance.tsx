import Link from 'next/link';
import community from '@/lib/community.json';
import { compact, docsRoute, longDate, products } from '@/lib/shared';

const plain = new Intl.NumberFormat('en');
const repo = products.thaw.repo;
const { assurance } = community;

// What outside bodies have verified about how Thaw is built and released. Each is read
// from its source when the site is built, apart from the SLSA level, which the release
// pipeline documents; one that could not be read is left out.
// The colours the bodies' own badges use: gold for the Gold badge, green for a pass.
const gold = 'var(--verified-gold)';
const green = 'var(--verified-green)';

export interface Verified {
  value: string;
  label: string;
  detail: string;
  href: string;
  /** A level out of so many, drawn as that many steps. */
  steps?: number;
  reached?: number;
  /** A score as a share of its full mark, drawn as one bar. */
  share?: number;
  tone: string;
}

const candidates: (Verified | false | undefined | null | 0 | '')[] = [
  {
    value: 'Level 3',
    label: 'SLSA build',
    detail: 'Every release comes with a signed record you can check.',
    steps: 3,
    reached: 3,
    tone: green,
    href: `${docsRoute}/thaw/verifying-releases`,
  },
  assurance.bestPractices && {
    value: assurance.bestPractices.charAt(0).toUpperCase() + assurance.bestPractices.slice(1),
    label: 'OpenSSF Best Practices',
    detail: 'The highest of its three badges.',
    steps: 3,
    reached: ['passing', 'silver', 'gold'].indexOf(assurance.bestPractices) + 1,
    tone: assurance.bestPractices === 'gold' ? gold : green,
    href: 'https://www.bestpractices.dev/projects/13303',
  },
  assurance.baseline && {
    value: `Level ${assurance.baseline}`,
    label: 'OpenSSF Baseline',
    detail: 'Thaw meets every control at the top level.',
    steps: 3,
    reached: assurance.baseline,
    tone: green,
    href: 'https://www.bestpractices.dev/projects/13303',
  },
  typeof assurance.scorecard === 'number' && {
    value: `${assurance.scorecard} / 10`,
    label: 'OpenSSF Scorecard',
    detail: 'OpenSSF scores the repository every week.',
    share: assurance.scorecard / 10,
    tone: green,
    href: `https://scorecard.dev/viewer/?uri=github.com/${repo}`,
  },
  typeof assurance.coverage === 'number' && {
    value: `${assurance.coverage}%`,
    label: 'Test coverage',
    detail: 'SonarQube Cloud measures it on every change.',
    share: assurance.coverage / 100,
    tone: green,
    href: `https://sonarcloud.io/component_measures?id=${repo.replace('/', '_')}&metric=coverage`,
  },
];
export const verified = candidates.filter((entry): entry is Verified => Boolean(entry));

const stepped = verified.length === 5;

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
              Baseline control at Level 3. Thaw, a free menu bar app, is one of them.
            </>
          )}
        </p>
        {/* Five cells sit as two over three; any other count falls back to even columns. */}
        <ul
          className={`crossed grid border-t border-l ${stepped ? 'sm:grid-cols-6' : 'sm:grid-cols-2 xl:grid-cols-4'}`}
        >
          {verified.map((entry, index) => (
            <li
              key={entry.label}
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
                <span className="text-sm text-fd-muted-foreground text-pretty">{entry.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-fd-muted-foreground text-pretty">
          Read from OpenSSF and SonarQube Cloud on {longDate(community.checked)}. The SLSA level is
          the one Thaw’s release pipeline is built to.
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
