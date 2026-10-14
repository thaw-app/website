import { repoUrl } from './shared';

/**
 * What Floe's page leads with, in this order. Each is in Floe's README, worded
 * there at more length. What is planned and not built is on Floe's roadmap, not here.
 */
export const floeFeatures = [
  {
    title: 'One hotkey, one search',
    detail:
      'Apps, commands, quicklinks and System Settings panes, ranked by how often and how recently you use them. Give the ones you use most an alias, a hotkey or a place at the top.',
  },
  {
    title: 'Runs Raycast extensions',
    detail:
      'Unmodified, including the ones Raycast has already installed. An Extension Store page installs and updates them.',
  },
  {
    title: 'The basics, built in',
    detail:
      'Snippets, emoji, file search, calendar, a calculator with unit conversion, system commands, the menu bar’s items from the keyboard, and your shortcuts from Apple’s Shortcuts app, run by name once you turn that on.',
  },
  {
    title: 'Your own apps',
    detail:
      'Pick the terminal, editor, browser, notes app and clipboard manager you already use, and Floe hands work to them, down to a host from your SSH configuration, which opens in your terminal.',
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
 * two or three to a row leaves no cell empty. Each says what it is in a sentence, in the
 * words of Floe's README and release notes, which opens under its name
 * (components/hover-lines.tsx).
 */
export const floeAlso = [
  {
    group: 'Search',
    names: [
      {
        name: 'Aliases and hotkeys',
        about: 'Give an app or a command a short name or a key combination of its own.',
      },
      {
        name: 'Favorites',
        about: 'Mark the apps and commands you use most and they stay at the top.',
      },
      {
        name: 'Scopes',
        about:
          'Start with files, menu, tabs, windows, bookmarks or recent to search only that one place.',
      },
      {
        name: 'Window switcher',
        about: 'Type windows and a title to switch to an open window, minimise it or close it.',
      },
      {
        name: 'Bookmarks',
        about:
          'Type bookmarks and some text to find a bookmark in Chrome, Brave, Edge, Arc, Vivaldi, Dia or Helium.',
      },
      {
        name: 'Recent files of an app',
        about: 'Press Tab on an app to see the files you used lately that open in it.',
      },
      {
        name: 'Open browser tabs',
        about: 'Tabs open in Safari, Dia or Helium show in your results once you turn this on.',
      },
      {
        name: 'Web apps',
        about: 'Web apps you installed from a browser show up in the search too.',
      },
      {
        name: 'Search history',
        about: 'Press the Up arrow to bring back your last 50 searches that opened something.',
      },
      {
        name: 'Every keyword, listed',
        about: 'Type keywords or a question mark to see every word the search answers to.',
      },
    ],
  },
  {
    group: 'Commands',
    names: [
      { name: 'Shell commands', about: 'Type > and a command to run it in the background.' },
      {
        name: 'Saved commands',
        about: 'Save a command under a name and the search finds it afterwards.',
      },
      {
        name: 'Script commands',
        about:
          'Scripts written for Raycast, placed in Floe’s Scripts folder, show up in the search.',
      },
      { name: 'Manual pages', about: 'Type man and a program’s name to open its manual.' },
      {
        name: 'Actions menu',
        about:
          'Press Command-K on an app or a file to quit it, show it in Finder, open it with another app or move it to the Trash.',
      },
      {
        name: 'A picker for scripts',
        about: 'A script can hand Floe a list and get back the line you choose.',
      },
      {
        name: 'Checkpoints',
        about: 'Type pause and a name to save your open files, browser tabs and a note for later.',
      },
      {
        name: 'Receipts, with undo',
        about: 'Floe lists what it changed, and Return puts a file back from the Trash.',
      },
    ],
  },
  {
    group: 'Day to day',
    names: [
      {
        name: 'Reminders',
        about: 'Type remind and a sentence to add a reminder to Apple Reminders, with its date.',
      },
      {
        name: 'Calendar events',
        about: 'Type event and a sentence to add an event to Apple Calendar.',
      },
      {
        name: 'Timers',
        about:
          'Type timer 10 minutes to start a countdown that ends with a notification and a sound.',
      },
      {
        name: 'Contacts',
        about: 'Type contact and a name to find someone, then call, message or email them.',
      },
      {
        name: 'Mail and message drafts',
        about: 'Type mail or message to open a draft, and nothing is sent until you send it.',
      },
      {
        name: 'Notes, and daily notes',
        about: 'Type note and some text to save it to your notes app or add to today’s note.',
      },
    ],
  },
  {
    group: 'Built in',
    names: [
      {
        name: 'Calculator and unit conversion',
        about: 'Type a sum or a unit, such as 5 ft 10 in to cm, and get the answer.',
      },
      {
        name: 'Currency conversion',
        about:
          'Floe converts money with the European Central Bank’s daily rates once you turn that on.',
      },
      {
        name: 'Dictionary',
        about: 'Type define and a word to read its meaning from the dictionaries on your Mac.',
      },
      {
        name: 'Time in another city',
        about: 'Type time in tokyo, or time 5pm in berlin, to see the time somewhere else.',
      },
      {
        name: 'Something to paste',
        about: 'Type uuid, password 24 or lorem 3, and Return copies what Floe made.',
      },
      {
        name: 'Text changes',
        about:
          'Type base64, urlencode, uppercase or sha256 and some text to change it, or what you last copied.',
      },
      {
        name: 'Quick Look',
        about: 'Press Command-Y on a file to see it in Quick Look.',
      },
      {
        name: 'Snippets',
        about: 'Keep pieces of text you type often, and Floe expands them for you.',
      },
      { name: 'Quicklinks', about: 'Links you keep in Floe show up in the search.' },
      {
        name: 'Emoji and symbols',
        about: 'Find an emoji or a symbol by typing, in the skin tone you choose.',
      },
      {
        name: 'File search',
        about:
          'Find files by name. Turn on Fast file search and the ones you opened lately come first.',
      },
    ],
  },
  {
    group: 'System',
    names: [
      {
        name: 'Menu bar items',
        about: 'Search the menu bar’s items and open their menus from the keyboard.',
      },
      {
        name: 'Apple Shortcuts',
        about:
          'Run the shortcuts you made in Apple’s Shortcuts app by name, once you turn this on.',
      },
      {
        name: 'Media controls',
        about: 'Play, pause or skip tracks in Spotify or Music, and see what is playing.',
      },
      {
        name: 'Focus',
        about: 'Turn Focus on or off, or on for a set time, with a Shortcut you name in Settings.',
      },
      { name: 'Wi-Fi and Bluetooth', about: 'Turn Wi-Fi or Bluetooth on and off from the search.' },
      {
        name: 'Sleep, lock and volume',
        about: 'Put your Mac to sleep, lock it, or turn the volume up, down or off.',
      },
      {
        name: 'Quit a process',
        about: 'Type kill and a name to see the running programs that match and ask one to quit.',
      },
      {
        name: 'What is on a port',
        about: 'Type port and a number to see which program is listening on that network port.',
      },
      {
        name: 'The launcher’s look',
        about:
          'Pick a glass style, tint and shadow, or a compact layout that shows only the search field until you type.',
      },
    ],
  },
  {
    group: 'Extensions and AI',
    names: [
      {
        name: 'Extension Store',
        about:
          'Browse, install and update extensions from a page inside Floe, or find it by typing store.',
      },
      {
        name: 'Extension menu bar commands',
        about: 'You add an extension’s menu bar command yourself, and none starts on its own.',
      },
      {
        name: 'What each extension reached',
        about:
          'See the sites each extension contacted, the folders it touched and the programs it started.',
      },
      {
        name: 'Remove any extension',
        about:
          'Remove an extension whether Floe or Raycast installed it, and put it back from the Trash.',
      },
      {
        name: 'Extension sign-in',
        about:
          'Extensions sign in to GitHub and GitLab through their command line tools, and to others through the browser.',
      },
      {
        name: 'Follow-up questions',
        about:
          'Ask again after an answer and Floe keeps the earlier questions in mind until you close it.',
      },
      {
        name: 'Apple Intelligence',
        about: 'Let Apple Intelligence on your Mac answer what you ask.',
      },
      { name: 'All AI on your Mac', about: 'One switch keeps every AI answer on your Mac.' },
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

/**
 * What can answer Ask AI, as Floe's release notes list them: a command line tool you are
 * already signed in to, Apple Intelligence, or an OpenAI-compatible API, some of which run
 * on the Mac itself.
 */
export const floeAskAi = [
  {
    name: 'Claude',
    href: 'https://claude.com/product/claude-code',
    mark: 'claude',
  },
  {
    name: 'OpenAI',
    href: 'https://openai.com/codex',
    mark: 'openai',
  },
  { name: 'opencode', href: 'https://opencode.ai', mark: 'opencode' },
  { name: 'pi', href: 'https://pi.dev', mark: 'pi' },
  {
    name: 'Apple Intelligence',
    href: 'https://www.apple.com/apple-intelligence/',
    mark: 'apple-intelligence',
  },
  { name: 'Ollama', href: 'https://ollama.com', mark: 'ollama' },
  { name: 'LM Studio', href: 'https://lmstudio.ai', mark: 'lmstudio' },
  { name: 'OpenRouter', href: 'https://openrouter.ai', mark: 'openrouter' },
  { name: 'Z.ai', href: 'https://z.ai', mark: 'zai' },
];

export const floeDownload = `${repoUrl('floe')}/releases/latest`;
