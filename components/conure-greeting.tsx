'use client';

import { type Ref, useEffect, useState } from 'react';
import { wearHat } from './conure-poses';

// The way to the shooting gallery, the same from any conure. The first touch gets its
// attention, the second gets a tip of its hat, and the third opens the gallery. Left alone
// this long between touches, it forgets. Whoever has opened the gallery once can open it
// again with one touch.
const patience = 5000;
const found = 'conure-shootout-found';
export function foundBefore() {
  try {
    return localStorage.getItem(found) !== null;
  } catch {
    return false;
  }
}

/**
 * For the part of a page the gallery opens in: whether a conure has asked for it, and the
 * way to close it, which tells the conure. Only one part of a page should be listening.
 */
export function useGallery(listening = true) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!listening) return;
    const open = () => setPlaying(true);
    window.addEventListener('conure:shootout', open);
    return () => window.removeEventListener('conure:shootout', open);
  }, [listening]);
  return {
    playing,
    close() {
      setPlaying(false);
      window.dispatchEvent(new CustomEvent('conure:shootout-end'));
    },
  };
}

/** A tip of the hat, a pose and how many seconds it holds it. */
export const tip: [pose: string, seconds: number][] = [
  ['faceDown', 0.15],
  ['facing', 0.15],
  ['faceDown', 0.15],
  ['facing', 0.15],
];

/**
 * Runs the exchange for one bird, which says how it takes each step and tells this when it
 * is touched by calling `greet`. `wave` is the keyboard's button for the same thing: while
 * it has the focus the bird is `called`, and does not forget. Returns the way to stop.
 */
export function greetConure(
  wave: HTMLButtonElement,
  bird: {
    told: (greeted: number, known: boolean) => void;
    look: () => void;
    tip: () => void;
    called: () => void;
    forget: () => void;
    opened: () => void;
    closed: () => void;
  },
) {
  let greeted = 0;
  let known = foundBefore();
  let focused = false;
  let playing = false;
  let waiting = 0;

  function tell(next: number) {
    greeted = next;
    bird.told(greeted, known);
  }
  function forget() {
    window.clearTimeout(waiting);
    tell(0);
    bird.forget();
  }
  function greet() {
    if (playing) return;
    window.clearTimeout(waiting);
    if (greeted >= 2 || known) {
      known = true;
      tell(0);
      wearHat();
      try {
        localStorage.setItem(found, '1');
      } catch {}
      window.dispatchEvent(new CustomEvent('conure:shootout'));
      return;
    }
    tell(greeted + 1);
    if (greeted === 1) bird.look();
    else {
      wearHat();
      bird.tip();
    }
    if (!focused) waiting = window.setTimeout(forget, patience);
  }
  function onFocus() {
    focused = true;
    if (playing) return;
    window.clearTimeout(waiting);
    bird.called();
  }
  function onBlur() {
    focused = false;
    if (!playing) waiting = window.setTimeout(forget, patience);
  }
  function onOpen() {
    playing = true;
    window.clearTimeout(waiting);
    wave.tabIndex = -1;
    bird.opened();
  }
  function onClose() {
    playing = false;
    wave.tabIndex = 0;
    bird.closed();
  }

  bird.told(greeted, known);
  wave.addEventListener('click', greet);
  wave.addEventListener('focus', onFocus);
  wave.addEventListener('blur', onBlur);
  window.addEventListener('conure:shootout', onOpen);
  window.addEventListener('conure:shootout-end', onClose);
  return {
    greet,
    stop() {
      window.clearTimeout(waiting);
      wave.removeEventListener('click', greet);
      wave.removeEventListener('focus', onFocus);
      wave.removeEventListener('blur', onBlur);
      window.removeEventListener('conure:shootout', onOpen);
      window.removeEventListener('conure:shootout-end', onClose);
    },
  };
}

/** The keyboard's way to a conure: out of sight until it has the focus, with the same steps as touching it. */
export function ConureWave({
  ref,
  greeted,
  known,
}: {
  ref: Ref<HTMLButtonElement>;
  greeted: number;
  known: boolean;
}) {
  return (
    <>
      <button ref={ref} type="button" className="conure-wave font-mono text-sm">
        {known || greeted >= 2
          ? 'Open the shooting gallery'
          : greeted === 1
            ? 'Wave again'
            : 'Wave at the conure'}
      </button>
      <p className="sr-only" aria-live="polite">
        {greeted === 1 && 'The conure stops and looks at you.'}
        {greeted === 2 && 'It tips its hat.'}
      </p>
    </>
  );
}
