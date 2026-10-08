import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import issues from '@/lib/roadmap-issues.json';

/** Where the items of a list stand, which sets the mark drawn beside each. */
type State = 'now' | 'next' | 'blocked' | 'later' | 'done';

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
            <li key={part.title} className="border-r border-b">
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
    <a href={`https://github.com/thaw-app/Thaw/issues/${n}`} className="roadmap-issue">
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
    <section className={`roadmap roadmap-${state} not-prose my-12`}>
      <h2
        id={slug(title)}
        className="flex scroll-mt-24 items-baseline gap-3 font-display text-2xl font-semibold tracking-tight"
      >
        {title}
        <span className="font-sans text-sm font-normal tracking-normal text-fd-muted-foreground tabular-nums">
          {count}
        </span>
      </h2>
      {note && <p className="mt-1.5 max-w-2xl text-fd-muted-foreground text-pretty">{note}</p>}
      <div className="mt-4 border-t">
        {state === 'done'
          ? // Each release folds; the newest starts open.
            Children.toArray(children)
              .filter((child) => isValidElement<{ name: string }>(child) && child.props.name)
              .map((child, index) =>
                cloneElement(child as ReactElement<{ folded?: boolean; open?: boolean }>, {
                  folded: true,
                  open: index === 0,
                }),
              )
          : children}
      </div>
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
        </summary>
        <div className="roadmap-folded pb-5 pl-6">{children}</div>
      </details>
    );
  }
  return (
    <div className="grid gap-x-8 gap-y-2 border-b py-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
      <h3 className="font-medium">
        {name}{' '}
        <span className="ml-1 text-sm font-normal text-fd-muted-foreground tabular-nums">
          {count}
        </span>
      </h3>
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
