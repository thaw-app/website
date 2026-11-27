'use client';

import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Paper, useInSeason } from '@/components/papel-lazy';
import { around, stripOptions } from '@/lib/papel-designs';
import { papelClosedClass, papelClosedKey } from '@/lib/season';

/**
 * A short string of papel picado over a product's own page, to brush, pull and rip like the one
 * in the footer. A visitor can close it for good. It scrolls away with the page, and stays off
 * the docs, where a strip that comes and goes makes the page jump by its height.
 *
 * Once closed, the root layout's script hides it before paint (lib/season.ts). The script lives
 * there because React never runs a script a client component renders.
 */
export function PapelStrip() {
  const pathname = usePathname();
  const season = useInSeason();
  const [failed, setFailed] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (document.documentElement.classList.contains(papelClosedClass)) setClosed(true);
  }, []);
  if (failed || closed || (pathname !== '/' && pathname !== '/floe')) return null;
  const product = pathname === '/floe' ? 'floe' : 'thaw';
  function close() {
    setClosed(true);
    // Other layouts mount their own copy on client navigation.
    document.documentElement.classList.add(papelClosedClass);
    try {
      localStorage.setItem(papelClosedKey, 'true');
    } catch {}
  }
  return (
    <div
      className="papel-strip in-season relative z-41 flex flex-row items-center justify-center overflow-visible text-center text-sm font-medium"
      style={{ height: '5.25rem' }}
    >
      {season && (
        <div
          role="img"
          aria-label="A string of papel picado, cut tissue paper flags in bright colours"
          className="absolute inset-0"
        >
          <Paper
            designs={(width, pitch) => around(product, 'small-', Math.round(width / pitch))}
            options={stripOptions}
            onFail={() => setFailed(true)}
          />
        </div>
      )}
      <button
        type="button"
        aria-label="Close the papel picado"
        onClick={close}
        className="absolute inset-e-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1.5 transition-colors duration-100 [&_svg]:size-4.5"
      >
        <X />
      </button>
    </div>
  );
}
