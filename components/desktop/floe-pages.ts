import {
  Box,
  Hand,
  LayoutGrid,
  Link as LinkIcon,
  type LucideIcon,
  Paintbrush,
  Settings,
  ShoppingBag,
  TextQuote,
} from 'lucide-react';
import type { FloeData, FloeSettings, Quicklink } from './model';

// Each page's icon is Lucide's nearest to the SF Symbol the app uses (gearshape,
// square.grid.2x2, link, text.quote, bag, paintbrush, hand.raised, cube). SF Symbols
// are Apple's and cannot be served from a website.

export type Value = boolean | string | number;

/** One line of a settings group. `when` hides it until another setting is on. */
export type Row = { when?: (settings: FloeSettings) => boolean } & (
  | { kind: 'toggle'; id: string; label: string; detail?: string }
  | { kind: 'picker'; id: string; label: string; detail?: string; options: string[] }
  | { kind: 'segmented'; id: string; label: string; options: string[] }
  | { kind: 'hotkey'; id: string; label: string; detail?: string }
  | { kind: 'buttons'; label: string; detail?: string; buttons: string[] }
  | { kind: 'value'; label: string; detail?: string; text?: string }
  | { kind: 'field'; id: string; label: string; detail?: string; placeholder: string }
  | { kind: 'slider'; id: string; label: string; from: string; to: string }
  | { kind: 'note'; text: string }
);

export interface Section {
  title?: string;
  footer?: string;
  rows: Row[];
}

export interface Page {
  id: string;
  name: string;
  summary: string;
  icon: LucideIcon;
  sections?: Section[];
}

// Every name, line of help and choice below is the one in Floe's own settings (its
// SettingsView and the panes beside it), in the order the app shows them.
export const pages: Page[] = [
  {
    id: 'general',
    name: 'General',
    summary: 'Startup, hotkeys and built-in commands',
    icon: Settings,
    sections: [
      {
        title: 'Floe',
        rows: [
          { kind: 'hotkey', id: 'open', label: 'Open Floe' },
          { kind: 'toggle', id: 'login', label: 'Launch at Login' },
          { kind: 'toggle', id: 'dock', label: 'Show in Dock' },
          { kind: 'toggle', id: 'updates', label: 'Automatically check for updates' },
          {
            kind: 'picker',
            id: 'root',
            label: 'Return to root search',
            detail: 'How long a closed launcher keeps the command you had open.',
            options: ['Immediately', 'After 30 seconds', 'After 90 seconds', 'After 5 minutes'],
          },
          {
            kind: 'picker',
            id: 'skin',
            label: 'Emoji skin tone',
            options: ['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿'],
          },
        ],
      },
      {
        title: 'Menu Bar Items',
        rows: [
          {
            kind: 'hotkey',
            id: 'menu-bar',
            label: 'Search Menu Bar Items',
            detail: 'Find an item in the menu bar and open its menu.',
          },
          { kind: 'field', id: 'menu-bar', label: 'Alias', placeholder: 'None' },
        ],
      },
      {
        title: 'Your Settings',
        rows: [
          {
            kind: 'buttons',
            label: 'Settings file',
            detail:
              'Aliases, hotkeys, favorites, appearance and extension preferences. Passwords stay out.',
            buttons: ['Export…', 'Import…'],
          },
        ],
      },
      {
        title: 'Extensions',
        rows: [
          {
            kind: 'toggle',
            id: 'raycast',
            label: 'Include extensions installed in Raycast',
            detail: 'Reads ~/.config/raycast/extensions. Their Raycast settings don’t carry over.',
          },
          { kind: 'buttons', label: 'Extensions folder', buttons: ['Show in Finder'] },
          { kind: 'value', label: 'Runtime', text: 'Bun, bundled with the app' },
        ],
      },
      {
        title: 'Script Commands',
        rows: [
          { kind: 'buttons', label: 'Scripts folder', buttons: ['Show in Finder'] },
          { kind: 'buttons', label: 'New', buttons: ['New Script'] },
          {
            kind: 'note',
            text: 'No script commands yet. Scripts are executable files with @raycast metadata.',
          },
        ],
      },
    ],
  },
  {
    id: 'applications',
    name: 'Applications',
    summary: 'Aliases and hotkeys for apps',
    icon: LayoutGrid,
  },
  {
    id: 'quicklinks',
    name: 'Quicklinks',
    summary: 'Keywords and fallbacks for web search',
    icon: LinkIcon,
  },
  {
    id: 'snippets',
    name: 'Snippets',
    summary: 'Text you paste or type by keyword',
    icon: TextQuote,
    sections: [
      {
        title: 'Expansion',
        footer:
          'Type a snippet’s keyword in any app and Floe replaces it with the snippet. Needs Accessibility. Password fields are skipped.',
        rows: [{ kind: 'toggle', id: 'expansion', label: 'Expand keywords as you type' }],
      },
    ],
  },
  {
    id: 'store',
    name: 'Extension Store',
    summary: 'Install extensions from the Raycast store',
    icon: ShoppingBag,
  },
  {
    id: 'appearance',
    name: 'Appearance',
    summary: 'Tint, border and shadow for the launcher',
    icon: Paintbrush,
    sections: [
      {
        title: 'Thaw',
        rows: [{ kind: 'toggle', id: 'followThaw', label: 'Follow Thaw’s menu bar appearance' }],
      },
      {
        title: 'Layout',
        rows: [
          {
            kind: 'segmented',
            id: 'layout',
            label: 'Launcher layout',
            options: ['Extended', 'Compact'],
          },
          {
            kind: 'note',
            text: 'Extended always shows the list. Compact shows only the search bar until you type.',
          },
          {
            kind: 'segmented',
            id: 'fieldShape',
            label: 'Search field shape',
            options: ['Rounded', 'Capsule', 'Square'],
          },
          {
            kind: 'toggle',
            id: 'separate',
            label: 'Separate the search field from the results',
          },
          {
            kind: 'note',
            text: 'The search field is its own piece of glass, and the results are a second piece below it.',
          },
        ],
      },
      {
        title: 'Glass',
        rows: [
          {
            kind: 'picker',
            id: 'glass',
            label: 'Effect',
            options: ['Match System', 'Regular', 'Clear', 'Liquid Glass', 'Dynamic Glass'],
          },
        ],
      },
      {
        title: 'Tint',
        rows: [
          { kind: 'toggle', id: 'dynamicTint', label: 'Separate light and dark tints' },
          { kind: 'segmented', id: 'tint', label: 'Tint', options: ['None', 'Solid', 'Gradient'] },
          {
            kind: 'slider',
            id: 'tintOpacity',
            label: 'Opacity',
            from: '5%',
            to: '100%',
            when: (settings) => settings.tint !== 'None',
          },
        ],
      },
      {
        title: 'Border',
        rows: [
          { kind: 'toggle', id: 'border', label: 'Draw a border' },
          {
            kind: 'slider',
            id: 'borderWidth',
            label: 'Width',
            from: '0.5 pt',
            to: '4 pt',
            when: (settings) => settings.border === true,
          },
        ],
      },
      { title: 'Shadow', rows: [{ kind: 'toggle', id: 'shadow', label: 'Drop shadow' }] },
    ],
  },
  {
    id: 'privacy',
    name: 'Privacy',
    summary: 'Permissions and what Floe contacts',
    icon: Hand,
    sections: [
      {
        title: 'Permissions',
        rows: [
          {
            kind: 'buttons',
            label: 'Accessibility',
            detail:
              'Find the items in your menu bar and read their names. Open an item’s menu when you pick it in the search.',
            buttons: ['Grant Access'],
          },
        ],
      },
      {
        title: 'Search Sources',
        rows: [
          {
            kind: 'toggle',
            id: 'files',
            label: 'Files',
            detail:
              'Adds up to three files that Spotlight finds by name. The search runs on this Mac and nothing leaves it. Type “files” and a name to see every match.',
          },
          {
            kind: 'toggle',
            id: 'tabs',
            label: 'Browser Tabs',
            detail:
              'Asks each running browser for its open tabs and matches their titles and addresses. macOS asks for permission the first time, once per browser. The list stays on this Mac.',
          },
          {
            kind: 'value',
            label: 'SSH Hosts',
            detail:
              'Floe reads the host names in your SSH configuration to find them in the search, and connects by handing the name to your terminal.',
          },
        ],
      },
      {
        title: 'Search History',
        rows: [
          {
            kind: 'toggle',
            id: 'history',
            label: 'Remember searches',
            detail:
              'The last 50 searches that opened something are kept on this Mac, and the Up arrow in an empty search brings them back. Switching this off forgets them.',
          },
          { kind: 'buttons', label: 'Remembered searches', buttons: ['Forget Them'] },
        ],
      },
      {
        title: 'Network Access',
        rows: [
          { kind: 'toggle', id: 'updates', label: 'Automatically check for updates' },
          {
            kind: 'toggle',
            id: 'localAI',
            label: 'Only use AI that runs on this Mac',
            detail:
              'A source that sends questions elsewhere is refused, for Ask AI and for extensions. Nothing else is asked in its place.',
          },
        ],
      },
    ],
  },
  {
    id: 'about',
    name: 'About',
    summary: 'Version, updates and credits',
    icon: Box,
  },
];

