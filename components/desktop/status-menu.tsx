'use client';

import { type CSSProperties, useState } from 'react';
import { useMenu } from './use-menu';

/** One row of a status menu, by the name on it. */
export interface StatusMenuRow {
  label: string;
  onPick: () => void;
}

interface StatusMenuProps {
  /** The app's name, which is the menu's. */
  label: string;
  /** Where the menu's top left corner goes, in pixels from the desktop's. */
  at: { x: number; y: number };
  /** The rows in the app's order, a line drawn between each group. */
  groups: StatusMenuRow[][];
  /** The app's colour, for the row under the pointer, and the text that reads on it. */
  accent: string;
  onAccent: string;
  onClose: () => void;
}

/**
 * The menu an app opens from its item in the menu bar. It is drawn on the desktop and
 * not beside what opened it, so it notes for itself what to hand the keyboard back to.
 */
export function StatusMenu({ label, at, groups, accent, onAccent, onClose }: StatusMenuProps) {
  // Noted while drawing, before the menu takes the keyboard for itself.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const { menuRef, onKeyDown } = useMenu(onClose, opener);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={
        { left: at.x, top: at.y, '--accent': accent, '--on-accent': onAccent } as CSSProperties
      }
      className="desktop-menu absolute z-40 min-w-52 rounded-xl border border-white/15 bg-neutral-800/75 p-1.5 text-[13px] text-white shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
    >
      {groups.map((group, index) => (
        <div
          key={group[0].label}
          className={index > 0 ? 'mt-1.5 border-t border-white/12 pt-1.5' : undefined}
        >
          {group.map((row) => (
            <button
              key={row.label}
              type="button"
              role="menuitem"
              onClick={() => {
                row.onPick();
                onClose();
              }}
              className="block w-full rounded-md px-2.5 py-1 text-left outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)"
            >
              {row.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
