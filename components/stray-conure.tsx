'use client';

import { useEffect, useRef } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';
import { columns, drawPose, rows, touches } from './conure-poses';

// What it does when left alone, a pose and how many seconds it holds it: it stands, looks
// back at the sentence it is at the end of, and pecks at the line it is standing on.
const idle: [pose: string, seconds: number][] = [
  ['perched', 2.6],
  ['looking', 0.9],
  ['perched', 1.8],
  ['pecking', 0.3],
  ['perched', 0.25],
  ['pecking', 0.3],
  ['perched', 3.2],
  ['bobUp', 0.7],
];
// And when it is touched: it turns to face whoever did it and bobs its head.
const bob: [pose: string, seconds: number][] = [
  ['facing', 0.4],
  ['faceUp', 0.16],
  ['faceDown', 0.16],
  ['faceUp', 0.16],
  ['faceDown', 0.16],
  ['faceUp', 0.16],
  ['faceDown', 0.16],
  ['facing', 0.5],
];

/**
 * The footer's conure, strayed: on the page for an address that is no page it stands at
 * the end of the headline. It looks at a pointer that comes near and bobs its head when
 * touched. With reduced motion it simply stands there.
 */
export function StrayConure() {
  const birdRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bird = birdRef.current;
    const context = bird?.getContext('2d');
    if (!bird || !context) return;

    let routine = idle;
    let step = 0;
    let timer = 0;
    // Where a pointer close by has it looking, which the routine gives way to.
    let watching: string | null = null;

    const show = () =>
      drawPose(context, routine === idle && watching ? watching : routine[step][0]);
    show();
    const unthemed = onThemeChange(show);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return unthemed;
    }

    function hold() {
      show();
      timer = window.setTimeout(() => {
        step++;
        if (step === routine.length) {
          routine = idle;
          step = 0;
        }
        hold();
      }, routine[step][1] * 1000);
    }
    hold();

    // Back over its shoulder if the pointer is behind it, neck up if it is overhead,
    // straight at it if it is on the bird, and ahead otherwise.
    function onPointerMove(event: PointerEvent) {
      if (!bird || event.pointerType !== 'mouse') return;
      const box = bird.getBoundingClientRect();
      const pixel = box.width / columns;
      const head = { x: box.left + pixel * 13.5, y: box.top + pixel * 4 };
      const away = Math.hypot(event.clientX - head.x, event.clientY - head.y);
      const next =
        away > box.width * 3
          ? null
          : away < pixel * 5
            ? 'facing'
            : event.clientY < head.y - pixel * 6
              ? 'bobUp'
              : event.clientX < head.x - pixel * 3
                ? 'looking'
                : 'perched';
      if (next === watching) return;
      watching = next;
      show();
    }
    // The bird itself takes no clicks, so the words beside it can still be selected.
    function onPointerDown(event: PointerEvent) {
      if (!bird || routine === bob) return;
      if (!touches(event, bird)) return;
      window.clearTimeout(timer);
      routine = bob;
      step = 0;
      hold();
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.clearTimeout(timer);
      unthemed();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <span aria-hidden className="stray-conure">
      <canvas ref={birdRef} width={columns} height={rows} className="pointer-events-none" />
    </span>
  );
}
