import { GitHubMark } from '@/components/github-mark';
import { links } from './shared';

/**
 * The icon at the end of the header: the project's home on GitHub. What Thaw works with
 * has a row of its own on the home page (components/feature-list.tsx). One list, drawn
 * twice: behind Thaw's dot on a wide screen (components/header-items.tsx) and as a plain
 * row in the phone's menu (lib/layout.shared.tsx). `label` says what the icon is to
 * someone who cannot see it; `text` is the row's name.
 */
export const headerLinks = [
  {
    label: 'Thaw on GitHub',
    text: 'GitHub',
    href: links.github,
    icon: <GitHubMark />,
  },
];
