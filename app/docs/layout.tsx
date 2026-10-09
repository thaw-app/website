import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import Image from 'next/image';
import { baseOptions } from '@/lib/layout.shared';
import { docsRoute, products } from '@/lib/shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const options = baseOptions();
  return (
    // The docs have the site's own bar across the top: its name, where the other pages are,
    // the search and the icons, the same as on every other page. Under it, the sidebar
    // has only the product and its pages.
    <DocsLayout
      tree={source.getPageTree()}
      tabs={{
        // The product switcher shows each app's own icon.
        transform(tab) {
          const product = Object.entries(products).find(
            ([slug]) => tab.url === `${docsRoute}/${slug}`,
          )?.[1];
          if (!product) return tab;
          return {
            ...tab,
            icon: <Image src={product.icon} alt="" width={36} className="size-full" />,
          };
        },
      }}
      // Fumadocs centres the whole layout on a wide screen, which leaves the
      // sidebar's contents floating in from the edge and a blank band on the
      // right. This keeps the sidebar against the left, the list of headings
      // against the right, and gives the page everything in between.
      //
      // The sidebar's column is not written as var(--fd-sidebar-col), which is what the
      // layout itself uses. That one is a registered length, so it can be animated when
      // the sidebar folds, and Safari gets a registered length wrong on a zoomed page: at
      // 85% it made the column 228px for a sidebar still 268px wide, and the sidebar's
      // left edge went off the screen. So the column takes the sidebar's plain width, and
      // only asks the registered one whether the sidebar is folded (when it is 0).
      containerProps={{
        style: {
          gridTemplateColumns:
            '0 min(calc(var(--fd-sidebar-col) * 9999), var(--fd-sidebar-width)) minmax(0, 1fr) var(--fd-toc-col, 0px) 0',
        },
      }}
      {...options}
      nav={{ ...options.nav, mode: 'top' }}
    >
      {children}
    </DocsLayout>
  );
}
