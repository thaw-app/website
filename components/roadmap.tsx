import { Heading } from 'fumadocs-ui/components/heading';
import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
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
 * The whole roadmap. Above its lists it draws one row that names each of them
 * with its mark and its count, and jumps to it: the shape of the plan at a
 * glance, and the key to what the marks mean.
 */
export function Roadmap({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children).flatMap((child) =>
    isValidElement<ListProps>(child) && child.props.title ? [child.props] : [],
  );
  return (
    <>
      <nav aria-label="Parts of the roadmap" className="not-prose my-8">
        <ul className="grid grid-cols-2 border-t border-l sm:grid-cols-3 lg:grid-cols-5">
          {parts.map((part) => (
            // Five in two columns leave the last alone on its row, so on a phone it takes the row.
            <li key={part.title} className="border-r border-b max-sm:last:odd:col-span-2">
              <a
                href={`#${slug(part.title)}`}
                className="flex h-full flex-col gap-1 p-4 transition-colors hover:bg-fd-accent"
              >
                <span className="font-display text-3xl leading-none font-semibold tracking-tight tabular-nums">
                  {part.count}
                </span>
                <span className="flex items-center gap-2 text-sm text-fd-muted-foreground">
                  <span
                    aria-hidden
                    className={`roadmap-mark roadmap-mark-${part.state ?? (part.done ? 'done' : 'next')}`}
                  />
                  {part.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {children}
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

/** One part of the roadmap: what is in progress, what is next, what has shipped. */
export function RoadmapList({
  title,
  count,
  done,
  state = done ? 'done' : 'next',
  note,
  children,
}: {
  title: string;
  count: number;
  done?: boolean;
  state?: State;
  /** A line under the title saying how firm this part of the plan is. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className={`roadmap roadmap-${state} not-prose my-14`}>
      <Heading as="h2" id={slug(title)} className="section-label scroll-mt-24">
        {title} <span className="font-normal tabular-nums">{count}</span>
      </Heading>
      {note && <p className="mt-6 max-w-2xl text-fd-muted-foreground text-pretty">{note}</p>}
      {state === 'done' ? (
        <div className={`border-t ${note ? 'mt-4' : 'mt-6'}`}>
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
      ) : (
        // What is planned is a sheet of cards, one to an item, after Obsidian's roadmap and
        // Zed's: its name, a sentence, and the area it belongs to.
        <div
          className={`roadmap-cards grid border-t border-l sm:grid-cols-2 lg:grid-cols-3 ${note ? 'mt-5' : 'mt-6'}`}
        >
          {children}
        </div>
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
        <a href={`${repo}/issues/new/choose`}>Ask for something that is missing</a>.
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
