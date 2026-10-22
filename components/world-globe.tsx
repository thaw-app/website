'use client';

import createGlobe, { type COBEOptions, type Globe } from 'cobe';
import { useEffect, useRef } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';
import world from '@/lib/world-map.json';

const dots = world.dots as unknown as Record<string, [number, number][]>;

// The map's grid, back in degrees (scripts/build-world-map.mjs): 1.8 between dots, from 80° north.
const step = 1.8;
const north = 80;
const degrees = ([column, row]: [number, number]): [number, number] => [
  north - (row + 0.5) * step,
  -180 + (column + 0.5) * step,
];

/**
 * Where a country's marker goes: the one of its own dots nearest the middle of them all, so a
 * country in pieces, as the United States with Alaska is, still has its marker on land.
 */
const middles = new Map(
  Object.entries(dots).map(([code, list]) => {
    const columns = list.reduce((sum, [column]) => sum + column, 0) / list.length;
    const rows = list.reduce((sum, [, row]) => sum + row, 0) / list.length;
    const distance = ([column, row]: [number, number]) =>
      (column - columns) ** 2 + (row - rows) ** 2;
    const nearest = list.reduce((best, dot) => (distance(dot) < distance(best) ? dot : best));
    return [code, degrees(nearest)];
  }),
);

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
    const location = middles.get(country.code);
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
    const [latitude, longitude] = (first && middles.get(first.code)) ?? [20, 0];
    let phi = (3 * Math.PI) / 2 - (longitude * Math.PI) / 180;
    const theta = Math.max(-0.4, Math.min(0.4, (latitude * Math.PI) / 180));
    let drag: number | null = null;
    let seen = true;
    let frame = 0;

    const sized = new ResizeObserver(() => {
      size = root.offsetWidth;
    });
    sized.observe(root);
    const watched = new IntersectionObserver(([entry]) => {
      seen = entry?.isIntersecting ?? true;
    });
    watched.observe(canvas);

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
      width: size * ratio,
      height: size * ratio,
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

    const turn = () => {
      if (seen && !document.hidden) {
        if (drag === null && !still) phi += 0.0025;
        globe.update({ phi, width: size * ratio, height: size * ratio });
      }
      frame = requestAnimationFrame(turn);
    };
    frame = requestAnimationFrame(turn);

    const grab = (event: PointerEvent) => {
      drag = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (drag === null) return;
      phi += (event.clientX - drag) / 200;
      drag = event.clientX;
    };
    const release = () => {
      drag = null;
    };
    canvas.addEventListener('pointerdown', grab);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    return () => {
      cancelAnimationFrame(frame);
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
