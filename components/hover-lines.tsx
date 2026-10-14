'use client';

import {
  Children,
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useRef,
} from 'react';

interface Lines {
  name: string;
  show: (event: PointerEvent<HTMLDetailsElement>) => void;
  keep: (event: MouseEvent<HTMLElement>) => void;
}

const LinesContext = createContext<Lines | null>(null);

/**
 * A list read a line at a time: every line is shut to begin with, and the pointer does the
 * asking. Resting on a line opens what is
 * under it and dims the rest; moving off the list shuts it again. A click keeps a line open
 * after the pointer has gone, and a tap, or the Enter key, opens and shuts one as it does
 * any such list. One line is open at a time.
 *
 * The questions (faq-list.tsx), the names under a product's features (feature-list.tsx),
 * what an install asks for (install-facts.tsx) and the roadmap's later stops (roadmap.tsx)
 * are all this.
 */
export function HoverLines({
  className = '',
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'onPointerLeave'>) {
  // One name for every line, which is how a browser knows to shut the others.
  const name = useId();
  // The line the pointer opened, which is the one that shuts when the pointer goes.
  const hovered = useRef<HTMLDetailsElement | null>(null);
  // Where the pointer last was. A line that slides under a pointer at rest, as the one
  // above it shuts, has not been pointed at and stays shut.
  const at = useRef('');

  const lines = useMemo<Lines>(
    () => ({
      name,
      show(event) {
        if (event.pointerType !== 'mouse') return;
        const here = `${event.clientX},${event.clientY}`;
        if (here === at.current) return;
        at.current = here;
        const line = event.currentTarget;
        if (line.open) return;
        line.open = true;
        hovered.current = line;
      },
      // The pointer has already opened the line by the time it is clicked, so the click
      // keeps it open instead of shutting it.
      keep(event) {
        if (event.currentTarget.parentElement !== hovered.current) return;
        event.preventDefault();
        hovered.current = null;
      },
    }),
    [name],
  );
  const leave = () => {
    if (hovered.current) hovered.current.open = false;
    hovered.current = null;
  };

  return (
    <LinesContext value={lines}>
      <div {...props} className={`lines ${className}`} onPointerLeave={leave}>
        {children}
      </div>
    </LinesContext>
  );
}

/**
 * One line of such a list: what it is called, and what opens under it. Whatever in the
 * name carries the class `line-name` is what dims while another line is open, and
 * whatever under it carries `line-more` comes in by its opacity.
 */
export function HoverLine({
  summary,
  marked,
  className = '',
  summaryClassName = '',
  children,
}: {
  summary: ReactNode;
  /** The name draws its own sign that it opens. Without it, a touch screen is given one. */
  marked?: boolean;
  className?: string;
  summaryClassName?: string;
  children: ReactNode;
}) {
  const lines = useContext(LinesContext);
  return (
    <details
      name={lines?.name}
      onPointerMove={lines?.show}
      className={`line group ${marked ? 'line-marked' : ''} ${className}`}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a summary is a control by its nature: it is what opens and shuts its details */}
      <summary
        onClick={lines?.keep}
        className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${summaryClassName}`}
      >
        {summary}
      </summary>
      {children}
    </details>
  );
}

/**
 * A list item written as "**Its name.** What it means.", which inside such a list becomes a
 * line of it: the name shows, and the sentence opens under it. Anywhere else it is the
 * list item it was written as.
 */
export function HoverItem({ children, ...props }: ComponentProps<'li'>) {
  const lines = useContext(LinesContext);
  const [name, ...more] = Children.toArray(children);
  if (!lines || !isValidElement<{ children?: ReactNode }>(name))
    return <li {...props}>{children}</li>;
  // The full stop closed the name off from its sentence. On a line of its own it has
  // nothing to close off.
  const said = name.props.children;
  const title =
    typeof said === 'string'
      ? cloneElement(name as ReactElement<{ children?: ReactNode }>, {
          children: said.replace(/\.$/, ''),
        })
      : name;
  // A name with no sentence after it has nothing to open on.
  if (more.length === 0) return <li {...props}>{title}</li>;
  return (
    <li {...props}>
      <HoverLine summary={<span className="line-name">{title}</span>}>
        <div className="line-more pt-1">{more}</div>
      </HoverLine>
    </li>
  );
}
