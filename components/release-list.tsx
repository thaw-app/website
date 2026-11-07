import { createRelativeLink } from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { getMDXComponents } from '@/components/mdx';
import { commitOf } from '@/lib/releases';
import { compact, longDate, type ProductSlug } from '@/lib/shared';
import { source } from '@/lib/source';
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
 * At the foot of a release's page, the releases on either side of it in time, as the
 * changelog lists them: the one before, and the one after. A page with neither shows none.
 */
export function ReleaseSteps({ product, url }: { product: string; url: string }) {
  const pages = byDate(releasesOf(product));
  const at = pages.findIndex((page) => page.url === url);
  if (at < 0) return null;
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
                <span className="text-sm text-fd-muted-foreground">
                  {label === 'Earlier' ? '← Earlier' : 'Later →'}
                </span>
                <span className="font-mono text-sm text-fd-foreground group-hover:underline group-hover:underline-offset-4">
                  {page.data.release.tag}
                </span>
              </Link>
            ) : (
              <span className="block p-4 text-sm text-fd-muted-foreground sm:p-5">
                {label === 'Later' ? 'The newest release' : 'The first release'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
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

function Row({ page }: { page: ReleasePage }) {
  const release = page.data.release;
  return (
    <li>
      <Link
        href={page.url}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-0.5 py-2.5 transition-colors hover:bg-fd-accent sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:px-3"
      >
        <span className="font-mono text-sm text-fd-foreground">{release.tag}</span>
        <span className="order-last col-span-2 text-sm text-fd-muted-foreground sm:order-none sm:col-span-1">
          {release.summary ?? release.name ?? release.channel}
        </span>
        {release.date && (
          <time dateTime={release.date} className="text-sm text-fd-muted-foreground tabular-nums">
            {longDate(release.date)}
          </time>
        )}
      </Link>
    </li>
  );
}

/** The pre-releases of one version, as a plain list. */
export function VersionReleases({ product, version }: { product: string; version: string }) {
  const pages = releasesOf(product).filter(
    (page) => page.data.release.version === version && !page.data.release.final,
  );
  if (!pages.length) return null;
  return (
    <ul className="not-prose flex flex-col divide-y border-y">
      {pages.map((page) => (
        <Row key={page.url} page={page} />
      ))}
    </ul>
  );
}

/**
 * Releases per day since the first one, a column per week, as GitHub draws a person's
 * contributions: the width of the page, with the months over it and the days beside it. A
 * product with only a few weeks of releases keeps its squares small, and leaves the rest of
 * the width empty.
 * The stronger the square, the more releases went out that day.
 */
function ReleaseCalendar({ pages }: { pages: ReleasePage[] }) {
  const perDay = new Map<string, string[]>();
  for (const page of pages) {
    const { date, tag } = page.data.release;
    if (date) perDay.set(date, [...(perDay.get(date) ?? []), tag]);
  }
  const days = [...perDay.keys()].sort();
  if (days.length < 2) return null;

  const day = 86_400_000;
  const first = new Date(`${days[0]}T00:00:00Z`);
  // Back to the Monday of the first week, on to the Sunday of the last.
  const start = first.getTime() - ((first.getUTCDay() + 6) % 7) * day;
  const last = new Date(`${days[days.length - 1]}T00:00:00Z`);
  const end = last.getTime() + ((7 - last.getUTCDay()) % 7) * day;
  const weeks = Math.round((end - start) / day + 1) / 7;

  const cells = Array.from({ length: weeks * 7 }, (_, index) => {
    // Filled column by column: index 0 to 6 is the first week, Monday to Sunday.
    const date = new Date(start + index * day).toISOString().slice(0, 10);
    return { date, tags: perDay.get(date) ?? [] };
  });
  // The cube's oranges (global.css). The faintest is still 3:1 against the page, so a single
  // release shows.
  const shade = ['', 'bg-(--release-1)', 'bg-(--release-2)', 'bg-(--release-3)'];
  // Small squares, as GitHub's are: the calendar is a picture of the pace, and the releases
  // under it are what the page is for.
  const widest = '0.875rem';
  // The gap between squares, which their room has to count too: without it the squares are
  // squeezed to a fraction of a pixel each, and their edges and gaps come out uneven.
  const gap = '2px';
  const columns = {
    gridTemplateColumns: `repeat(${weeks}, minmax(0, ${widest}))`,
    columnGap: gap,
  };
  // Wide enough for the key under it, however few the weeks.
  const frame = {
    gridTemplateColumns: `auto minmax(0, max(16rem, calc(${weeks} * ${widest} + ${weeks - 1} * ${gap})))`,
  };
  // A month is named over the week its first day falls in.
  const months = cells.flatMap(({ date }, index) =>
    date.endsWith('-01') || index === 0
      ? [
          {
            week: Math.floor(index / 7) + 1,
            name: new Date(`${date}T00:00:00Z`).toLocaleString('en', {
              month: 'short',
              timeZone: 'UTC',
            }),
          },
        ]
      : [],
  );
  // The first week can open late in a month, and its name would then sit on the next one's.
  if (months[1] && months[1].week - months[0].week < 2) months.shift();
  const square = 'relative aspect-square bg-fd-foreground/[0.07]';

  return (
    <div
      className="not-prose mb-8 grid justify-start gap-x-2 gap-y-1.5 text-xs text-fd-muted-foreground"
      style={frame}
    >
      <div aria-hidden className="col-start-2 grid" style={columns}>
        {months.map((month) => (
          <span key={month.week} style={{ gridColumnStart: month.week }}>
            {month.name}
          </span>
        ))}
      </div>
      {/* Every other day is named, as GitHub names them: the rows are Monday to Sunday. */}
      <div aria-hidden className="hidden grid-rows-7 gap-[2px] sm:grid">
        {['Mon', '', 'Wed', '', 'Fri', '', ''].map((name, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: seven fixed rows, three of them named
          <span key={index} className="flex items-center leading-none">
            {name}
          </span>
        ))}
      </div>
      <div
        role="img"
        aria-label={`${pages.length} releases between ${longDate(days[0])} and ${longDate(days[days.length - 1])}`}
        className="col-start-2 grid grid-flow-col grid-rows-7 gap-[2px]"
        style={columns}
      >
        {cells.map(({ date, tags }) => (
          <span
            key={date}
            title={tags.length ? `${date}: ${tags.join(', ')}` : undefined}
            className={square}
          >
            {tags.length > 0 && (
              <span className={`absolute inset-0 ${shade[Math.min(3, tags.length)]}`} />
            )}
          </span>
        ))}
      </div>
      {/* Under a long calendar the key ends with it, as GitHub's does; under a few weeks it
          starts with it, rather than standing off past its end. */}
      <p
        aria-hidden
        className={`col-start-2 mt-1 flex items-center gap-1.5 ${weeks < 18 ? 'justify-start' : 'justify-end'}`}
      >
        Fewer
        {shade.map((opacity) => (
          <span key={opacity} className={`${square} size-3`}>
            {opacity && <span className={`absolute inset-0 ${opacity}`} />}
          </span>
        ))}
        More releases in a day
      </p>
    </div>
  );
}

/**
 * The changelog in three numbers, as a line over the calendar: how many releases, and how
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
  const systems = [...new Set(pages.flatMap((page) => page.data.release.os ?? []))];
  const dated = pages.flatMap((page) => page.data.release.date ?? []).sort();

  return (
    <>
      <ReleaseNumbers pages={pages} since={dated[0]} />
      <ReleaseCalendar pages={pages} />
      <ReleaseFilter
        systems={systems}
        entries={pages.map(({ data: { release } }) => ({
          os: release.os,
          stable: release.channel === 'Stable',
        }))}
      >
        {pages.slice(0, writtenOut).map((page) => {
          const release = page.data.release;
          const Notes = page.data.body;
          // Its particulars go with the rest of them at the left; a name heads the notes.
          const { particulars, name: title } = summaryOf(release);
          const said = (word: string) =>
            particulars?.some((part) => part.toLowerCase().includes(word.toLowerCase()));
          const details = particulars
            ? [...particulars, ...(said(release.channel) ? [] : [release.channel])]
            : [release.os, release.channel].flatMap((detail) => detail ?? []);
          const commit = release.commit && commitOf(product, release.commit);
          return (
            <article
              key={page.url}
              data-os={release.os}
              data-stable={release.channel === 'Stable' ? '' : undefined}
              className="release-entry grid gap-y-4 border-t py-10 lg:grid-cols-[13.5rem_minmax(0,1fr)]"
            >
              {/* On a phone its particulars are one wrapped line under its number, so the notes
                  are not pushed a screen down; beside the notes they stand in a column. */}
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
                {details.map((detail) => (
                  <span key={detail} className="text-sm text-fd-muted-foreground">
                    {detail}
                  </span>
                ))}
                {commit && (
                  <a
                    href={commit.url}
                    title={`The commit ${release.tag} was built from`}
                    className="tap link font-mono text-sm text-fd-muted-foreground"
                  >
                    {commit.short}
                  </a>
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
          <section className="pt-10">
            {/* Named as every section of the site is: a small label with its rule. */}
            <h2 className="section-label mb-3">Earlier releases</h2>
            {/* One line each, and seventy of them fit on a page: a line opens its notes under it. */}
            {/* The label's rule is the list's top edge, so the list draws only its bottom. */}
            <ul className="divide-y border-b">
              {pages.slice(writtenOut).map((page) => {
                const release = page.data.release;
                const { name: named } = summaryOf(release);
                // What its name already says ("macOS 27 Preview 5") is not said again after it.
                const rest = [release.os, release.channel].filter(
                  (detail) => detail && !named?.toLowerCase().includes(detail.toLowerCase()),
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
                  />
                );
              })}
            </ul>
          </section>
        )}
      </ReleaseFilter>
    </>
  );
}
