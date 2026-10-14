import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { HeaderItems } from '@/components/header-items';
import { navTitle, ProductPages } from '@/components/product-switcher';
import { headerLinks } from './header-links';
import { pagesOf } from './header-pages';
import type { ProductSlug } from './shared';

/**
 * What every layout's header holds. The site's header sets its icons straight into a list,
 * so there they are an item of one; the docs' bar does not, and there they stand alone.
 */
export function baseOptions({
  iconsInList = true,
  product = 'thaw',
  bothProducts = false,
}: {
  iconsInList?: boolean;
  /**
   * For the one header that is over both products' pages, the docs': its pages are then
   * chosen by the address, as its name is. (In the phone's menu they stay Thaw's.)
   */
  bothProducts?: boolean;
  /** Whose header it is: Floe's pages carry Floe's name, icon and links. */
  product?: ProductSlug;
} = {}): BaseLayoutProps {
  return {
    nav: {
      // The product's name, which leads to its own page.
      title: navTitle,
      url: product === 'thaw' ? '/' : `/${product}`,
    },
    // Light, dark, or whichever the Mac is set to: a new visitor already gets the Mac's, and
    // the third choice is the way back to it after picking one of the others.
    themeSwitch: { mode: 'light-dark-system' },
    // The site's own pages first, then Thaw's integrations and GitHub as icons.
    links: [
      ...(bothProducts
        ? [
            { type: 'custom' as const, on: 'nav' as const, children: <ProductPages /> },
            ...pagesOf[product].map((page) => ({ ...page, on: 'menu' as const })),
          ]
        : pagesOf[product]),
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
