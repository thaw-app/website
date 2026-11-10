'use client';

import dynamic from 'next/dynamic';

// The 404 page's root not-found goes into every route's first load, so what it draws is
// fetched after the page instead. Both draw on a canvas once scripts run, so the server
// HTML has nothing to lose.
export const Frost = dynamic(() => import('./frost').then((module) => module.Frost), {
  ssr: false,
});
// The conure takes up room in the headline, so until it arrives a span of the same size
// (see .stray-conure) keeps the headline from moving when it does.
export const StrayConure = dynamic(
  () => import('./stray-conure').then((module) => module.StrayConure),
  { ssr: false, loading: () => <span aria-hidden className="stray-conure" /> },
);
