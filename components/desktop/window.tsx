'use client';

import {
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useRef,
  useState,
} from 'react';

interface WindowProps {
  title: string;
  /** The desktop the window lives on, which it may not be dragged out of. */
  boundsRef: RefObject<HTMLElement | null>;
  /** Where the window first appears, in pixels from the desktop's top left. */
  initial: { x: number; y: number };
  front: boolean;
  /** Kept but not drawn, as a minimized window is: it holds its place and its state. */
  hidden?: boolean;
  onFocus: () => void;
  /** Draws the window, and spreads the given props on the part it is dragged by. */
  children: (dragProps: HTMLAttributes<HTMLDivElement>) => ReactNode;
}

/** Height of the menu bar a window may not slide under, in pixels. */
const menuBarHeight = 30;

/** Places a window on the desktop and lets it be dragged around inside it. */
export function Window({
  title,
  boundsRef,
  initial,
  front,
  hidden,
  onFocus,
  children,
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(initial);
  // What a drag needs, measured once when it starts. `latest` is where the window has been
  // put so far, which is only written to the element until the drag ends.
  const drag = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    maxX: number;
    maxY: number;
    latest: { x: number; y: number };
  } | null>(null);

  function endDrag() {
    const finished = drag.current;
    drag.current = null;
    // The drag moved the element's style directly, so the offset is handed to React only now.
    // It is the very value that was written, so React and the element agree afterwards.
    if (finished && (finished.latest.x !== offset.x || finished.latest.y !== offset.y)) {
      setOffset(finished.latest);
    }
  }

  const dragProps: HTMLAttributes<HTMLDivElement> = {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      const bounds = boundsRef.current;
      const self = windowRef.current;
      if (!bounds || !self) return;

      drag.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        ...offset,
        maxX: Math.max(bounds.clientWidth - self.getBoundingClientRect().width, 0),
        // The top of the window must stay reachable, so only that much has to remain in view.
        maxY: bounds.clientHeight - 40,
        latest: offset,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const start = drag.current;
      const self = windowRef.current;
      if (!start || !self) return;

      // Written to the element alone: a state change here would redraw the whole window
      // and everything in it on every move of the pointer.
      const latest = {
        x: Math.min(Math.max(start.x + event.clientX - start.pointerX, 0), start.maxX),
        y: Math.min(Math.max(start.y + event.clientY - start.pointerY, menuBarHeight), start.maxY),
      };
      start.latest = latest;
      self.style.setProperty('--x', `${latest.x}px`);
      self.style.setProperty('--y', `${latest.y}px`);
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label={title}
      hidden={hidden}
      onPointerDownCapture={onFocus}
      style={{ '--x': `${offset.x}px`, '--y': `${offset.y}px` } as CSSProperties}
      className={`absolute top-0 left-0 translate-x-(--x) translate-y-(--y) ${front ? 'z-20' : 'z-10'}`}
    >
      {children(dragProps)}
    </div>
  );
}
