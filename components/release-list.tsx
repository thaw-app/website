import { createRelativeLink } from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { getMDXComponents } from '@/components/mdx';
import { channelKey, tagSaysChannel } from '@/lib/channels';
import { macosVersions } from '@/lib/macos';
import { compact, longDate, type ProductSlug } from '@/lib/shared';
import { source } from '@/lib/source';
import { EarlierReleases } from './earlier-releases';
import { IntentLink } from './intent-link';
import { MorphArrow } from './morph-arrow';
import { ReleaseFilter } from './release-filter';
import { ReleasePeople } from './release-people';
import { ReleaseRow } from './release-row';

type Page = ReturnType<typeof source.getPages>[number];
type ReleasePage = Page & { data: { release: NonNullable<Page['data']['release']> } };

/**
 * How many of the newest releases have their notes written out in full on the changelog.
 * More than one pushes the list of releases screens down the page.
 */
const writtenOut = 1;

/** Whether a product's changelog has older releases folded to a line each under the newest. */
export function hasEarlierReleases(product: string) {
  return releasesOf(product).length > writtenOut;
}

/**
 * What a release's one-line summary is: its particulars ("macOS 26 only · Build 63"), or
 * the name it goes by ("The Global Thaw"). Never both.
 */
function summaryOf(release: ReleasePage['data']['release']) {
  const particulars = release.summary?.includes(' · ') ? release.summary.split(' · ') : undefined;
  return { particulars, name: particulars ? undefined : (release.summary ?? release.name) };
}

/** A date as a phone has room for it: "Nov 4, 2026". */
function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * At the foot of a release's page, the releases on either side of it in time within its
 * major version: the one before, and the one after. A page with neither shows none.
 */
