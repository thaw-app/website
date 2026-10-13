import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { CSSProperties, ReactNode } from 'react';
import { FrameFade } from '@/components/page-fade';
import { SiteContainer } from '@/components/site-container';
import { SiteFooter } from '@/components/site-footer';
import { baseOptions } from '@/lib/layout.shared';

// Floe's own pages: its page, roadmap and changelog. The same frame as Thaw's, under a
// header and a footer that are Floe's.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <FrameFade>
      <HomeLayout
        {...baseOptions({ product: 'floe' })}
        slots={{ container: SiteContainer }}
        style={{ '--fd-layout-width': '100%' } as CSSProperties}
      >
        {children}
        <SiteFooter product="floe" />
      </HomeLayout>
    </FrameFade>
  );
}
