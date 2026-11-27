'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { newsClosedClass, newsClosedKey, newsId } from '@/lib/season';

/**
 * News over Thaw's and Floe's pages. Once closed, the root layout's script hides it before paint
 * (lib/season.ts); new news needs a new newsId there.
 */
export function SiteNews() {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (document.documentElement.classList.contains(newsClosedClass)) setClosed(true);
  }, []);
  if (closed) return null;
  function close() {
    setClosed(true);
    try {
      localStorage.setItem(newsClosedKey, newsId);
    } catch {}
  }
  return (
    <div className="site-news relative flex min-h-11 items-center justify-center border-b bg-fd-secondary px-12 py-2 text-center text-sm">
      <p className="text-pretty">
        <span className="font-semibold">Punkto is coming.</span>{' '}
        <span className="text-fd-muted-foreground max-sm:hidden">Just a dot in your menu bar.</span>{' '}
        <Link href="/punkto" className="link font-medium">
          See it
        </Link>
      </p>
      <button
        type="button"
        aria-label="Close the news about Punkto"
        onClick={close}
        className="tap absolute inset-e-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fd-muted-foreground transition-colors duration-100 hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4"
      >
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
