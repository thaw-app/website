import { links } from './shared';

/**
 * What the home page leads with, most important first.
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
 * can be looked up, and with what it works alongside. Each says what it is in a sentence,
 * taken from the release notes and the app's own settings, which opens under its name
 * (components/hover-lines.tsx).
 */
export const thawAlso: { group: string; names: (string | { name: string; about: string })[] }[] = [
  {
    group: 'Revealing',
    names: [
      {
        name: 'Reveal on click',
        about: 'Click an empty part of the menu bar to show hidden items.',
      },
      {
        name: 'Reveal on hover',
        about: 'Hidden items appear when you rest the pointer on an empty part of the menu bar.',
      },
      { name: 'Reveal on scroll', about: 'Scroll or swipe in the menu bar to show hidden items.' },
      {
        name: 'Reveal on icon change',
        about: 'A hidden item shows briefly when its icon changes, so you see its alert.',
      },
      {
        name: 'Automatic rehiding',
        about: 'Shown items hide again after a set time, or when you click away or switch apps.',
      },
      {
        name: 'Hide app menus on reveal',
        about: 'The current app’s menus move out of the way when shown items need the room.',
      },
      {
        name: 'Swap shown and hidden',
        about:
          'One press trades the items in view with the hidden ones, and another trades them back.',
      },
      {
        name: 'Open hidden items in the menu bar',
        about: 'A hidden item shows in the menu bar and opens its menu under its own icon.',
      },
    ],
  },
  {
    group: 'Layout',
    names: [
      {
        name: 'Manual arrangement',
        about: 'You drag items into place yourself, and Thaw only hides and shows them.',
      },
      {
        name: 'Spacer items',
        about: 'Add gaps between items, pick their width, and drag them like any item.',
      },
      {
        name: 'An always-hidden section',
        about: 'A second hidden section keeps items out of view until you ask for them.',
      },
      { name: 'Per-display spacing', about: 'Set how far apart items sit on each display.' },
      {
        name: 'Layout backups',
        about:
          'Thaw saves your item positions before a reset, and you can restore them from Settings.',
      },
      {
        name: 'Stand-ins for Apple’s items',
        about:
          'Thaw swaps Apple items it can’t hide, like Time Machine, for icons you can move or hide.',
      },
      {
        name: 'Choose any item’s icon',
        about: 'Pick the picture Thaw shows for an item when it has none of its own to show.',
      },
    ],
  },
  {
    group: 'Appearance',
    names: [
      {
        name: 'Adaptive gradient tint',
        about: 'The bar takes a gradient from the two main colours of your wallpaper.',
      },
      { name: 'Gradient angle', about: 'A slider sets the direction a gradient runs in.' },
      {
        name: 'Rounded corners',
        about: 'Thaw draws black over the corners of every display so they look rounded.',
      },
      { name: 'Menu bar shadow', about: 'Switch on a shadow for the shape you give the bar.' },
      { name: 'Per-Space appearance', about: 'Give each Space its own look for the bar.' },
      {
        name: 'Show or hide the bar per Space',
        about: 'Hide the menu bar on one Space while your other Spaces keep theirs.',
      },
      {
        name: 'Light and dark looks',
        about: 'Set one look for Light Mode and another for Dark Mode.',
      },
    ],
  },
  {
    group: 'Profiles',
    names: [
      {
        name: 'Per-display profiles',
        about: 'Assign a profile to each display, and Thaw switches when your displays change.',
      },
      {
        name: 'Per-Space profiles',
        about: 'Assign a profile to a Space, and Thaw uses it while you’re there.',
      },
      {
        name: 'Focus Filter profiles',
        about: 'Thaw switches to a profile when a Focus starts and goes back when it ends.',
      },
      {
        name: 'Script hooks on profiles',
        about: 'Run a script of your own before or after a profile switch.',
      },
      { name: 'Profile hotkeys', about: 'Set a keyboard shortcut that switches to a profile.' },
    ],
  },
  {
    group: 'Automation',
    names: [
      {
        name: 'Triggers for running apps',
        about: 'Chosen items show while an app is running and go back when it quits.',
      },
      {
        name: 'Spotlight actions',
        about: 'Show hidden items, open an item or switch profile from Spotlight.',
      },
      {
        name: 'Controls in Control Center',
        about: 'Add controls to Control Center that show hidden items or turn Zen Mode on and off.',
      },
    ],
  },
  {
    group: 'Everyday',
    names: [
      {
        name: 'Simple Mode',
        about: 'Settings becomes one page of essentials, and everything else keeps working.',
      },
      {
        name: 'Live Activities stay visible',
        about:
          'Live Activities and the camera indicator stay on the menu bar while apps are hidden.',
      },
      {
        name: 'Open by letter',
        about: 'Press a shortcut, each item gets a letter, and typing a letter clicks that item.',
      },
      { name: 'Settings search', about: 'Type in the Settings toolbar to find any setting.' },
      { name: 'Tooltips', about: 'Rest the pointer on a menu bar item to see its name.' },
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
