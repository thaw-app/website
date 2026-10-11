import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { CSSProperties } from 'react';
import { SiteBanner } from '@/components/site-banner';
import { SiteFooter } from '@/components/site-footer';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      {/* News about Thaw, so over Thaw's pages and not Floe's. */}
      <SiteBanner />
      {/* Fumadocs holds the header to 1400px and centres it; here it spans the window, as
          the pages under it do. */}
      <HomeLayout {...baseOptions()} style={{ '--fd-layout-width': '100%' } as CSSProperties}>
        {children}
        <SiteFooter />
      </HomeLayout>
    </>
  );
}
