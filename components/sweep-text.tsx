'use client';

import { useEffect, useRef } from 'react';

/** The cube's characters, faintest to boldest, without its space (components/ascii-cube.tsx). */
const ramp = '.·:-=+*#%@';
/** Frames a second, as the footer's type, and how many characters the band moves in each. */
const rate = 16;
const stride = 3;
/** How many characters wide the band is. */
const band = 4;

/**
 * Text that, when it changes, is swept over by a band of the cube's characters, as the band
 * of light passes over the cube. The new text is all that shows around the band, so what is
 * read is always what a Copy button beside it copies. Meant for monospace, where every
 * character is one width and nothing shifts. The first text is shown as it is, and with
 * reduced motion every text is.
 */
export function SweepText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const before = useRef(children);

  useEffect(() => {
    const shown = ref.current;
    const changed = before.current !== children;
    before.current = children;
    if (!shown) return;
    // The span is written to directly below, so it is set here too rather than left to React.
    shown.textContent = children;
    if (!changed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let front = 0;
    let timer: number | undefined;
    const draw = () => {
      let text = '';
      for (let index = 0; index < children.length; index++) {
        const character = children[index];
        const inBand = index >= front - band && index < front && character !== ' ';
        text += inBand ? ramp[Math.floor(Math.random() * ramp.length)] : character;
      }
      shown.textContent = text;
      front += stride;
      if (front < children.length + band + stride) timer = window.setTimeout(draw, 1000 / rate);
      else shown.textContent = children;
    };
    draw();
    return () => window.clearTimeout(timer);
  }, [children]);

  return <span ref={ref}>{children}</span>;
}
