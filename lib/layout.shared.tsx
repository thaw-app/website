import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import droppyGlyph from '@/assets/droppy-glyph.png';
import raycastGlyph from '@/assets/raycast-glyph.png';
import { GitHubMark } from '@/components/github-mark';
import { HeaderItems } from '@/components/header-items';
import { docsRoute, products, siteName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src={products.thaw.icon} alt="" className="size-6" />
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
      { text: 'Roadmap', url: `${docsRoute}/thaw/roadmap` },
      { text: 'Community', url: '/community' },
      { type: 'custom', secondary: true, on: 'nav', children: <HeaderItems /> },
      {
        type: 'icon',
        on: 'menu',
        url: 'https://www.raycast.com/diazdesandi/thaw',
        label: 'Thaw extension for Raycast',
        text: 'Raycast extension',
        icon: <Image src={raycastGlyph} alt="" className="size-[18px] invert dark:invert-0" />,
        external: true,
      },
      {
        type: 'icon',
        on: 'menu',
        url: 'https://getdroppy.app/droplets#thaw',
        label: 'Thaw droplet for Droppy',
        text: 'Droppy droplet',
        icon: <Image src={droppyGlyph} alt="" className="h-[18px] w-auto invert dark:invert-0" />,
        external: true,
      },
      {
        type: 'icon',
        on: 'menu',
        url: 'https://github.com/thaw-app',
        label: 'Thaw on GitHub',
        text: 'GitHub',
        icon: <GitHubMark />,
        external: true,
      },
    ],
  };
}
