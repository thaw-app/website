'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// The demo is the heaviest thing on the home page and sits two screens down it. Its code
// is fetched when the visitor is nearly there, not with the first paint.
const Desktop = dynamic(() => import('@/components/desktop').then((module) => module.Desktop), {
  ssr: false,
  loading: () => <Frame />,
});

/** The demo's place on the page, at its own shape, so nothing moves when it arrives. */
function Frame() {
  return (
    <div aria-hidden className="desktop-wallpaper aspect-[1512/982] w-full rounded-3xl border" />
  );
}

export function DesktopLazy() {
  const holder = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    // A link straight to the demo should find it there.
    if (window.location.hash === '#try') setNear(true);
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      // A screen's height of warning, so it is ready before it scrolls into view.
      { rootMargin: '100% 0px' },
    );
    watcher.observe(element);
    return () => watcher.disconnect();
  }, []);

  return <div ref={holder}>{near ? <Desktop /> : <Frame />}</div>;
}
