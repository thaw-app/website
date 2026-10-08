/** The state the mock desktop's pieces share. */

// 'notch' is Thaw's shape that parts around the camera housing.
export type ShapeKind = 'none' | 'full' | 'split' | 'notch';
export type TintKind = 'none' | 'solid' | 'gradient';

/** A cut-down version of what Thaw's Menu Bar Appearance settings store. */
export interface Appearance {
  shape: ShapeKind;
  ends: 'round' | 'square';
  tint: TintKind;
  /** Index into tints. */
  color: number;
  border: boolean;
  shadow: boolean;
}

// The real window's Appearance pane was captured with Split chosen.
export const defaultAppearance: Appearance = {
  shape: 'split',
  ends: 'round',
  tint: 'none',
  color: 0,
  border: false,
  shadow: false,
};

/** Tint colours on offer. `to` is the far end when the tint is a gradient. */
export const tints = [
  { name: 'Orange', from: '#ee8a2b', to: '#d6457f' },
  { name: 'Blue', from: '#1560e8', to: '#22b8cf' },
  { name: 'Green', from: '#2f9e6b', to: '#1560e8' },
  { name: 'Pink', from: '#d6457f', to: '#7a3fb0' },
  { name: 'Graphite', from: '#3a3f4b', to: '#0f1220' },
];

/** What a launcher command can do to the desktop around it. */
export type DesktopAction =
  | 'toggle-menu-bar'
  | 'open-settings'
  | 'open-floe-settings'
  | 'open-floe-about';

/**
 * Floe's settings, by id. The launcher reads `layout`, `fieldShape`, `border`
 * and `shadow`, the Dock reads `dock`, and `history` decides whether the
 * launcher keeps the searches that opened something; the others move but
 * change nothing here.
 */
export type FloeSettings = Record<string, boolean | string | number>;

// As Floe ships: see the defaults in its Settings.swift. One differs. Floe starts out
// of the Dock, but the Dock icon is how this desktop's launcher is first found, so here
// Show in Dock starts on.
export const defaultFloeSettings: FloeSettings = {
  login: false,
  dock: true,
  updates: true,
  downloads: false,
  root: 'After 90 seconds',
  skin: '👋',
  raycast: true,
  expansion: false,
  followThaw: false,
  layout: 'Extended',
  fieldShape: 'Rounded',
  separate: false,
  glass: 'Match System',
  dynamicTint: false,
  tint: 'None',
  tintOpacity: 50,
  border: true,
  borderWidth: 15,
  shadow: true,
  files: true,
  tabs: false,
  history: true,
  localAI: false,
  channel: 'Stable',
};

/** A recorded shortcut: its modifiers, the key's place on the keyboard, and the key's name. */
export interface Hotkey {
  control: boolean;
  option: boolean;
  shift: boolean;
  command: boolean;
  /** KeyboardEvent.code, which holding Option does not change. */
  code: string;
  label: string;
}

/** A web search with a keyword, as Floe's Quicklink. `{query}` in the URL is the search text. */
export interface Quicklink {
  id: number;
  name: string;
  keyword: string;
  url: string;
  isFallback: boolean;
  /** The SF Symbol's name, as the app stores it. */
  symbol: string;
}

export interface Snippet {
  id: number;
  name: string;
  keyword: string;
  text: string;
}

/**
 * What Floe keeps beside its settings: the lists its pages edit, the shortcuts
 * and aliases given to things, and the searches the launcher remembers. It all
 * lives in memory and is gone with the page.
 */
export interface FloeData {
  quicklinks: Quicklink[];
  snippets: Snippet[];
  /** By what they open: `open` is the launcher, `menu-bar` the menu bar search, an app by its name. */
  hotkeys: Record<string, Hotkey>;
  aliases: Record<string, string>;
  /** Searches that opened something, oldest first. */
  searches: string[];
  /** When Check Now last finished, in milliseconds; null before the first check. */
  lastChecked: number | null;
}

/**
 * The switches on Thaw's General pane, by id. The desktop reads `icon`,
 * `menus` and `right-click`; the others move but change nothing here.
 */
export type ThawSwitches = Record<string, boolean>;

export const defaultSwitches: ThawSwitches = {
  login: true,
  simple: false,
  descriptions: false,
  icon: true,
  menus: true,
  'right-click': true,
  live: true,
};

/**
 * A moment as both apps write one beside Check Now: the date abbreviated and
 * the time short, in the visitor's own locale.
 */
export function checkedAt(moment: number) {
  const date = new Date(moment);
  const day = date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const time = date.toLocaleTimeString(undefined, { timeStyle: 'short' });
  return `Last checked ${day} at ${time}`;
}

/** How long a check for updates appears to take, and how long its answer stays up. */
export const checkTiming = { checking: 1200, answer: 2600 };
