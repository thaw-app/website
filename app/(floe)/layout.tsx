import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PapelStrip } from '@/components/papel-strip';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';
import { floeTabIcons } from '@/lib/shared';

export const metadata: Metadata = { icons: floeTabIcons };

// Floe's own pages: its page, roadmap and changelog. The same frame as Thaw's, under a
// header and a footer that are Floe's.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <PapelStrip />
      <SiteFrame product="floe">
        {children}
        <SiteFooter product="floe" />
      </SiteFrame>
    </>
  );
}
