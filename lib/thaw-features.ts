/**
 * What the home page leads with, most important first, numbered in that order.
 * Everything here is something Thaw 3 does, taken from its release notes (3.0.0-alpha.1 through
 * beta.2) and its own settings panes, and worded as what a person can do
 * with it. Maintenance tools, diagnostics and the individual conditions of a
 * trigger are not features and are left out.
 *
 * Install gives a Mac on macOS 26 Thaw 2, which does not have all of it. `beta` marks what
 * is only in the Thaw 3 beta: `true` for the whole feature, or a sentence naming the part.
 * It is read off the release notes (2.0.0 says what it left for 2.1 and 3.0) and checked
 * against the 2.0.1 source. Several of these are in Thaw 2.1 as well, so the marks need
 * going over when 2.1.0 is the stable release.
 */
export const thawFeatures: { title: string; detail: string; beta?: true | string }[] = [
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
    beta: 'Recent items first and opening by letter are in the Thaw 3 beta.',
  },
  {
    title: 'Groups and folders',
    detail:
      'Group items so they move and hide as one, even across sections. Show a group as a folder with its own icon and colour.',
    beta: true,
  },
  {
    title: 'Profiles',
    detail:
      'Save a whole setup and switch in one step, or bind it to a display, a Space or a Focus. Thaw shows what a profile would change before you apply it.',
    beta: 'Binding a profile to a Space is in the Thaw 3 beta.',
  },
  {
    title: 'Zen mode',
    detail:
      'One shortcut hides every section and locks the ways to reveal them, then puts it all back. It can switch on by itself while you present or share your screen.',
    beta: true,
  },
  {
    title: 'Style the bar',
    detail:
      'Give the bar a shape, glass, a border, a shadow or a tint taken from your wallpaper. You can round the screen corners too, and keep a different look per Space or for light and dark.',
    beta: 'Rounded screen corners and a look per Space are in the Thaw 3 beta.',
  },
  {
    title: 'Scriptable',
    detail: 'Drive Thaw with thaw:// links from a launcher, a shortcut or a script.',
    beta: 'Shortcuts actions and Control Center controls are in the Thaw 3 beta.',
  },
  {
    title: 'A privacy pane',
    detail:
      'See what Thaw reads from your screen and every network call it makes, and switch them off.',
    beta: true,
  },
  {
    title: 'Layout editor',
    detail:
      'Arrange every item in one window, with the keyboard if you like. Rest on a tile and the item lights up in the real bar.',
    beta: 'The editor in its own window is in the Thaw 3 beta. Thaw 2 has a Layout pane in Settings.',
  },
];

/** The names in `thawAlso` that are only in the Thaw 3 beta, by the same reading. */
export const betaOnly = new Set([
  'Reveal on icon change',
  'Spacer items',
  'Stand-ins for Apple’s items',
  'Rounded corners',
  'Per-Space appearance',
  'Per-Space profiles',
  'Triggers for running apps',
  'Spotlight actions',
  'Controls in Control Center',
  'Shortcuts actions',
  'Simple Mode',
  'Open by letter',
  // Not in 2.0.1 either, by a reading of its source and not only its notes.
  'Swap shown and hidden',
  'Manual arrangement',
  'Layout backups',
  'Choose any item’s icon',
  'Adaptive gradient tint',
  'Gradient angle',
  'Live Activities stay visible',
]);

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
      'Light and dark looks',
    ],
  },
  {
    group: 'Profiles and automation',
    names: [
      'Per-Space profiles',
      'Focus Filter profiles',
      'Triggers for running apps',
      'Script hooks on profiles',
      'Spotlight actions',
      'Controls in Control Center',
    ],
  },
  {
    // Named with where to get each, since these live outside Thaw.
    group: 'Works with',
    names: [
      { name: 'Raycast, by its extension', href: 'https://www.raycast.com/diazdesandi/thaw' },
      { name: 'Droppy, as a Droplet', href: 'https://getdroppy.app/droplets#thaw' },
      { name: 'Floe, with no setup', href: '/docs/floe' },
      { name: 'thaw:// links from any app', href: '/docs/thaw/uri-schemes' },
      'Shortcuts actions',
    ],
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
