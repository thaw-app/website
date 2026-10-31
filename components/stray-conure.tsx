'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { onThemeChange } from '@/lib/on-theme-change';
import { ConureWave, greetConure, tip } from './conure-greeting';
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
// And when it is first touched: it turns to face whoever did it and bobs its head. Touched
// again it tips its hat, and a third time opens the shooting gallery, over the section it
// is in (see stray-stage and conure-greeting).
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
const tipped: [pose: string, seconds: number][] = [...tip, ['facing', 3]];

/**
 * The footer's conure, strayed: on the page for an address that is no page it stands at
 * the end of the headline. It looks at a pointer that comes near and bobs its head when
 * touched, and a little more of that opens the shooting gallery. With reduced motion it
 * stands there, and turns to look.
 */
export function StrayConure() {
  const birdRef = useRef<HTMLCanvasElement>(null);
  const [wave, setWave] = useState<HTMLButtonElement | null>(null);
  // The bird stands in the headline, where a button has no place: it goes where the page
  // has made room for it, once there is a page to look in.
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [greeting, setGreeting] = useState({ greeted: 0, known: false });

  useEffect(() => setSlot(document.getElementById('stray-conure-wave')), []);

  useEffect(() => {
    const bird = birdRef.current;
    const context = bird?.getContext('2d');
    if (!bird || !context) return;

    let routine = idle;
    let step = 0;
    let timer = 0;
    // Where a pointer close by has it looking, which the routine gives way to.
    let watching: string | null = null;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = () =>
      drawPose(context, routine === idle && watching ? watching : routine[step][0]);
    show();
    const unthemed = onThemeChange(show);

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
    // Something to do instead of what it was doing. With reduced motion, only how it ends.
    function act(next: typeof idle) {
      window.clearTimeout(timer);
      routine = still && next !== idle ? next.slice(-1) : next;
      step = 0;
      if (still) show();
      else hold();
    }

    const greeter =
      wave &&
      greetConure(wave, {
        told: (greeted, known) => setGreeting({ greeted, known }),
        look: () => act(bob),
        tip: () => act(tipped),
        called: () => act([['facing', 3600]]),
        forget: () => act(idle),
        opened() {},
        // There again when the game has gone, and it takes a bow.
        closed: () => act(tipped),
      });
    // The bird itself takes no clicks, so the words beside it can still be selected.
    function onPointerDown(event: PointerEvent) {
      if (bird && touches(event, bird)) greeter?.greet();
    }
    window.addEventListener('pointerdown', onPointerDown);
    const stop = () => {
      window.clearTimeout(timer);
      unthemed();
      greeter?.stop();
      window.removeEventListener('pointerdown', onPointerDown);
    };
    if (still) return stop;
    hold();

    // Back over its shoulder if the pointer is behind it, neck up if it is overhead,
    // straight at it if it is on the bird, and ahead otherwise.
    function onPointerMove(event: PointerEvent) {
      if (!bird || event.pointerType !== 'mouse') return;
      const box = bird.getBoundingClientRect();
      const pixel = box.width / columns;
      const head = { x: box.left + pixel * 13.5, y: box.top + pixel * 6 };
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
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [wave]);

  return (
    <span aria-hidden className="stray-conure">
      <canvas ref={birdRef} width={columns} height={rows} className="pointer-events-none" />
      {slot &&
        createPortal(
          <ConureWave ref={setWave} greeted={greeting.greeted} known={greeting.known} />,
          slot,
        )}
    </span>
  );
}
