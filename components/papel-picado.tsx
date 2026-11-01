'use client';

import { useState } from 'react';
import { Paper, useInSeason } from '@/components/papel-lazy';
import { MARKS } from '@/lib/papel-designs';

/**
 * One product's mark, over its headline, as tall as the drawing it stands in for so the headline
 * stays put. The string runs the full width of the column, which is why the box reaches past its
 * padding. A picture of the sheet stands there until the paper has hung, or if it cannot.
 */
export function PapelPicado({ product }: { product: keyof typeof MARKS }) {
  const mark = MARKS[product];
  const season = useInSeason();
  const [ready, setReady] = useState(false);
  return (
    <div
      role="img"
      aria-label={mark.label}
      className="papel-picado relative -mx-6 h-52 sm:h-64 lg:-mx-10 lg:h-[20rem] xl:h-[21.5rem]"
    >
      {/* A background, since a hidden one is not fetched out of season, and lib/season.ts has
          already asked for it in season. */}
      <div
        className={`papel-still absolute inset-x-0 top-2 bottom-2 bg-contain bg-center bg-no-repeat ${ready ? 'invisible' : ''}`}
        style={{ backgroundImage: `url(${mark.source})` }}
      />
      {season && (
        <Paper
          designs={() => [mark]}
          options={{ sag: 12, below: 240, ratio: mark.ratio, grid: mark.grid }}
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}
