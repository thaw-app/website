'use client';

import { type PointerEvent, useId, useRef } from 'react';
import world from '@/lib/world-map.json';

const dots = world.dots as unknown as Record<string, [number, number][]>;

/** Every dot of a list as one path: a line of no length with round ends draws a dot. */
function path(list: [number, number][]) {
  return list.map(([column, row]) => `M${column + 0.5} ${row + 0.5}h0`).join('');
}

const land = path(Object.values(dots).flat());

/**
 * The world as a grid of dots with the counted countries lit, for a browser without WebGL.
 * Fetched only then (components/world-map.tsx).
 */
export function WorldFlat({
  countries,
  label,
  share,
}: {
  countries: { code: string; name: string; people: number }[];
  label: string;
  share: (count: number) => string;
}) {
  const lensRef = useRef<SVGCircleElement>(null);
  // An id that can stand in url(#…): React's own has characters that cannot.
  const id = `map${useId().replace(/[^\w-]/g, '')}`;
  const most = Math.max(1, ...countries.map((country) => country.people));

  // The dots near a mouse or pen brighten, as the cube's characters do near the pointer
  // (components/ascii-cube.tsx). A finger drags the page, so it is left out.
  const follow = (event: PointerEvent<SVGSVGElement>) => {
    const lens = lensRef.current;
    const matrix = event.currentTarget.getScreenCTM()?.inverse();
    if (!lens || !matrix || event.pointerType === 'touch') return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    lens.setAttribute('cx', String(point.x));
    lens.setAttribute('cy', String(point.y));
  };
  const leave = () => lensRef.current?.setAttribute('cx', '-100');
  const litDots = countries.flatMap((country) =>
    dots[country.code]
      ? [
          {
            country,
            d: path(dots[country.code]),
            // The fewest still show: a square root keeps one person from vanishing beside
            // two hundred.
            opacity: 0.35 + 0.65 * Math.sqrt(country.people / most),
          },
        ]
      : [],
  );

  return (
    <svg
      viewBox={`0 0 ${world.columns} ${world.rows}`}
      role="img"
      aria-label={label}
      className="w-full"
      fill="none"
      strokeWidth={0.55}
      strokeLinecap="round"
      onPointerMove={follow}
      onPointerLeave={leave}
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-lens`}>
          <circle
            ref={lensRef}
            cx={-100}
            cy={0}
            r={world.columns * 0.07}
            fill={`url(#${id}-glow)`}
          />
        </mask>
      </defs>
      {/* Land with no one counted in it: faint, but a shade stronger on a light page, where
          grey dots on grey all but go. */}
      <path d={land} className="stroke-fd-foreground/25 dark:stroke-fd-foreground/15" />
      {litDots.map(({ country, d, opacity }) => (
        <path
          key={country.code}
          d={d}
          className="stroke-(--world-lit)"
          strokeWidth={0.7}
          opacity={opacity}
        >
          <title>{`${country.name}: ${share(country.people)}`}</title>
        </path>
      ))}
      {/* The same dots again at full strength, seen only through the lens. */}
      <g aria-hidden mask={`url(#${id}-lens)`} className="pointer-events-none">
        <path d={land} className="stroke-fd-foreground/60" />
        {litDots.map(({ country, d }) => (
          <path key={country.code} d={d} className="stroke-(--world-lit)" strokeWidth={0.85} />
        ))}
      </g>
    </svg>
  );
}
