import { Heading } from 'fumadocs-ui/components/heading';
import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { HoverLines } from '@/components/hover-lines';
import issues from '@/lib/roadmap-issues.json';
import requests from '@/lib/roadmap-requests.json';
import { longDate, repoUrl, slug } from '@/lib/shared';
import { source } from '@/lib/source';

/** Where the items of a list stand, which sets the mark drawn beside each. */
type State = 'now' | 'next' | 'blocked' | 'later' | 'done';

interface ListProps {
  title: string;
  count: number;
  done?: boolean;
  state?: State;
}

/**
 * The whole roadmap, as a road down the page: a line with a stop on it for each list, in
 * the order things happen. What has shipped is behind, so it is the first stop, shut;
 * then what is being worked on, and after it what is planned, nearer first. Above the
 * road one line names each stop with its mark and its count, and jumps to it.
 *
 * The lists are written in the order a reader wants them (what is next before what is
 * done), so the done ones are moved to the front here. What is not a list (the requests
 * people have made) is not a stop on the road, and follows it.
 */
export function Roadmap({ children }: { children: ReactNode }) {
  const all = Children.toArray(children);
  const isList = (child: unknown): child is ReactElement<ListProps> =>
    isValidElement<ListProps>(child) && Boolean(child.props.title);
  const stateOf = (list: ListProps) => list.state ?? (list.done ? 'done' : 'next');
  const lists = all.filter(isList);
  const stops = [
    ...lists.filter((list) => stateOf(list.props) === 'done'),
    ...lists.filter((list) => stateOf(list.props) !== 'done'),
  ];
  return (
    <>
      <nav aria-label="Stops on the roadmap" className="not-prose my-8">
        <ul className="flex flex-wrap gap-x-7 gap-y-1 text-sm">
          {stops.map(({ props: part }) => (
            <li key={part.title}>
              <a
                href={`#${slug(part.title)}`}
                className="group tap flex items-center gap-2 py-1 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <span aria-hidden className={`roadmap-mark roadmap-mark-${stateOf(part)}`} />
                <span className="underline-offset-4 group-hover:underline">{part.title}</span>
                <span className="font-medium text-fd-foreground tabular-nums">{part.count}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="road not-prose">{stops}</div>
      {all.filter((child) => !isList(child))}
    </>
  );
}

const known = issues as Record<string, { state: string; reason?: string | null }>;

/**
 * A link to one of the project's issues, with whether it is open or closed as
 * GitHub had it when the site was built.
 */
export function Issue({ n }: { n: number }) {
  const issue = known[String(n)];
  const status = !issue
    ? null
    : issue.state === 'open'
      ? 'Open'
      : issue.reason === 'not_planned'
        ? 'Closed, not planned'
        : 'Closed';
  return (
    <a href={`${repoUrl('thaw')}/issues/${n}`} className="roadmap-issue">
      #{n}
      {status && <span className="roadmap-issue-status">{status}</span>}
    </a>
  );
}

/**
 * One stop on the road: what has shipped, what is in progress, what is next. Its mark sits
 * on the road's line and says which it is, so the items under it carry no marks of their
 * own.
 */
export function RoadmapList({
  title,
  count,
  done,
  state = done ? 'done' : 'next',
  here,
  note,
  children,
}: {
  title: string;
  count: number;
  done?: boolean;
  state?: State;
  /** The stop the project is at today, which is told to the reader in so many words. */
  here?: boolean;
  /** A line under the title saying how firm this part of the plan is. */
  note?: string;
  children: ReactNode;
}) {
  const counted = <span className="road-count tabular-nums">{count}</span>;
  return (
    <section className={`road-stop roadmap roadmap-${state}`}>
      <span aria-hidden className={`road-node roadmap-mark roadmap-mark-${state}`} />
      {state === 'done' ? (
        // What has shipped is the road already travelled: one line, which opens on its
        // releases, so the plan is not pushed down the page by eighty things that are done.
        <details className="group/stop">
          <summary className="tap flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
            <h2 id={slug(title)} className="road-title scroll-mt-24">
              {title} {counted}
            </h2>
            <span
              aria-hidden
              className="text-fd-muted-foreground transition-transform group-open/stop:rotate-90"
            >
              ›
            </span>
            {note && <span className="text-fd-muted-foreground text-pretty">{note}</span>}
          </summary>
          <div className="mt-5 border-t">
            {
              // Each release folds; the newest starts open.
              Children.toArray(children)
                .filter((child) => isValidElement<{ name: string }>(child) && child.props.name)
                .map((child, index) =>
                  cloneElement(child as ReactElement<{ folded?: boolean; open?: boolean }>, {
                    folded: true,
                    open: index === 0,
                  }),
                )
            }
          </div>
        </details>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Heading as="h2" id={slug(title)} className="road-title scroll-mt-24">
              {title} {counted}
            </Heading>
            {here && (
              <span className="text-sm font-medium text-(--product-tone)">You are here</span>
            )}
          </div>
          {note && <p className="mt-1.5 max-w-2xl text-fd-muted-foreground text-pretty">{note}</p>}
          {/* What is being finished now is ruled into cards, the one boxed thing on the
              page, so it is what the eye lands on. Everything planned after it is set open
              in columns by name, and a name opens on its sentence (hover-lines.tsx). */}
          {state === 'now' ? (
            // An odd number in two columns would leave a hole at the end: the last takes the row.
            <div
              className={`roadmap-cards mt-5 grid border-t border-l sm:grid-cols-2 ${count % 2 ? 'roadmap-odd' : ''}`}
            >
              {children}
            </div>
          ) : (
            <HoverLines className="roadmap-cards roadmap-open mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {children}
            </HoverLines>
          )}
        </>
      )}
    </section>
  );
}

/** The items of one area, or of one release, with how many there are. */
export function RoadmapGroup({
  name,
  count,
  folded,
  open,
  children,
}: {
  name: string;
  count: number;
  /** Set by the list it is in: shut away under its name until asked for. */
  folded?: boolean;
  open?: boolean;
  children: ReactNode;
}) {
  // What has shipped is long and already in the changelog: a release is one line that
  // opens, so the plan above it is not buried under eighty things that are done.
  if (folded) {
    return (
      <details open={open} className="group border-b">
        <summary className="tap flex cursor-pointer list-none items-baseline gap-3 py-3 hover:bg-fd-accent [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="w-3 text-fd-muted-foreground group-open:rotate-90">
            ›
          </span>
          <h3 className="font-medium">{name}</h3>
          <span className="text-sm text-fd-muted-foreground tabular-nums">{count}</span>
          {released(name) && (
            <span className="ml-auto text-sm text-fd-muted-foreground">{released(name)}</span>
          )}
        </summary>
        <div className="roadmap-folded pb-5 pl-6">{children}</div>
      </details>
    );
  }
  // In a sheet of cards the area is not a heading over its items: each card carries it,
  // written by the stylesheet from this name, and the cards of every area share one grid.
  return (
    <div className="contents" style={{ '--area': JSON.stringify(name) } as CSSProperties}>
      <h3 className="sr-only">{name}</h3>
      {children}
    </div>
  );
}

/** The day a release came out, where a group of shipped items is named for one. */
function released(name: string) {
  const date = source.getPages().find((page) => page.data.release?.tag === name)?.data
    .release?.date;
  return date ? longDate(date) : null;
}

interface Request {
  number: number;
  title: string;
  votes: number;
}

/**
 * What people have asked for and is still open, most wanted first: where a reader sees
 * that the order can be argued with, and how.
 */
export function RoadmapRequests() {
  const list = requests as Request[];
  const repo = repoUrl('thaw');
  return (
    <section className="roadmap not-prose my-14">
      <Heading as="h2" id="asked-for" className="section-label scroll-mt-24">
        Asked for{' '}
        {list.length > 0 && <span className="font-normal tabular-nums">{list.length}</span>}
      </Heading>
      <p className="mt-6 max-w-2xl text-fd-muted-foreground text-pretty">
        The feature requests open on GitHub. A thumbs-up on one tells the team it matters to you,
        and the ones with the most are looked at first.{' '}
        <a href={`${repo}/issues/new/choose`}>Ask for something that is missing</a>, or see the{' '}
        <a href={`${repo}/issues/316`}>ways to contribute</a>.
      </p>
      {list.length > 0 && (
        <ol className="mt-5 border-t">
          {list.map((request) => (
            <li key={request.number} className="roadmap-request border-b">
              <a
                href={`${repo}/issues/${request.number}`}
                className="tap flex items-baseline gap-3 py-3 hover:bg-fd-accent"
              >
                <span className="w-14 flex-none text-sm text-fd-muted-foreground tabular-nums">
                  #{request.number}
                </span>
                <span className="min-w-0 flex-1 text-fd-foreground">{request.title}</span>
                {known[String(request.number)] && (
                  <span className="roadmap-issue-status flex-none">On the roadmap</span>
                )}
                {request.votes > 0 && (
                  <span className="flex-none text-sm text-fd-muted-foreground tabular-nums">
                    {request.votes} {request.votes === 1 ? 'vote' : 'votes'}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
