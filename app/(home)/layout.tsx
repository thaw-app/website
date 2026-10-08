import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { CSSProperties } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    // Fumadocs holds the header to 1400px and centres it; here it spans the window, as the
    // pages under it do.
    <HomeLayout {...baseOptions()} style={{ '--fd-layout-width': '100%' } as CSSProperties}>
      {children}
      <SiteFooter />
    </HomeLayout>
  );
}
