'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Choice } from '@/components/choice';
import { ResolvingText } from '@/components/resolving-text';
import { longDate } from '@/lib/shared';

// The globe's library and the world's dots are the heaviest things on the page, and the globe
// takes a moment to build. Both wait until the map is nearly on screen, in a space the size
// of the globe so that nothing moves when it arrives.
const globeSpace = 'mx-auto aspect-square w-full max-w-[30rem]';
const WorldGlobe = dynamic(
  () => import('@/components/world-globe').then((module) => module.WorldGlobe),
  { ssr: false, loading: () => <div className={globeSpace} /> },
);
const WorldFlat = dynamic(
  () => import('@/components/world-flat').then((module) => module.WorldFlat),
  { ssr: false, loading: () => <div className={globeSpace} /> },
);

const views = [
  { id: 'stargazers', label: 'Stars', of: 'stars from people' },
  { id: 'pulls', label: 'Pull requests', of: 'pull requests from people' },
  { id: 'issues', label: 'Issues', of: 'issues from people' },
] as const;

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
  const spaceRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // A screen's height of warning, so it is there before it scrolls into view.
  useEffect(() => {
    const space = spaceRef.current;
    if (!space) return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: '100% 0px' },
    );
    watcher.observe(space);
    return () => watcher.disconnect();
  }, []);
  // The globe, unless the browser has no WebGL for it: then the flat map.
  const [flat, setFlat] = useState(false);
  const fail = useCallback(() => setFlat(true), []);
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

  const described = `A world with ${countries.length} countries lit: ${countries
    .slice(0, 5)
    .map((country) => country.name)
    .join(', ')} and others.`;

  return (
    <div className="flex flex-col gap-6">
      <Choice
        legend="What to show on the map"
        options={views.map(({ id, label }) => ({ id, label }))}
        value={view}
        onChange={setView}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {!near ? (
          <div ref={spaceRef} className={globeSpace} />
        ) : flat ? (
          <WorldFlat countries={countries} label={described} share={share} />
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
