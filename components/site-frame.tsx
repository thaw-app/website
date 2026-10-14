import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { CSSProperties, ReactNode } from 'react';
import { SiteContainer } from '@/components/site-container';
import { baseOptions } from '@/lib/layout.shared';
import type { ProductSlug } from '@/lib/shared';

/**
 * The header over a page and whatever is under it. Fumadocs holds the header to 1400px
 * and centres it; here it spans the window, as the pages under it do.
 */
export function SiteFrame({
  product = 'thaw',
  children,
}: {
  /** Whose header it is. */
  product?: ProductSlug;
  children: ReactNode;
}) {
  return (
    <HomeLayout
      {...baseOptions({ product })}
      slots={{ container: SiteContainer }}
      style={{ '--fd-layout-width': '100%' } as CSSProperties}
    >
      {children}
    </HomeLayout>
  );
}
