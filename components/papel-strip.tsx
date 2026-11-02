'use client';

import { Banner } from 'fumadocs-ui/components/banner';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Paper, useInSeason } from '@/components/papel-lazy';
import { around, stripOptions } from '@/lib/papel-designs';

/**
 * A short string of papel picado over a product's own page, to brush, pull and rip like the one
 * in the footer. A visitor can close it for good. It scrolls away with the page, and stays off
 * the docs, where a strip that comes and goes makes the page jump by its height.
 */
export function PapelStrip() {
  const pathname = usePathname();
  const season = useInSeason();
  const [failed, setFailed] = useState(false);
  if (failed || (pathname !== '/' && pathname !== '/floe')) return null;
  const product = pathname === '/floe' ? 'floe' : 'thaw';
  return (
    <Banner
      id="papel-picado-2026"
      changeLayout={false}
      height="5.25rem"
      className="papel-strip in-season relative z-41 overflow-visible bg-transparent p-0"
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
    </Banner>
  );
}
