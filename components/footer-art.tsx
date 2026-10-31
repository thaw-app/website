'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useGallery } from './conure-greeting';

// The moving wordmark brings a shader library and measures its own letters, and the conure
// is six hundred lines of drawing. Neither is fetched until the foot of the page is near.
const FooterConure = dynamic(
  () => import('./footer-conure').then((module) => module.FooterConure),
  { ssr: false },
);
// The game the conure opens, fetched only if someone opens it.
const FooterShootout = dynamic(
  () => import('./footer-shootout').then((module) => module.FooterShootout),
  { ssr: false },
);
const FooterWordmark = dynamic(
  () => import('./footer-wordmark').then((module) => module.FooterWordmark),
  { ssr: false },
);

/**
 * The art at the foot of every page: "thaw & floe" in moving type, and the conure that
 * comes by to sit on it. Its room is kept from the start (the stylesheet gives it a
 * height), so nothing moves when it arrives.
 */
export function FooterArt({ conure = true }: { conure?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // Where there is no conure here, the page's own gallery is somewhere else.
  const { playing, close } = useGallery(conure);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    // A screen and a half ahead, so it is there before a reader scrolling down is.
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        seen.disconnect();
      },
      { rootMargin: '150% 0px' },
    );
    seen.observe(element);
    return () => seen.disconnect();
  }, []);

  return (
    <div
      ref={stage}
      data-shootout={playing || undefined}
      className="footer-art relative w-full overflow-hidden"
    >
      {near && (
        <>
          {conure && <FooterConure />}
          <FooterWordmark />
          {playing && <FooterShootout onDone={close} leaving="footer" />}
        </>
      )}
    </div>
  );
}
