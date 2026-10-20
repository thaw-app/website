'use client';

import { useEffect, useRef } from 'react';

/** The cube's characters, faintest to boldest, without its space (components/ascii-cube.tsx). */
const ramp = '.·:-=+*#%@';
/** Frames a second, as the footer's type: type that changes too smoothly stops looking like type. */
const rate = 16;
/** Frames before the first character settles, and between one settling and the next. */
const settleAfter = 8;
const settleEvery = 2;

/**
 * A value that comes in the way the cube is drawn: the first time it is wholly in view, its
 * letters and digits run through the cube's characters and settle, left to right, in under
 * a second. It is drawn once and then left alone. Before the script runs, and with reduced
 * motion, it is simply the value. Its room is the value's own, so nothing around it moves.
 */
export function ResolvingText({ children }: { children: string }) {
  const shownRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const shown = shownRef.current;
    if (!shown || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const characters = [...children];
    const changes = characters.map((character) => /[\p{L}\p{N}]/u.test(character));
    const last = settleAfter + characters.length * settleEvery;
    let frame = 0;
    let timer: number | undefined;
    const draw = () => {
      shown.textContent = characters
        .map((character, index) =>
          !changes[index] || frame >= settleAfter + index * settleEvery
            ? character
            : ramp[Math.floor(Math.random() * ramp.length)],
        )
        .join('');
      if (frame++ < last) timer = window.setTimeout(draw, 1000 / rate);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        draw();
      },
      { threshold: 1 },
    );
    observer.observe(shown);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      shown.textContent = children;
    };
  }, [children]);

  return (
    <span className="relative inline-block tabular-nums">
      <span className="sr-only select-none">{children}</span>
      {/* The value, unseen, holds the room, and what is drawn sits over it. Only the first copy
          is read aloud, and only the drawn one is selected and copied. */}
      <span aria-hidden className="invisible whitespace-nowrap select-none">
        {children}
      </span>
      <span ref={shownRef} aria-hidden className="absolute top-0 left-0 whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}
