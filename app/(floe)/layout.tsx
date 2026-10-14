import type { ReactNode } from 'react';
import { FrameFade } from '@/components/page-fade';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';

// Floe's own pages: its page, roadmap and changelog. The same frame as Thaw's, under a
// header and a footer that are Floe's.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <FrameFade>
      <SiteFrame product="floe">
        {children}
        <SiteFooter product="floe" />
      </SiteFrame>
    </FrameFade>
  );
}
