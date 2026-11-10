'use client';

import createGlobe, { type COBEOptions, type Globe } from 'cobe';
import { useEffect, useRef } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';
import middles from '@/lib/world-middles.json';

/**
 * Where a country's marker goes, in degrees (scripts/build-world-map.mjs): one of its own dots,
 * so a country in pieces, as the United States with Alaska is, still has its marker on land.
 */
// The file's pairs are read as lists of any length, so the type is said here.
const where = middles as unknown as Record<string, [number, number] | undefined>;

/** A CSS colour as cobe takes one: red, green and blue from 0 to 1. */
function rgb(element: Element, property: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = `var(${property})`;
  element.append(probe);
  const [red = 0, green = 0, blue = 0] =
    getComputedStyle(probe).color.match(/\d+/g)?.map(Number) ?? [];
  probe.remove();
  return [red / 255, green / 255, blue / 255];
}

type Country = { code: string; people: number };

/** Each country's marker, bigger for more people. */
function plotted(countries: Country[]) {
  const most = Math.max(1, ...countries.map((country) => country.people));
  return countries.flatMap((country) => {
    const location = where[country.code];
    // A square root, as on the flat map, keeps one person from vanishing beside two hundred.
    return location ? [{ location, size: 0.02 + 0.06 * Math.sqrt(country.people / most) }] : [];
  });
}

/**
 * The map's counts on a globe that turns slowly and can be dragged round. Each country with
 * people in it has a marker, bigger for more. Without WebGL it says so through `onFail`, and
 * the page draws the flat map instead.
 */
export function WorldGlobe({
  countries,
  label,
  onFail,
}: {
  countries: Country[];
  label: string;
  onFail: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The view the globe opens on, read once when it is made.
  const markers = useRef<Country[]>(countries);
  const globeRef = useRef<Globe | null>(null);
  // The markers are worked out again only when the view changes.
  useEffect(() => {
    globeRef.current?.update({ markers: plotted(countries) });
  }, [countries]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Asked of a spare canvas: a context, once taken, is the only kind that canvas can have.
    const test = document.createElement('canvas');
    if (!test.getContext('webgl2') && !test.getContext('webgl')) {
      onFail();
      return;
    }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ratio = Math.min(2, devicePixelRatio);
    let size = root.offsetWidth;
    // The busiest country faces the page first.
    const [first] = markers.current;
    const [latitude, longitude] = (first && where[first.code]) ?? [20, 0];
    let phi = (3 * Math.PI) / 2 - (longitude * Math.PI) / 180;
    const theta = Math.max(-0.4, Math.min(0.4, (latitude * Math.PI) / 180));
    let drag: number | null = null;
    let seen = true;
    let visible = !document.hidden;
    let resized = false;
    let frame = 0;

    // Frames are asked for only while the globe is on screen and the tab is showing, and under
    // reduced motion only when something has changed.
    const turn = () => {
      frame = 0;
      if (drag === null && !still) phi += 0.0025;
      // The size goes in only when it has changed: cobe sets the canvas size each time it is given.
      // Not `* ratio`: cobe multiplies by `devicePixelRatio` itself, so this makes the drawing
      // buffer `size * ratio`. To go back to the denser buffer it was before, pass `size * ratio`.
      globe.update(resized ? { phi, width: size, height: size } : { phi });
      resized = false;
      if (!still) schedule();
    };
    const schedule = () => {
      if (!frame && seen && visible) frame = requestAnimationFrame(turn);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const resume = () => {
      if (seen && visible) schedule();
      else pause();
    };

    const sized = new ResizeObserver(() => {
      size = root.offsetWidth;
      resized = true;
      schedule();
    });
    sized.observe(root);
    const watched = new IntersectionObserver(([entry]) => {
      seen = entry?.isIntersecting ?? true;
      resume();
    });
    watched.observe(canvas);
    const shown = () => {
      visible = !document.hidden;
      resume();
    };
    document.addEventListener('visibilitychange', shown);

    const colours = () => {
      const dark = document.documentElement.classList.contains('dark');
      return {
        dark: dark ? 1 : 0,
        mapBrightness: dark ? 4 : 2,
        baseColor: dark ? [0.28, 0.28, 0.28] : [0.97, 0.97, 0.97],
        markerColor: rgb(root, '--world-lit'),
        glowColor: dark ? [0.16, 0.16, 0.16] : [0.94, 0.94, 0.94],
      } satisfies Partial<COBEOptions>;
    };
    // Made once: cobe wraps the canvas in a box of its own each time it is called.
    const globe = createGlobe(canvas, {
      devicePixelRatio: ratio,
      // See `turn`: the size as the page shows it, cobe makes the buffer denser by `ratio`.
      width: size,
      height: size,
      phi,
      theta,
      diffuse: 1.2,
      mapSamples: 16000,
      // On the surface: raised, the markers just past the edge show beside the globe.
      markerElevation: 0,
      markers: plotted(markers.current),
      ...colours(),
    });
    globeRef.current = globe;
    const unthemed = onThemeChange(() => globe.update(colours()));

    schedule();

    const grab = (event: PointerEvent) => {
      drag = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (drag === null) return;
      phi += (event.clientX - drag) / 200;
      drag = event.clientX;
      schedule();
    };
    const release = () => {
      drag = null;
    };
    canvas.addEventListener('pointerdown', grab);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    return () => {
      pause();
      document.removeEventListener('visibilitychange', shown);
      sized.disconnect();
      watched.disconnect();
      unthemed();
      globe.destroy();
      globeRef.current = null;
      // Back as React left it, without cobe's box.
      const box = canvas.parentElement;
      root.append(canvas);
      if (box !== root) box?.remove();
      canvas.removeEventListener('pointerdown', grab);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
    };
  }, [onFail]);

  return (
    <div ref={rootRef} className="mx-auto aspect-square w-full max-w-[30rem]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        // pan-y: a finger dragging sideways turns the globe, up and down still scrolls the page.
        className="size-full cursor-grab touch-pan-y active:cursor-grabbing"
      />
    </div>
  );
}
