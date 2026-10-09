import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { HeaderItems } from '@/components/header-items';
import { headerLinks } from './header-links';
import { changelogRoute, docsRoute, products, siteName } from './shared';

/**
 * What every layout's header holds. The site's header sets its icons straight into a list,
 * so there they are an item of one; the docs' bar does not, and there they stand alone.
 */
export function baseOptions({ iconsInList = true } = {}): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* The width is what the icon is drawn at, not the 512px file's: without it the
              browser is offered 640 and 1080px copies for a 24px mark. */}
          <Image src={products.thaw.icon} alt="" width={24} className="size-6" />
          <span className="font-display text-base font-semibold tracking-tight">{siteName}</span>
        </>
      ),
    },
    // The site's own pages first, then Thaw's integrations and GitHub. On a wide screen
    // those sit behind Thaw's dot, which hides and shows them; in a menu or a sidebar
    // they are plain icons.
    links: [
      { text: 'Docs', url: `${docsRoute}/thaw`, active: 'nested-url' },
      { text: 'Changelog', url: changelogRoute, active: 'nested-url' },
      { text: 'Roadmap', url: '/roadmap' },
      { text: 'Community', url: '/community' },
      {
        type: 'custom',
        secondary: true,
        on: 'nav',
        children: iconsInList ? (
          <li className="list-none">
            <HeaderItems />
          </li>
        ) : (
          <HeaderItems />
        ),
      },
      ...headerLinks.map((link) => ({
        type: 'icon' as const,
        on: 'menu' as const,
        url: link.href,
        label: link.label,
        text: link.text,
        icon: link.icon,
        external: true,
      })),
    ],
  };
}
