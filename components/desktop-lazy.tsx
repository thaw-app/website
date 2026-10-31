'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import thawStill from '@/assets/desktop-still.png';
import thawStillDark from '@/assets/desktop-still-dark.png';
import floeStill from '@/assets/desktop-still-floe.png';
import floeStillDark from '@/assets/desktop-still-floe-dark.png';
import type { ProductSlug } from '@/lib/shared';

// The demo is the heaviest thing on the home page and sits two screens down it. Its code
// is fetched when the visitor is nearly there, not with the first paint.
const Desktop = dynamic(() => import('@/components/desktop').then((module) => module.Desktop), {
  ssr: false,
  // Only a screen wide enough to hide the picture fetches the demo, so its place is kept
  // by the frame alone.
  loading: () => <div className={frame} />,
});

// The picture a phone gets, of the desktop as it opens for each product.
const stills = {
  thaw: {
    src: thawStill,
    dark: thawStillDark,
    alt: 'Thaw’s settings window under a menu bar, with a Dock below',
  },
  floe: {
    src: floeStill,
    dark: floeStillDark,
    alt: 'Floe’s launcher open under a menu bar, with a Dock below',
  },
};

// The demo's own shape and ground, before it is there.
const frame = 'desktop-wallpaper aspect-[1512/982] w-full overflow-hidden rounded-3xl border';

// Below this the desktop is too small to work, and the demo makes itself inert.
const roomy = '(min-width: 640px)';

/**
 * The demo's place on the page, at its own shape, so nothing moves when it arrives. On a
 * phone it holds a picture of the demo, which is all a phone is ever given: the picture is
 * hidden on a wider screen, and a browser does not fetch a lazy image it is not showing.
 * The pictures are taken by scripts/capture-demo.mjs.
 */
function Frame({ product }: { product: ProductSlug }) {
  return (
    <div className={frame}>
      <Image
        src={stills[product].src}
        alt={stills[product].alt}
        sizes="100vw"
        className="size-full object-cover sm:hidden dark:hidden"
      />
      <Image
        src={stills[product].dark}
        alt={stills[product].alt}
        sizes="100vw"
        className="hidden size-full object-cover max-sm:dark:block"
      />
    </div>
  );
}

export function DesktopLazy({ product = 'thaw' }: { product?: ProductSlug }) {
  const holder = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const screen = window.matchMedia(roomy);
    let watcher: IntersectionObserver | undefined;
    // Only a screen that can use the demo fetches it. Once fetched it stays, and makes
    // itself inert if the window is then narrowed.
    const watch = () => {
      if (!screen.matches || watcher) return;
      // A link straight to the demo should find it there.
      if (window.location.hash === '#try') setNear(true);
      watcher = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setNear(true);
        },
        // A screen's height of warning, so it is ready before it scrolls into view.
        { rootMargin: '100% 0px' },
      );
      watcher.observe(element);
    };
    watch();
    screen.addEventListener('change', watch);
    return () => {
      screen.removeEventListener('change', watch);
      watcher?.disconnect();
    };
  }, []);

  return <div ref={holder}>{near ? <Desktop start={product} /> : <Frame product={product} />}</div>;
}
