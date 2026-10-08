'use client';

import { useState } from 'react';
import { Choice } from '@/components/choice';
import community from '@/lib/community.json';
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

/**
 * Where Thaw's stars, pull requests and issues come from: the world as a grid
 * of dots, with each country lit by its share. The counts are made when the site is built,
 * from the locations on GitHub profiles, and cover only the people who give one.
 */
export function WorldMap() {
  const [view, setView] = useState<(typeof views)[number]['id']>('stargazers');
  const chosen = views.find((candidate) => candidate.id === view) ?? views[0];
  // A first build with no token has no counts yet: draw nothing, as the page expects.
  const counted = community.world?.[view];
  if (!counted) return null;
  const { list: countries, placed } = counted;
  // A country's part of the stars, issues or pull requests that could be placed. Under one in a hundred is
  // said so, not rounded away to nothing.
  const share = (count: number) => {
    const part = (count / placed) * 100;
    return part < 1 ? '<1%' : `${Math.round(part)}%`;
  };
  const most = Math.max(1, ...countries.map((country) => country.people));

  return (
    <div className="flex flex-col gap-6">
      <Choice
        legend="What to show on the map"
        options={views.map(({ id, label }) => ({ id, label }))}
        value={view}
        onChange={setView}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <svg
          viewBox={`0 0 ${world.columns} ${world.rows}`}
          role="img"
          aria-label={`A world map with ${countries.length} countries lit: ${countries
            .slice(0, 5)
            .map((country) => country.name)
            .join(', ')} and others.`}
          className="w-full"
          fill="none"
          strokeWidth={0.55}
          strokeLinecap="round"
        >
          <path d={land} className="stroke-fd-foreground/15" />
          {countries.map((country) =>
            dots[country.code] ? (
              // The fewest still show: a square root keeps one person from vanishing
              // beside two hundred.
              <path
                key={country.code}
                d={path(dots[country.code])}
                className="stroke-(--world-lit)"
                strokeWidth={0.7}
                opacity={0.35 + 0.65 * Math.sqrt(country.people / most)}
              >
                <title>{`${country.name}: ${share(country.people)}`}</title>
              </path>
            ) : null,
          )}
        </svg>

        <div className="flex flex-col gap-3">
          <p className="text-fd-muted-foreground">
            <span className="font-display text-4xl font-semibold tracking-tight text-fd-foreground tabular-nums">
              {countries.length}
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
        {longDate(community.world.checked)}.
      </p>
    </div>
  );
}
