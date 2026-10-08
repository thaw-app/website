import Image from 'next/image';
import droppyGlyph from '@/assets/droppy-glyph.png';
import raycastGlyph from '@/assets/raycast-glyph.png';
import { GitHubMark } from '@/components/github-mark';
import { links } from './shared';

/**
 * The three icons at the end of the header: Thaw's integrations and its home on GitHub.
 * One list, drawn twice: behind Thaw's dot on a wide screen (components/header-items.tsx)
 * and as plain rows in the phone's menu and the docs sidebar (lib/layout.shared.tsx).
 * `label` says what the icon is to someone who cannot see it; `text` is the row's name.
 */
export const headerLinks = [
  {
    label: 'Thaw extension for Raycast',
    text: 'Raycast extension',
    href: links.raycast,
    icon: <Image src={raycastGlyph} alt="" className="size-[18px] invert dark:invert-0" />,
  },
  {
    label: 'Thaw droplet for Droppy',
    text: 'Droppy droplet',
    href: links.droppy,
    icon: <Image src={droppyGlyph} alt="" className="h-[18px] w-auto invert dark:invert-0" />,
  },
  {
    label: 'Thaw on GitHub',
    text: 'GitHub',
    href: links.github,
    icon: <GitHubMark />,
  },
];