/**
 * What About says of the build: the version and build number of the Floe this
 * was written against (/Applications/Floe.app's Info.plist), and the commit it
 * was built from.
 */
export const build = [
  ['Version', '0.1.0'],
  ['Build', '1'],
  ['Commit', 'aba0464'],
];

/** The choices of About's "Automatic updates", in the app's order (UpdateLogic.swift). */
export const automaticUpdates = ['Off', 'Check only', 'Check and download'];

/** The web searches Floe starts with (QuicklinkStore.defaults), Google alone as a fallback. */
const defaultQuicklinks: Quicklink[] = [
  ['Google', 'g', 'https://www.google.com/search?q={query}', 'magnifyingglass'],
  ['DuckDuckGo', 'ddg', 'https://duckduckgo.com/?q={query}', 'magnifyingglass.circle'],
  [
    'GitHub',
    'gh',
    'https://github.com/search?q={query}',
    'chevron.left.forwardslash.chevron.right',
  ],
  ['YouTube', 'yt', 'https://www.youtube.com/results?search_query={query}', 'play.rectangle'],
  ['Wikipedia', 'wiki', 'https://en.wikipedia.org/wiki/Special:Search?search={query}', 'book'],
  ['Apple Maps', 'maps', 'maps://?q={query}', 'map'],
  ['Translate', 'tr', 'https://translate.google.com/?text={query}', 'translate'],
].map(([name, keyword, url, symbol], id) => ({
  id,
  name,
  keyword,
  url,
  symbol,
  isFallback: id === 0,
}));

/** What Floe holds beside its settings when it is first opened. */
export const defaultFloeData: FloeData = {
  quicklinks: defaultQuicklinks,
  snippets: [],
  // Control-Option-Space opens Floe until another shortcut is recorded (defaultToggleHotkey).
  hotkeys: {
    open: {
      control: true,
      option: true,
      shift: false,
      command: false,
      code: 'Space',
      label: 'Space',
    },
  },
  aliases: {},
  searches: [],
  lastChecked: null,
};

export const apps = ['Calculator', 'Calendar', 'Finder', 'Floe', 'Mail', 'Notes', 'Safari', 'Thaw'];
