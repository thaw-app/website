import { createRelativeLink } from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { getMDXComponents } from '@/components/mdx';
import { longDate } from '@/lib/shared';
import { source } from '@/lib/source';
import { ReleaseFilter } from './release-filter';

type Page = ReturnType<typeof source.getPages>[number];
type ReleasePage = Page & { data: { release: NonNullable<Page['data']['release']> } };

/** How many of the newest releases have their notes written out in full on the changelog. */
const writtenOut = 8;

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
            {release.date}
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
 * Releases per day since the first one, a column per week, as GitHub draws
 * contributions. The darker the square, the more releases went out that day.
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
  // The faintest of these is still 3:1 against the page, so a single release shows.
  const shade = ['', 'opacity-70', 'opacity-85', 'opacity-100'];

  return (
    <div
      role="img"
      aria-label={`${pages.length} releases between ${longDate(days[0])} and ${longDate(days[days.length - 1])}`}
      className="not-prose mx-auto mb-10 grid w-full grid-flow-col grid-rows-7 gap-[3px]"
      // Squares of 14px on a wide page, and as small as it takes to fit a narrow one.
      style={{
        gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
        maxWidth: `${weeks * 17 - 3}px`,
      }}
    >
      {cells.map(({ date, tags }) => (
        <span
          key={date}
          title={tags.length ? `${date}: ${tags.join(', ')}` : undefined}
          className="relative aspect-square bg-fd-foreground/[0.07]"
        >
          {tags.length > 0 && (
            <span className={`absolute inset-0 bg-fd-primary ${shade[Math.min(3, tags.length)]}`} />
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * A product's changelog as a timeline, newest first: each release's number,
 * date and macOS on the left, and what changed on the right. The newest few
 * have their notes written out; older ones link to their own page.
 */
export function ReleaseList({ product }: { product: string }) {
  const pages = byDate(releasesOf(product));
  const systems = [...new Set(pages.flatMap((page) => page.data.release.os ?? []))];
  const dated = pages.flatMap((page) => page.data.release.date ?? []).sort();

  return (
    <>
      {dated.length > 1 && (
        <p className="not-prose mb-6 text-center text-lg text-fd-muted-foreground">
          <span className="text-fd-foreground">{pages.length} releases</span> since{' '}
          {longDate(dated[0])}.
        </p>
      )}
      <ReleaseCalendar pages={pages} />
      <ReleaseFilter systems={systems}>
        {pages.map((page, index) => {
          const release = page.data.release;
          const Notes = page.data.body;
          const title = release.summary ?? release.name;
          return (
            <article
              key={page.url}
              data-os={release.os}
              className="release-entry grid gap-x-10 gap-y-4 border-t py-10 lg:grid-cols-[11rem_minmax(0,1fr)]"
            >
              <div className="not-prose flex flex-col items-start gap-2 self-start lg:sticky lg:top-24">
                <Link
                  href={page.url}
                  className="tap bg-fd-foreground/[0.07] px-2.5 py-1 font-mono text-sm text-fd-foreground transition-colors hover:bg-fd-accent"
                >
                  {release.tag}
                </Link>
                {release.date && (
                  <time dateTime={release.date} className="text-sm text-fd-muted-foreground">
                    {longDate(release.date)}
                  </time>
                )}
                <span className="text-sm text-fd-muted-foreground">
                  {[release.os, release.channel].filter(Boolean).join(' · ')}
                </span>
              </div>

              <div className="release-notes min-w-0">
                {title && (
                  <p className="not-prose mb-6 font-display text-2xl font-semibold tracking-tight text-balance text-fd-foreground">
                    {title}
                  </p>
                )}
                {index < writtenOut ? (
                  <Notes components={getMDXComponents({ a: createRelativeLink(source, page) })} />
                ) : (
                  <p className="not-prose">
                    <Link href={page.url} className="link">
                      Read the notes for {release.tag}
                    </Link>
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </ReleaseFilter>
    </>
  );
}
