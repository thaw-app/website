import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { HeaderItems } from '@/components/header-items';
import { navTitle } from '@/components/product-switcher';
import { headerLinks } from './header-links';
import { changelogRoute, changelogUrl, docsRoute, type ProductSlug } from './shared';

// Where each product's header goes: its own page, docs, changelog and roadmap, then the
// other product. Thaw's also has the community page, which is the whole project's.
const pagesOf = {
  thaw: [
    { text: 'Floe', url: '/floe' },
    { text: 'Docs', url: `${docsRoute}/thaw`, active: 'nested-url' as const },
    { text: 'Changelog', url: changelogRoute, active: 'nested-url' as const },
    { text: 'Roadmap', url: '/roadmap' },
    { text: 'Community', url: '/community' },
  ],
  floe: [
    { text: 'Thaw', url: '/' },
    { text: 'Docs', url: `${docsRoute}/floe`, active: 'nested-url' as const },
    { text: 'Changelog', url: changelogUrl('floe'), active: 'nested-url' as const },
    { text: 'Roadmap', url: '/floe/roadmap' },
    { text: 'Community', url: '/community' },
  ],
};

/**
 * What every layout's header holds. The site's header sets its icons straight into a list,
 * so there they are an item of one; the docs' bar does not, and there they stand alone.
 */
export function baseOptions({
  iconsInList = true,
  product = 'thaw',
}: {
  iconsInList?: boolean;
  /** Whose header it is: Floe's pages carry Floe's name, icon and links. */
  product?: ProductSlug;
} = {}): BaseLayoutProps {
  return {
    nav: {
      // The product's name, which opens a list of both products.
      title: navTitle,
      url: product === 'thaw' ? '/' : `/${product}`,
    },
    // The site's own pages first, then Thaw's integrations and GitHub. On a wide screen
    // those sit behind Thaw's dot, which hides and shows them; in a menu or a sidebar
    // they are plain icons.
    links: [
      ...pagesOf[product],
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
