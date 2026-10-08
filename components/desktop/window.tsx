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
  const drag = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

  const dragProps: HTMLAttributes<HTMLDivElement> = {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      drag.current = { pointerX: event.clientX, pointerY: event.clientY, ...offset };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const start = drag.current;
      const bounds = boundsRef.current;
      const self = windowRef.current;
      if (!start || !bounds || !self) return;

      const maxX = bounds.clientWidth - self.getBoundingClientRect().width;
      // The top of the window must stay reachable, so only that much has to remain in view.
      const maxY = bounds.clientHeight - 40;
      setOffset({
        x: Math.min(Math.max(start.x + event.clientX - start.pointerX, 0), Math.max(maxX, 0)),
        y: Math.min(Math.max(start.y + event.clientY - start.pointerY, menuBarHeight), maxY),
      });
    },
    onPointerUp() {
      drag.current = null;
    },
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
