'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import still from '@/assets/desktop-still.png';

// The demo is the heaviest thing on the home page and sits two screens down it. Its code
// is fetched when the visitor is nearly there, not with the first paint.
const Desktop = dynamic(() => import('@/components/desktop').then((module) => module.Desktop), {
  ssr: false,
  loading: () => <Frame />,
});

// Below this the desktop is too small to work, and the demo makes itself inert.
const roomy = '(min-width: 640px)';

/**
 * The demo's place on the page, at its own shape, so nothing moves when it arrives. On a
 * phone it holds a picture of the demo, which is all a phone is ever given: the picture is
 * hidden on a wider screen, and a browser does not fetch a lazy image it is not showing.
 * The picture is taken by scripts/capture-demo.mjs.
 */
function Frame() {
  return (
    <div className="desktop-wallpaper aspect-[1512/982] w-full overflow-hidden rounded-3xl border">
      <Image
        src={still}
        alt="Thaw’s settings window under a menu bar, with a Dock below"
        sizes="100vw"
        className="size-full object-cover sm:hidden"
      />
    </div>
  );
}

export function DesktopLazy() {
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

  return <div ref={holder}>{near ? <Desktop /> : <Frame />}</div>;
}
