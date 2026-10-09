import { links } from './shared';

/**
 * What the home page leads with, most important first, numbered in that order.
 * Everything here is something Thaw 3 does, taken from its release notes (3.0.0-alpha.1 through
 * beta.2) and its own settings panes, and worded as what a person can do
 * with it. Maintenance tools, diagnostics and the individual conditions of a
 * trigger are not features and are left out.
 *
 * Install gives a Mac on macOS 26 Thaw 2, which does not have all of it. The page says so
 * once, under the lists, and does not mark each feature.
 */
export const thawFeatures = [
  {
    title: 'Hide what you don’t need',
    detail:
      'Keep the items you look at in view and tuck the rest into a hidden section. Bring them back with a click, by hovering, by scrolling or with a shortcut.',
  },
  {
    title: 'Made for the notch',
    detail:
      'A notch covers part of the menu bar on a MacBook. The Thaw Bar shows the items it would hide in a bar of their own, just below.',
  },
  {
    title: 'Search from the keyboard',
    detail:
      'Find any menu bar item, hidden ones included, and open it. Recent items come first, and a shortcut opens an item by its letter.',
  },
  {
    title: 'Groups and folders',
    detail:
      'Group items so they move and hide as one, even across sections. Show a group as a folder with its own icon and colour.',
  },
  {
    title: 'Profiles',
    detail:
      'Save a whole setup and switch in one step, or bind it to a display, a Space or a Focus. Thaw shows what a profile would change before you apply it.',
  },
  {
    title: 'Zen mode',
    detail:
      'One shortcut hides every section and locks the ways to reveal them, then puts it all back. It can switch on by itself while you present or share your screen.',
  },
  {
    title: 'Style the bar',
    detail:
      'Give the bar a shape, glass, a border, a shadow or a tint taken from your wallpaper. You can round the screen corners too, and keep a different look per Space or for light and dark.',
  },
  {
    title: 'Scriptable',
    detail: 'Drive Thaw with thaw:// links from a launcher, a shortcut or a script.',
  },
  {
    title: 'A privacy pane',
    detail:
      'See what Thaw reads from your screen and every network call it makes, and switch them off.',
  },
  {
    title: 'Layout editor',
    detail:
      'Arrange every item in one window, with the keyboard if you like. Rest on a tile and the item lights up in the real bar.',
  },
];

/**
 * Everything else Thaw 3 does, by name, filed under what it is for so a name
 * can be looked up, and with what it works alongside.
 */
export const thawAlso: { group: string; names: (string | { name: string; href: string })[] }[] = [
  {
    group: 'Revealing',
    names: [
      'Reveal on click',
      'Reveal on hover',
      'Reveal on scroll',
      'Reveal on icon change',
      'Automatic rehiding',
      'Hide app menus on reveal',
      'Swap shown and hidden',
      'Open hidden items in the menu bar',
    ],
  },
  {
    group: 'Layout',
    names: [
      'Manual arrangement',
      'Spacer items',
      'An always-hidden section',
      'Per-display spacing',
      'Layout backups',
      'Stand-ins for Apple’s items',
      'Choose any item’s icon',
    ],
  },
  {
    group: 'Appearance',
    names: [
      'Adaptive gradient tint',
      'Gradient angle',
      'Rounded corners',
      'Menu bar shadow',
      'Per-Space appearance',
      'Show or hide the bar per Space',
      'Light and dark looks',
    ],
  },
  {
    group: 'Profiles',
    names: [
      'Per-display profiles',
      'Per-Space profiles',
      'Focus Filter profiles',
      'Script hooks on profiles',
      'Profile hotkeys',
    ],
  },
  {
    group: 'Automation',
    names: ['Triggers for running apps', 'Spotlight actions', 'Controls in Control Center'],
  },
  {
    group: 'Everyday',
    names: [
      'Simple Mode',
      'Live Activities stay visible',
      'Open by letter',
      'Settings search',
      'Tooltips',
    ],
  },
];

/**
 * What Thaw works with, each with how and where to get it, since these live outside Thaw.
 * `mark` names its icon in components/product-marks.tsx.
 */
export const thawWorksWith = [
  { name: 'Raycast', how: 'By its extension', href: links.raycast, mark: 'raycast' },
  { name: 'Droppy', how: 'As a Droplet', href: links.droppy, mark: 'droppy' },
  { name: 'Floe', how: 'With no setup', href: '/docs/floe', mark: 'floe' },
  {
    name: 'Shortcuts',
    how: 'With its own actions',
    href: '/docs/thaw/shortcuts#shortcuts-and-spotlight',
    mark: 'shortcuts',
  },
  { name: 'Siri', how: 'By voice', href: '/docs/thaw/shortcuts#ask-siri', mark: 'siri' },
  {
    name: 'thaw:// links',
    how: 'From any app or script',
    href: '/docs/thaw/uri-schemes',
    mark: 'link',
  },
];
