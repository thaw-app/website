import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { baseOptions } from '@/lib/layout.shared';
import { docsRoute, products } from '@/lib/shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const options = baseOptions();
  return (
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
            '0 min(calc(var(--fd-sidebar-col) * 9999), var(--fd-sidebar-width)) minmax(0, 1fr) var(--fd-toc-width, 0px) 0',
        },
      }}
      {...options}
      // The picker under it already names the product, so the sidebar's first row is
      // not the site's name again: it is the way back to the home page.
      nav={{
        ...options.nav,
        title: (
          <span className="flex items-center gap-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground">
            <ArrowLeft aria-hidden className="size-4" />
            Home
          </span>
        ),
      }}
      // The docs sidebar already lists the docs, the changelog and the roadmap, so of the
      // header's links it keeps the icons, and adds the way to the demo on the home page.
      // In the header the icons are for the phone's menu only; here they show always.
      links={[
        { text: 'Try Thaw', url: '/#try' },
        ...(options.links ?? [])
          .filter((link) => link.type === 'icon')
          .map((link) => ({ ...link, on: 'all' as const })),
      ]}
    >
      {children}
    </DocsLayout>
  );
}
