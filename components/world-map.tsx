'use client';

import { type PointerEvent, useCallback, useId, useRef, useState } from 'react';
import { Choice } from '@/components/choice';
import { ResolvingText } from '@/components/resolving-text';
import { WorldGlobe } from '@/components/world-globe';
import { longDate } from '@/lib/shared';
import world from '@/lib/world-map.json';

const dots = world.dots as unknown as Record<string, [number, number][]>;

const views = [
  { id: 'stargazers', label: 'Stars', of: 'stars from people' },
  { id: 'pulls', label: 'Pull requests', of: 'pull requests from people' },
  { id: 'issues', label: 'Issues', of: 'issues from people' },
] as const;

/** Every dot of a list as one path: a line of no length with round ends draws a dot. */
function path(list: [number, number][]) {
  return list.map(([column, row]) => `M${column + 0.5} ${row + 0.5}h0`).join('');
}

const land = path(Object.values(dots).flat());

// The counts are the page's to hand over: read here, the whole of the community's numbers
// and its roster would be sent to the browser along with the map.
type World = typeof import('@/lib/community.json')['world'];

/**
 * Where a product's stars, pull requests and issues come from: a globe with a marker on
 * each country, sized by its share, or, without WebGL, the world as a grid of dots lit the
 * same way. The counts are made when the site is built, from the locations on GitHub
 * profiles, and cover only the people who give one.
 */
export function WorldMap({ counts }: { counts: World | null | undefined }) {
  const [view, setView] = useState<(typeof views)[number]['id']>('stargazers');
  const lensRef = useRef<SVGCircleElement>(null);
  // The globe, unless the browser has no WebGL for it: then the flat map.
  const [flat, setFlat] = useState(false);
  const fail = useCallback(() => setFlat(true), []);
  // An id that can stand in url(#…): React's own has characters that cannot.
  const id = `map${useId().replace(/[^\w-]/g, '')}`;
  const chosen = views.find((candidate) => candidate.id === view) ?? views[0];
  // A first build with no token has no counts yet: draw nothing, as the page expects.
  const counted = counts?.[view];
  if (!counted) return null;
  const { list: countries, placed } = counted;
  // A country's part of the stars, issues or pull requests that could be placed. Under one in a hundred is
  // said so, not rounded away to nothing.
  const share = (count: number) => {
    const part = (count / placed) * 100;
    return part < 1 ? '<1%' : `${Math.round(part)}%`;
  };
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
  const described = `A world with ${countries.length} countries lit: ${countries
    .slice(0, 5)
    .map((country) => country.name)
    .join(', ')} and others.`;
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
    <div className="flex flex-col gap-6">
      <Choice
        legend="What to show on the map"
        options={views.map(({ id, label }) => ({ id, label }))}
        value={view}
        onChange={setView}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {flat ? (
          <svg
            viewBox={`0 0 ${world.columns} ${world.rows}`}
            role="img"
            aria-label={described}
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
                <path
                  key={country.code}
                  d={d}
                  className="stroke-(--world-lit)"
                  strokeWidth={0.85}
                />
              ))}
            </g>
          </svg>
        ) : (
          <WorldGlobe countries={countries} label={described} onFail={fail} />
        )}

        <div className="flex flex-col gap-3">
          <p className="text-fd-muted-foreground">
            <span className="font-display text-4xl font-semibold tracking-tight text-fd-foreground">
              <ResolvingText>{String(countries.length)}</ResolvingText>
            </span>{' '}
            countries
          </p>
          <ol className="flex flex-col border-t text-sm">
            {countries.slice(0, 8).map((country) => (
              <li key={country.code} className="flex justify-between gap-3 border-b py-1.5">
                <span>{country.name}</span>
                <span className="text-fd-muted-foreground tabular-nums">
                  {share(country.people)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="text-sm text-fd-muted-foreground">
        Share of the {chosen.of} whose GitHub profile names a place. Counted on{' '}
        {longDate(counts.checked)}.
      </p>
    </div>
  );
}
