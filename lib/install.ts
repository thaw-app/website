import { repoUrl } from './shared';

// The ways to install Thaw and what each needs, for the install tabs on the home page
// (components/install-tabs.tsx) and the page's Markdown (lib/site-markdown.ts).
//
// Named by the macOS a visitor is on, which they know, not by the version of Thaw, which
// they would have to work out. A browser does not say which macOS it runs on, so the
// stable release is shown first.
export const installWays = [
  {
    id: 'macos-26',
    label: 'macOS 26',
    command: 'brew install thaw',
    about: 'Thaw 2, the stable release.',
  },
  {
    id: 'macos-27',
    label: 'macOS 27',
    command: 'brew install thaw@beta',
    about: 'Thaw 3, rebuilt for macOS 27. In beta.',
  },
  {
    id: 'macos-15',
    label: 'macOS 15',
    command: 'brew install thaw@beta',
    about: 'Thaw 2.2, which brings back macOS 15. In beta.',
  },
  {
    id: 'download',
    label: 'Without Homebrew',
    note: 'Get the disk image for your macOS from the releases and drag Thaw to Applications.',
    href: `${repoUrl('thaw')}/releases`,
  },
] as const;

const accessibility = {
  label: 'Needs',
  value: 'Accessibility',
  detail: 'Thaw asks on first launch. It needs it to move menu bar items.',
};
// Thaw 3 only. macOS 27 keeps the menu bar's order in one protected file, and has no
// smaller permission for it than picking that file in a panel (Full Disk Access is the
// fallback Thaw offers if that is declined, never the first ask).
const layoutAccess = {
  label: 'Needs',
  value: 'Menu Bar Layout Access',
  detail:
    'You pick one file, and Thaw gets that file alone. Items then move into place without your pointer moving.',
};
const screenRecording = {
  label: 'Optional',
  value: 'Screen Recording',
  detail:
    'It gives you live previews and a tint from your wallpaper. Without it, items show as their app’s icon.',
};
export const installFacts = {
  'macos-26': [accessibility, screenRecording],
  'macos-27': [accessibility, layoutAccess, screenRecording],
  'macos-15': [accessibility, screenRecording],
  // Either release may be the one downloaded, so the one that is not always asked says when.
  download: [accessibility, { ...layoutAccess, label: 'Needs, on macOS 27' }, screenRecording],
};
