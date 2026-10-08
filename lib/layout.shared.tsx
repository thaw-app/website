import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { HeaderItems } from '@/components/header-items';
import { headerLinks } from './header-links';
import { docsRoute, products, siteName } from './shared';

export function baseOptions(): BaseLayoutProps {
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
      { text: 'Changelog', url: `${docsRoute}/thaw/changelog`, active: 'nested-url' },
      { text: 'Roadmap', url: '/roadmap' },
      { text: 'Community', url: '/community' },
      {
        type: 'custom',
        secondary: true,
        on: 'nav',
        // The header sets this straight into a list, so it is given as an item of one.
        children: (
          <li className="list-none">
            <HeaderItems />
          </li>
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
