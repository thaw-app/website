import { type KeyboardEvent, useEffect, useRef } from 'react';

/**
 * What every menu on the desktop does once it is open: the keyboard lands on
 * its current row, the arrows walk it, a press anywhere else closes it, and
 * Escape or Tab closes it and hands the keyboard back to the button it opened
 * from. That button is found as the expanded opener beside the menu, so a menu
 * is always drawn inside the same element as its button.
 */
function opener(menu: HTMLElement | null) {
  return menu?.parentElement?.querySelector<HTMLElement>('[aria-haspopup][aria-expanded="true"]');
}

/** `returnTo` names what gets the keyboard back, for a menu that is not drawn beside its button. */
export function useMenu(onClose: () => void, returnTo?: HTMLElement | null) {
  const menuRef = useRef<HTMLDivElement>(null);
  // The newest onClose, so a parent that redraws does not set the menu up again.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const menu = menuRef.current;
    (
      menu?.querySelector<HTMLElement>('[aria-checked=true]') ??
      menu?.querySelector<HTMLElement>('button:not(:disabled)')
    )?.focus({ preventScroll: true });

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      // A press on the opener is left to its own click, which closes the menu.
      if (menu?.contains(target) || opener(menu)?.contains(target)) return;
      close.current();
    }
    // Deferred so the click that opened the menu does not close it again.
    const timer = setTimeout(() => document.addEventListener('pointerdown', onPointerDown));
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  /** Closes the menu and puts the keyboard back where it came from. */
  function dismiss() {
    const button = returnTo ?? opener(menuRef.current);
    close.current();
    button?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent) {
    const rows = [
      ...(menuRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []),
    ];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      // Escape belongs to the menu alone, not to a sheet or a launcher around it.
      event.stopPropagation();
      dismiss();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      rows[(at + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      rows[event.key === 'Home' ? 0 : rows.length - 1]?.focus();
    }
  }

  return { menuRef, onKeyDown, dismiss };
}
