'use client';

import { Folder, type LucideIcon, Settings, Trash } from 'lucide-react';
import Image from 'next/image';
import { type PointerEvent, type ReactNode, type RefObject, useRef, useState } from 'react';
import { products } from '@/lib/shared';

/** Stand-ins for whatever else is in a Dock. They are scenery and do nothing, and there
    are only two: this is a tidy Mac, with little in its Dock. */
const scenery: { icon: LucideIcon; label: string }[] = [
  { icon: Folder, label: 'Files' },
  { icon: Settings, label: 'Settings' },
];

/** How far the pointer's pull reaches, in pixels, and how much the nearest icon grows. */
const reach = 110;
const growth = 0.55;

interface DockProps {
  /** Shrinks the Dock with the desktop it sits on; 1 is its real size. */
  scale: number;
  thawOpen: boolean;
  /** Open but put away in the Dock: still running, and its icon brings it back. */
  thawMinimized: boolean;
  /** Thaw's icon, which a minimized window shrinks towards. */
  thawRef: RefObject<HTMLButtonElement | null>;
  /** Floe has its launcher or its settings open. */
  floeOpen: boolean;
  /** Floe's Show in Dock. Off, it lives in the menu bar alone. */
  floeInDock: boolean;
  /** Floe's settings window is put away in the Dock. */
  floeMinimized: boolean;
  /** Whatever a minimized Floe window shrinks towards: its icon, or its own tile. */
  floeRef: RefObject<HTMLButtonElement | null>;
  onThaw: () => void;
  onFloe: () => void;
}

export function Dock({
  scale,
  thawOpen,
  thawMinimized,
  thawRef,
  floeOpen,
  floeInDock,
  floeMinimized,
  floeRef,
  onThaw,
  onFloe,
}: DockProps) {
  const dockRef = useRef<HTMLDivElement>(null);

  // Icons swell towards the pointer, the nearest one most. The sizes are
  // written straight to the tiles so a moving pointer does not re-render.
  function magnify(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    for (const tile of dockRef.current?.querySelectorAll<HTMLElement>('[data-tile]') ?? []) {
      const box = tile.getBoundingClientRect();
      const distance = Math.abs(event.clientX - (box.left + box.width / 2));
      const pull = Math.max(0, 1 - distance / reach);
      tile.style.setProperty('--mag', String(1 + growth * Math.sin((pull * Math.PI) / 2)));
    }
  }

  function settle() {
    for (const tile of dockRef.current?.querySelectorAll<HTMLElement>('[data-tile]') ?? []) {
      tile.style.removeProperty('--mag');
    }
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-2"
      // Never so small that its icons stop reading as icons.
      style={{ zoom: Math.max(scale, 0.45) }}
    >
      <div
        ref={dockRef}
        onPointerMove={magnify}
        onPointerLeave={settle}
        className="pointer-events-auto flex h-[4.25rem] items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-2 pb-1.5 backdrop-blur-xl"
      >
        <AppButton
          name="Thaw"
          action={
            thawMinimized
              ? 'Restore Thaw Settings'
              : thawOpen
                ? 'Thaw Settings is open'
                : 'Open Thaw Settings'
          }
          open={thawOpen}
          buttonRef={thawRef}
          onClick={onThaw}
        >
          <Image src={products.thaw.icon} alt="" width={96} className="size-full" />
        </AppButton>
        {floeInDock && (
          <AppButton
            name="Floe"
            action={floeMinimized ? 'Restore Floe Settings' : 'Show or hide the Floe launcher'}
            open={floeOpen}
            buttonRef={floeRef}
            onClick={onFloe}
          >
            <Image src={products.floe.icon} alt="" width={96} className="size-full" />
          </AppButton>
        )}

        {scenery.map(({ icon: Icon, label }) => (
          <span
            key={label}
            aria-hidden
            data-tile
            className="dock-tile mb-1.5 hidden items-center justify-center rounded-xl bg-white/[0.08] text-white/70 sm:flex"
          >
            <Icon className="size-[55%]" />
          </span>
        ))}

        <span aria-hidden className="mb-1.5 hidden h-11 w-px bg-white/10 sm:block" />
        {/* An app with no Dock icon still has somewhere to minimize to: macOS keeps the
            window as a tile of its own on this side of the divider. */}
        {!floeInDock && floeMinimized && (
          <AppButton
            name="Floe Settings"
            action="Restore Floe Settings"
            open={false}
            buttonRef={floeRef}
            onClick={onFloe}
          >
            <Image src={products.floe.icon} alt="" width={96} className="size-full" />
          </AppButton>
        )}
        <span
          aria-hidden
          data-tile
          className="dock-tile mb-1.5 hidden items-center justify-center rounded-xl bg-white/[0.08] text-white/70 sm:flex"
        >
          <Trash className="size-[55%]" />
        </span>
      </div>
    </div>
  );
}

function AppButton({
  name,
  action,
  open,
  buttonRef,
  onClick,
  children,
}: {
  name: string;
  action: string;
  open: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  children: ReactNode;
}) {
  // Counts launches, so the icon hops again each time its app is opened.
  const [launches, setLaunches] = useState(0);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        if (!open) setLaunches((count) => count + 1);
        onClick();
      }}
      aria-label={action}
      className="group relative flex flex-col items-center gap-0.5 outline-none"
    >
      <span className="pointer-events-none absolute -top-8 rounded-md bg-black/70 px-2 py-0.5 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
        {name}
      </span>
      <span
        key={launches}
        data-tile
        className={`dock-tile block group-focus-visible:ring-2 group-focus-visible:ring-white ${
          launches > 0 ? 'dock-bounce' : ''
        }`}
      >
        {children}
      </span>
      {/* The dot macOS puts under a running app. */}
      <span
        className={`size-1 rounded-full transition-colors duration-300 ${
          open ? 'bg-white/80' : 'bg-transparent'
        }`}
      />
    </button>
  );
}
