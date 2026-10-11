import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { CSSProperties, ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { baseOptions } from '@/lib/layout.shared';

// Floe's own pages: its page, roadmap and changelog. The same frame as Thaw's, under a
// header and a footer that are Floe's.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions({ product: 'floe' })}
      style={{ '--fd-layout-width': '100%' } as CSSProperties}
    >
      {children}
      <SiteFooter product="floe" />
    </HomeLayout>
  );
}
