'use client';

import Image from 'next/image';
import { useState } from 'react';
import droppyGlyph from '@/assets/droppy-glyph.png';
import raycastGlyph from '@/assets/raycast-glyph.png';
import { GitHubMark } from './github-mark';

const items = [
  {
    label: 'Thaw extension for Raycast',
    href: 'https://www.raycast.com/diazdesandi/thaw',
    icon: <Image src={raycastGlyph} alt="" className="size-[18px] invert dark:invert-0" />,
  },
  {
    label: 'Thaw droplet for Droppy',
    href: 'https://getdroppy.app/droplets#thaw',
    icon: <Image src={droppyGlyph} alt="" className="h-[18px] w-auto invert dark:invert-0" />,
  },
  {
    label: 'Thaw on GitHub',
    href: 'https://github.com/thaw-app',
    icon: <GitHubMark />,
  },
];

/**
 * The header's icons, kept the way Thaw keeps a menu bar: the dot at the end
 * is Thaw's own, and clicking it tucks the icons before it out of sight, or
 * brings them back. The site's header is a menu bar of sorts, so it gets to
 * show what the app does.
 */
export function HeaderItems() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="flex items-center">
      <div
        inert={hidden}
        className={`flex items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-out motion-reduce:transition-none ${
          hidden ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
        }`}
      >
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className="flex size-9 shrink-0 items-center justify-center text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            {item.icon}
          </a>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={hidden}
        aria-label={
          hidden ? 'Show the hidden icons' : 'Hide these icons, as Thaw hides menu bar items'
        }
        title={hidden ? 'Show the hidden icons' : 'Hide these icons, as Thaw would'}
        onClick={() => setHidden(!hidden)}
        className="flex size-9 shrink-0 items-center justify-center text-fd-foreground transition-colors hover:bg-fd-accent"
      >
        <span aria-hidden className="size-[7px] rounded-full bg-current" />
      </button>
    </div>
  );
}
