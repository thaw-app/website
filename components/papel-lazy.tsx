'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { inSeason } from '@/lib/season';

/** The paper, fetched only when something is about to hang. */
export const Paper = dynamic(() => import('./papel-sheet').then((module) => module.Paper), {
  ssr: false,
});

/** Whether the papel picado is up. False until the page is running, as it is for the server. */
export function useInSeason() {
  const [season, setSeason] = useState(false);
  useEffect(() => setSeason(inSeason()), []);
  return season;
}
