import { docsRoute, repoUrl } from './shared';

/**
 * The questions people ask before they install Thaw. Each answer opens with the answer
 * itself (yes, no, or the thing to do), says no more than a sentence or two after it, and
 * ends at the one page that says more. Something done in steps is set as steps. Every
 * answer is something this site or Thaw's own docs already say; none is written from
 * memory. They are drawn on /faq and given to search engines in the same words.
 */
export const thawFaq: {
  question: string;
  answer: string;
  /** What to do, in order, where the answer is a thing to do in more than one step. */
  steps?: string[];
  more?: { label: string; href: string };
}[] = [
  {
    question: 'Is Thaw free?',
    answer:
      'Yes. It is open source under GPL-3.0, and there is no account to make. When a new macOS comes out, the update for it is free as well.',
  },
  {
    question: 'Which macOS do I need?',
    answer:
      'macOS 14 or later. You get Thaw 3, in beta, on macOS 27, Thaw 2 on macOS 26, and Thaw 1 on macOS 14 or 15.',
    more: { label: 'Find your version', href: `${docsRoute}/thaw/versions` },
  },
  {
    question: 'Do I need Homebrew or Terminal?',
    answer:
      'No. Download the disk image for your macOS from the releases page, then drag Thaw to Applications.',
    more: { label: 'Releases', href: `${repoUrl('thaw')}/releases` },
  },
  {
    question: 'Why does Thaw ask for Accessibility?',
    answer:
      'To move menu bar items. That is how it hides and shows them, so without it nothing can be hidden.',
    more: { label: 'Permissions', href: `${docsRoute}/thaw/permissions` },
  },
  {
    question: 'Do I have to allow Screen Recording?',
    answer:
      'No. Hiding and moving items work without it. Thaw uses it for live previews of items and a tint from your wallpaper.',
    more: {
      label: 'What you lose without it',
      href: `${docsRoute}/thaw/permissions#screen-recording`,
    },
  },
  {
    question: 'Does Thaw collect anything about me?',
    answer:
      'No. Thaw has no analytics and no tracking. It goes online for two things, updates and their release notes, and you can switch both off.',
    more: { label: 'What Thaw sends', href: `${docsRoute}/thaw/network` },
  },
  {
    question: 'Can I trust a download?',
    answer:
      'You can check it. Every release is built by a hosted service and comes with a signed record of the source it was built from, which you can compare with your download.',
    more: { label: 'Verify a release', href: `${docsRoute}/thaw/verifying-releases` },
  },
  {
    question: 'How do I get updates?',
    answer:
      'You don’t have to do anything: Thaw updates itself. To pick an update channel, open Settings and choose About.',
    more: { label: 'Update channels', href: `${docsRoute}/thaw/versions#pick-an-update-channel` },
  },
  {
    question: 'Something looks wrong. What do I do?',
    answer: 'Tell us on GitHub. Open an issue and say what you saw and which Thaw you have.',
    more: { label: 'Open an issue on GitHub', href: `${repoUrl('thaw')}/issues` },
  },
  {
    question: 'How do I uninstall it?',
    answer: 'Turn off Launch at Login, quit Thaw, then drag it from Applications to the Trash.',
    steps: [
      'Turn off Launch at Login in Settings, under General.',
      'Quit Thaw from the menu on its icon.',
      'Drag Thaw from Applications to the Trash. With Homebrew, run brew uninstall thaw.',
    ],
    more: { label: 'Reset or uninstall', href: `${docsRoute}/thaw/reset-and-uninstall#uninstall` },
  },
  {
    question: 'How is Thaw related to Ice?',
    answer: 'Thaw 2 is a fork of Ice, by Jordan Baird. Thaw 3 is original work.',
    more: { label: 'Built with', href: '/built-with' },
  },
  {
    question: 'What is Floe?',
    answer:
      'A launcher for macOS from the people who make Thaw. It is a separate app, still early, and Thaw works without it.',
    more: { label: 'Floe', href: '/floe' },
  },
];

// The four asked first, which the home page ends on. The rest are a link away.
const first = [
  'Is Thaw free?',
  'Do I need Homebrew or Terminal?',
  'Why does Thaw ask for Accessibility?',
  'Does Thaw collect anything about me?',
];
export const homeFaq = thawFaq.filter(({ question }) => first.includes(question));