export function ReleaseSteps({ product, url }: { product: string; url: string }) {
  const all = byDate(releasesOf(product));
  const here = all.find((page) => page.url === url);
  if (!here) return null;
  // Thaw 2 and 3 ship side by side, so steps stay within a major version. Preview builds
  // have none and step through every release.
  const line = majorOf(here.data.release.tag);
  const pages = line ? all.filter((page) => majorOf(page.data.release.tag) === line) : all;
  const at = pages.indexOf(here);
  const steps = [
    { label: 'Earlier', page: pages[at + 1] },
    { label: 'Later', page: pages[at - 1] },
  ];
  if (!steps.some((step) => step.page)) return null;
  return (
    <nav aria-label="Releases before and after this one" className="not-prose">
      {/* A ruled pair with the site's crossings, the earlier left and the later right. */}
      <ul className="crossed grid-cols-2">
        {steps.map(({ label, page }) => (
          <li key={label} className={label === 'Later' ? 'text-end' : undefined}>
            {page ? (
              <Link
                href={page.url}
                className="group flex flex-col gap-1 p-4 transition-colors hover:bg-fd-accent sm:p-5"
              >
                <span
                  className={`flex items-center gap-1.5 text-sm text-fd-muted-foreground ${label === 'Later' ? 'justify-end' : ''}`}
                >
                  {label === 'Earlier' ? (
                    <>
                      <MorphArrow back /> Earlier
                    </>
                  ) : (
                    <>
                      Later <MorphArrow />
                    </>
                  )}
                </span>
                <span className="font-mono text-sm text-fd-foreground group-hover:underline group-hover:underline-offset-4">
                  {page.data.release.tag}
                </span>
              </Link>
            ) : (
              <span className="block p-4 text-sm text-fd-muted-foreground sm:p-5">
                {label === 'Later' ? 'The newest' : 'The first'} {line ? `${line}.x ` : ''}release
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A numbered release's major version, "3" for 3.0.0-alpha.13; none for a preview build. */
function majorOf(tag: string) {
  return tag.match(/^(\d+)\./)?.[1];
}

/** One product's release pages, in the order the sync script put them: by version. */
function releasesOf(product: string) {
  return source
    .getPages()
    .filter((page): page is ReleasePage => page.slugs[0] === product && Boolean(page.data.release))
    .sort((a, b) => a.data.release.order - b.data.release.order);
}

/** The same pages by date, newest first. One without a date goes with its version's final release. */
function byDate(pages: ReleasePage[]) {
  const finals = new Map(
    pages
      .filter((page) => page.data.release.final)
      .map((page) => [page.data.release.version, page.data.release.date]),
  );
  const when = (page: ReleasePage) =>
    page.data.release.date ?? finals.get(page.data.release.version) ?? '9999';
  return [...pages].sort(
    (a, b) => when(b).localeCompare(when(a)) || a.data.release.order - b.data.release.order,
  );
}

/** A summary's macOS part ("macOS 27 only"), which a version page says once for all. */
const macosPart = /^macOS [\d ,and]+(?: only)?$/i;

function Row({ page, sharedOs }: { page: ReleasePage; sharedOs: boolean }) {
  const release = page.data.release;
  // Its build and name ("Build 111 · First beta"), without the macOS every row has.
  const details = (release.summary ?? release.name ?? '')
    .split(' · ')
    .filter((part) => part && !(sharedOs && macosPart.test(part)))
    .join(' · ');
  return (
    <li>
      <IntentLink
        href={page.url}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-0.5 py-2.5 transition-colors hover:bg-fd-accent sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:px-3"
      >
        <span className="font-mono text-sm text-fd-foreground">{release.tag}</span>
        <span className="order-last col-span-2 text-sm text-fd-muted-foreground sm:order-none sm:col-span-1">
          {details || (tagSaysChannel(release.tag, release.channel) ? '' : release.channel)}
        </span>
        {release.date && (
          <time dateTime={release.date} className="text-sm text-fd-muted-foreground tabular-nums">
            {longDate(release.date)}
          </time>
        )}
      </IntentLink>
    </li>
  );
}

/**
 * The pre-releases of one version, as a plain list. When they all run on the same macOS, it
 * is said once above them, not on every line.
 */
export function VersionReleases({ product, version }: { product: string; version: string }) {
  const pages = releasesOf(product).filter(
    (page) => page.data.release.version === version && !page.data.release.final,
  );
  if (!pages.length) return null;
  const systems = new Set(pages.map((page) => page.data.release.os));
  const [os] = systems;
  const sharedOs = systems.size === 1 && Boolean(os) && pages.length > 1;
  return (
    <div className="not-prose">
      {sharedOs && <p className="mb-3 text-sm text-fd-muted-foreground">Each runs on {os}.</p>}
      <ul className="flex flex-col divide-y border-y">
        {pages.map((page) => (
          <Row key={page.url} page={page} sharedOs={sharedOs} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The changelog in three numbers, as a line over the releases: how many releases, and how
 * much they list as new and as fixed. A line and not a row of cells, so the first release
 * is not pushed off the screen by figures about releases. A product with only a handful of
 * releases has nothing here worth counting, and is shown none.
 */
function ReleaseNumbers({ pages, since }: { pages: ReleasePage[]; since?: string }) {
  if (pages.length < 10) return null;
  // A version's final release repeats what its pre-releases already listed, so where
  // there were pre-releases the final one is left out of the two sums.
  const hadPreReleases = new Set(
    pages.filter((page) => !page.data.release.final).map((page) => page.data.release.version),
  );
  const counted = pages.filter(
    (page) => !(page.data.release.final && hadPreReleases.has(page.data.release.version)),
  );
  const sum = (key: 'added' | 'fixed') =>
    counted.reduce((total, page) => total + (page.data.release[key] ?? 0), 0);
  const numbers = [
    { value: pages.length, label: 'releases' },
    { value: sum('added'), label: 'new features' },
    { value: sum('fixed'), label: 'fixes' },
  ].filter((number) => number.value > 0);

  return (
    <p className="not-prose mb-5 flex flex-wrap items-baseline gap-x-8 gap-y-1 text-fd-muted-foreground">
      {numbers.map((number) => (
        <span key={number.label}>
          <span className="font-display text-2xl font-semibold tracking-tight text-fd-foreground">
            {compact.format(number.value)}
          </span>{' '}
          {number.label}
        </span>
      ))}
      <span className="text-sm">
        {since && `Since ${longDate(since)}, `}
        {since ? 'counted' : 'Counted'} from each release’s notes.
      </span>
    </p>
  );
}

/**
 * A product's changelog as a timeline, newest first: each release's number,
 * date, macOS, build and channel on the left, and what changed on the right. The newest few
 * have their notes written out; older ones are a line each, linked to their own page.
 */
export function ReleaseList({ product }: { product: ProductSlug }) {
  const pages = byDate(releasesOf(product));
  const systems = [...new Set(pages.flatMap((page) => macosVersions(page.data.release.os)))].sort(
    (a, b) => b - a,
  );
  const dated = pages.flatMap((page) => page.data.release.date ?? []).sort();

  return (
    <>
      <ReleaseNumbers pages={pages} since={dated[0]} />
      <ReleaseFilter
        systems={systems}
        entries={pages.map(({ data: { release } }) => ({
          os: release.os,
          channel: release.channel,
        }))}
      >
        {pages.slice(0, writtenOut).map((page) => {
          const release = page.data.release;
          const Notes = page.data.body;
          // Only a name heads the notes: particulars ("macOS 26 only · Build 63") are on the
          // release's own page, with what it was built from.
          const { name: title } = summaryOf(release);
          return (
            <article
              key={page.url}
              data-os={macosVersions(release.os).join(' ') || undefined}
              data-channel={channelKey(release.channel)}
              className="release-entry grid gap-y-4 border-t py-10 lg:grid-cols-[13.5rem_minmax(0,1fr)]"
            >
              {/* Its number and date, and who it credits: no more, so the column reads as a
                  timeline. On a phone they are one wrapped line, so the notes are not pushed a
                  screen down; beside the notes they stand in a column. */}
              <div className="not-prose flex flex-row flex-wrap items-center gap-x-3 gap-y-1 self-start lg:sticky lg:top-24 lg:flex-col lg:items-start lg:gap-2 lg:pe-10">
                <div className="basis-full lg:basis-auto">
                  <Link
                    href={page.url}
                    className="tap bg-(--release-2)/12 px-2.5 py-1 font-mono text-sm text-(--release-2) transition-colors hover:bg-(--release-2)/20"
                  >
                    {release.tag}
                  </Link>
                </div>
                {release.date && (
                  <time dateTime={release.date} className="text-sm text-fd-muted-foreground">
                    {longDate(release.date)}
                  </time>
                )}
                {/* Who the notes credit: a release is its people as much as its number. */}
                {release.people && (
                  <ReleasePeople
                    people={release.people}
                    max={14}
                    className="mt-1 basis-full lg:mt-2 lg:max-w-44"
                  />
                )}
              </div>

              <div className="prose release-notes max-w-none min-w-0">
                {title && (
                  <p className="not-prose mb-6 font-display text-2xl font-semibold tracking-tight text-balance text-fd-foreground">
                    {title}
                  </p>
                )}
                <Notes components={getMDXComponents({ a: createRelativeLink(source, page) })} />
              </div>
            </article>
          );
        })}
        {pages.length > writtenOut && (
          <EarlierReleases
            rows={pages.slice(writtenOut).map((page, index) => {
              const release = page.data.release;
              return {
                tag: release.tag,
                href: page.url,
                order: index,
                channel: release.channel,
                channelKey: channelKey(release.channel),
                os: release.os,
                systems: macosVersions(release.os).join(' ') || undefined,
                date: release.date,
                dateShort: release.date && shortDate(release.date),
                added: release.added,
                fixed: release.fixed,
                stable: release.channel === 'Stable',
              };
            })}
            list={
              // One line each, and seventy of them fit on a page: a line opens its notes under
              // it. The label's rule is the list's top edge, so the list draws only its bottom.
              <ul className="divide-y border-b">
                {pages.slice(writtenOut).map((page) => {
                  const release = page.data.release;
                  const { name } = summaryOf(release);
                  // A summary that is only its macOS ("macOS 26 only") is not a name.
                  const named = name && !macosPart.test(name) ? name : undefined;
                  // The channel in words, for readers who don't parse "-rc.2". The macOS is
                  // left to the filter above. Skipped when the name already says it.
                  const rest = [release.channel].filter(
                    (detail) => !named?.toLowerCase().includes(detail.toLowerCase()),
                  );
                  return (
                    <ReleaseRow
                      key={page.url}
                      tag={release.tag}
                      href={page.url}
                      details={[named, ...rest].filter(Boolean).join(' · ')}
                      date={release.date}
                      dateLabel={release.date && longDate(release.date)}
                      dateShort={release.date && shortDate(release.date)}
                      os={release.os}
                      stable={release.channel === 'Stable'}
                      channel={channelKey(release.channel)}
                    />
                  );
                })}
              </ul>
            }
          />
        )}
      </ReleaseFilter>
    </>
  );
}
