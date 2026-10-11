import { repoUrl } from './shared';

/**
 * What Floe's page leads with, numbered in this order. Each is in Floe's README, worded
 * there at more length. What is planned and not built is on Floe's roadmap, not here.
 */
export const floeFeatures = [
  {
    title: 'One hotkey, one search',
    detail:
      'Apps, commands, quicklinks and System Settings panes, ranked by how often and how recently you use them. Give the ones you use most an alias or a hotkey.',
  },
  {
    title: 'Runs Raycast extensions',
    detail:
      'Unmodified, including the ones Raycast has already installed. An Extension Store page installs and updates them.',
  },
  {
    title: 'The basics, built in',
    detail:
      'Snippets, emoji, file search, calendar, a calculator with unit conversion, system commands, and your shortcuts from Apple’s Shortcuts app, run by name.',
  },
  {
    title: 'Your own apps',
    detail:
      'Pick the terminal, editor, browser, notes app and clipboard manager you already use, and Floe hands work to them.',
  },
  {
    title: 'Ask AI',
    detail:
      'Type ask and a question, and the answer shows in the launcher. You choose who answers, and a switch keeps all AI on your Mac.',
  },
  {
    title: 'Private',
    detail:
      'No analytics, no telemetry, no account. A Privacy page in Settings lists every permission and everything Floe contacts.',
  },
];

/**
 * Everything else, by name, filed under what it is for: taken from the full feature list
 * folded away in Floe's README, which the page leaves out as Thaw's does. Six groups, so
 * two or three to a row leaves no cell empty.
 */
export const floeAlso = [
  {
    group: 'Search',
    names: [
      'Aliases and hotkeys',
      'Favorites',
      'Scopes for files, menus and tabs',
      'Open browser tabs',
      'Web apps',
      'Search history',
    ],
  },
  {
    group: 'Commands',
    names: [
      'Shell commands',
      'Saved commands',
      'Script commands',
      'Manual pages',
      'Checkpoints',
      'Receipts, with undo',
    ],
  },
  {
    group: 'Day to day',
    names: [
      'Reminders',
      'Calendar events',
      'Timers',
      'Contacts',
      'Mail and message drafts',
      'Notes, and daily notes',
    ],
  },
  {
    group: 'Built in',
    names: [
      'Calculator and unit conversion',
      'Currency conversion',
      'Dictionary',
      'Snippets',
      'Quicklinks',
      'Emoji and symbols',
      'File search',
    ],
  },
  {
    group: 'System',
    names: [
      'Media controls',
      'Focus',
      'Wi-Fi and Bluetooth',
      'Sleep, lock and volume',
      'Quit a process',
      'What is on a port',
    ],
  },
  {
    group: 'Extensions and AI',
    names: [
      'Extension Store',
      'Extension menu bar commands',
      'What each extension reached',
      'Follow-up questions',
      'Apple Intelligence',
      'All AI on your Mac',
    ],
  },
];

/** What Floe works with: its sibling, and the extensions it runs. */
export const floeWorksWith = [
  { name: 'Thaw', how: 'Its actions, in the search', href: '/', mark: 'thaw' },
  {
    name: 'Raycast extensions',
    how: 'Unmodified',
    href: 'https://github.com/raycast/extensions',
    mark: 'raycast',
  },
];

export const floeDownload = `${repoUrl('floe')}/releases/latest`;
