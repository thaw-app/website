'use client';

import './floe-window.css';
import {
  Book,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Ellipsis,
  Hand,
  Languages,
  ListFilter,
  type LucideIcon,
  MapIcon,
  PanelLeft,
  Search,
  SquarePlay,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { docsRoute, products, repoUrl, links as siteLinks } from '@/lib/shared';
import { HotkeyRecorder, hotkeyText } from './floe-controls';
import {
  apps,
  automaticUpdates,
  build,
  pages,
  type Row,
  type Section,
  type Value,
} from './floe-pages';
import {
  checkedAt,
  checkTiming,
  type FloeData,
  type FloeSettings,
  type Hotkey,
  type Quicklink,
  type Snippet,
} from './model';
import {
  Alert,
  type AlertButton,
  dim,
  divided,
  Field,
  glass,
  group,
  Menu,
  PopUp,
  pushDefault,
  push as pushFace,
  ring,
  SearchField,
  Sheet,
  SidebarRow,
  Switch,
  ToolbarTitle,
  TrafficLights,
} from './thaw-ui';

const floeRepo = repoUrl('floe');
// Where the app's own links lead (FloeLinks in its Info.plist).
const links = {
  discord: siteLinks.discord,
  raycastExtensions: 'https://github.com/raycast/extensions',
  sponsor: 'https://github.com/sponsors/diazdesandi',
  thaw: repoUrl('thaw'),
  // The app opens its Acknowledgements window, which is this file drawn as a page.
  credits: `${floeRepo}/blob/${products.floe.branch}/CREDITS.md`,
};

/** A push button at the size Floe's forms set theirs. */
const push = `${pushFace} px-2.5 py-[3px] text-[12px]`;
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

/** The heading over a group of settings. */
function GroupTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 px-2.5 text-[13px] font-bold">{children}</h3>;
}

// Lucide's nearest to the SF Symbols the built-in quicklinks use. A symbol typed into the
// editor that is not one of these draws nothing, as a name SF Symbols does not have would.
const symbols: Record<string, LucideIcon> = {
  magnifyingglass: Search,
  'magnifyingglass.circle': Search,
  'chevron.left.forwardslash.chevron.right': Code,
  'play.rectangle': SquarePlay,
  book: Book,
  map: MapIcon,
  translate: Languages,
};

/** The orange tile a quicklink is shown on (QuicklinkTile). */
function QuicklinkTile({ symbol }: { symbol: string }) {
  const Icon = symbols[symbol];
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-linear-to-b from-[#ffad42] to-[#ff9500] text-white">
      {Icon && <Icon aria-hidden className="size-3" />}
    </span>
  );
}

/** Why a quicklink cannot be saved yet, in the app's words; null when it can. */
function quicklinkProblem(draft: Quicklink, all: Quicklink[]) {
  const keyword = draft.keyword.trim();
  if (!draft.name.trim()) return 'Enter a name.';
  if (!keyword) return 'Enter a keyword.';
  if (/\s/.test(keyword)) return 'Keywords cannot contain spaces.';
  if (all.some((link) => link.id !== draft.id && link.keyword === keyword)) {
    return 'That keyword is already used.';
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(draft.url)) return 'Enter a URL with a scheme, like https://.';
  return null;
}

/** Why a snippet's keyword cannot be used, in the app's words; null when it can. */
function keywordProblem(draft: Snippet, all: Snippet[]) {
  const keyword = draft.keyword.trim();
  if (keyword.length < 2) return 'Keywords need at least 2 characters.';
  if (/\s/.test(keyword)) return 'Keywords can’t contain spaces.';
  if (all.some((snippet) => snippet.id !== draft.id && snippet.keyword === keyword)) {
    return 'Another snippet uses that keyword.';
  }
  return null;
}

/** An object with its keys in order all the way down, as the app writes its export. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, inner]) => [key, sorted(inner)]),
    );
  }
  return value;
}

function isHotkey(value: unknown): value is Hotkey {
  const hotkey = value as Hotkey | null;
  return (
    !!hotkey &&
    typeof hotkey === 'object' &&
    typeof hotkey.code === 'string' &&
    typeof hotkey.label === 'string' &&
    [hotkey.control, hotkey.option, hotkey.shift, hotkey.command].every(
      (held) => typeof held === 'boolean',
    )
  );
}

type OpenSheet =
  | { kind: 'quicklink'; draft: Quicklink; isNew: boolean }
  | { kind: 'snippet'; draft: Snippet; isNew: boolean };

interface OpenAlert {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface FloeWindowProps {
  /** Shrinks the whole window to fit a small desktop; 1 is its real size. */
  scale: number;
  /** Spread on the strip the window is dragged by. */
  dragProps: HTMLAttributes<HTMLDivElement>;
  /** The page shown, which the desktop keeps so a closed window reopens where it was left. */
  pageId: string;
  onPage: (id: string) => void;
  settings: FloeSettings;
  onChange: (id: string, value: Value) => void;
  data: FloeData;
  onData: (change: (current: FloeData) => FloeData) => void;
  /** Called for a control that has nothing behind it here, with its name. */
  onInert: (name: string) => void;
  /** Says a line of its own in the same place. */
  onNotice: (message: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

/**
 * Floe's settings window, written from its source: 820 by 560 with a sidebar
 * of 210, the same grouped forms Thaw's settings use, and every page, name and
 * line of help the app has. What Appearance sets is what the launcher on this
 * desktop wears, and the lists edited here are the ones the launcher searches.
 */
export function FloeWindow({
  scale,
  dragProps,
  pageId,
  onPage,
  settings,
  onChange,
  data,
  onData,
  onInert,
  onNotice,
  onClose,
  onMinimize,
}: FloeWindowProps) {
  const page = pages.find((entry) => entry.id === pageId) ?? pages[0];
  // The toolbar's first button slides the sidebar away and back, as a split view's does.
  const [sidebarShown, setSidebarShown] = useState(true);
  const [sheet, setSheet] = useState<OpenSheet | null>(null);
  const [alert, setAlert] = useState<OpenAlert | null>(null);
  const closeAlert = useCallback(() => setAlert(null), []);

  // Applications: what is typed in its filter, and the app picked from its list.
  const [filter, setFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  // Privacy: Forget Them has done its work until the page is opened again.
  const [forgot, setForgot] = useState(false);
  // About: the copy button's tick, the check for updates, and the "more" menu.
  const [copied, setCopied] = useState(false);
  const [check, setCheck] = useState<'idle' | 'checking' | 'answered'>('idle');
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (run: () => void, after: number) => {
    timers.current.push(setTimeout(run, after));
  };
  const fileRef = useRef<HTMLInputElement>(null);

  function goTo(id: string) {
    setForgot(false);
    onPage(id);
  }

  function setHotkey(id: string, hotkey: Hotkey | undefined) {
    onData((current) => {
      const hotkeys = { ...current.hotkeys };
      if (hotkey) hotkeys[id] = hotkey;
      else delete hotkeys[id];
      return { ...current, hotkeys };
    });
  }

  function setAlias(id: string, alias: string) {
    onData((current) => {
      const aliases = { ...current.aliases };
      if (alias) aliases[id] = alias;
      else delete aliases[id];
      return { ...current, aliases };
    });
  }

  function toggle(id: string) {
    const on = settings[id] !== true;
    onChange(id, on);
    // Switching the history off forgets what it held, as the app does.
    if (id === 'history' && !on) onData((current) => ({ ...current, searches: [] }));
  }

  // ---- Your Settings: the export is a file the browser saves, the import one it reads. ----

  function exportSettings() {
    const { open, ...commandHotkeys } = data.hotkeys;
    const archive = sorted({
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: { ...settings, aliases: data.aliases, commandHotkeys, toggleHotkey: open ?? null },
      extensionPreferences: {},
      secretKeys: {},
    });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Floe Settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importSettings(file: File) {
    const failed = (message: string) =>
      setAlert({ title: 'Couldn’t transfer settings', message, buttons: [{ label: 'OK' }] });
    let archive: Record<string, unknown> | null = null;
    try {
      archive = JSON.parse(await file.text());
    } catch {
      // Not JSON at all: said below, as any file that is not an export.
    }
    const incoming = archive?.settings;
    if (
      !archive ||
      typeof archive.version !== 'number' ||
      !incoming ||
      typeof incoming !== 'object'
    ) {
      failed('This file isn’t a Floe settings export.');
      return;
    }
    if (archive.version > 1) {
      failed('This file was exported by a newer version of Floe.');
      return;
    }
    const stored = incoming as Record<string, unknown>;
    const aliases = Object.fromEntries(
      Object.entries((stored.aliases as object | undefined) ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
    const hotkeys = Object.fromEntries(
      Object.entries((stored.commandHotkeys as object | undefined) ?? {}).filter(
        (entry): entry is [string, Hotkey] => isHotkey(entry[1]),
      ),
    );
    if (isHotkey(stored.toggleHotkey)) hotkeys.open = stored.toggleHotkey;
    const favorites = Array.isArray(stored.favorites) ? stored.favorites.length : 0;
    const extensions = Object.keys((archive.extensionPreferences as object | undefined) ?? {});

    setAlert({
      title: 'Replace your settings?',
      message:
        'Aliases, hotkeys, favorites and appearance are replaced by the file’s. Passwords aren’t included in exports.',
      buttons: [
        {
          label: 'Replace',
          kind: 'destructive',
          onPick() {
            // Only settings this window has, and only values of the kind they hold.
            for (const [id, value] of Object.entries(settings)) {
              const next = stored[id];
              if (typeof next === typeof value) onChange(id, next as Value);
            }
            onData((current) => ({ ...current, aliases, hotkeys }));
            // After this alert has closed, so the next one is not closed with it.
            later(
              () =>
                setAlert({
                  title: 'Settings imported',
                  message: `${Object.keys(aliases).length} aliases, ${Object.keys(hotkeys).length} hotkeys, ${favorites} favorites, preferences for ${extensions.length} extensions.`,
                  buttons: [{ label: 'OK', kind: 'default' }],
                }),
              0,
            );
          },
        },
        { label: 'Cancel' },
      ],
    });
  }

  /** What a button in a form does, by the name on it. */
  function press(name: string, row: Row & { kind: 'buttons' }) {
    if (name === 'Export…') exportSettings();
    else if (name === 'Import…') fileRef.current?.click();
    else if (name === 'Forget Them') {
      onData((current) => ({ ...current, searches: [] }));
      setForgot(true);
    }
    // The rest reach into the Mac itself: Finder, a file on disk, a permission.
    else if (name === 'Show in Finder') onInert(`Showing the ${row.label} in Finder`);
    else if (name === 'New Script') onInert('Writing a script to the Scripts folder');
    else if (name === 'Grant Access') onInert(`Granting ${row.label}`);
    else onInert(name.replace('…', ''));
  }

  function control(row: Row): ReactNode {
    switch (row.kind) {
      case 'toggle':
        return (
          <Switch
            on={settings[row.id] === true}
            label={row.label}
            onChange={() => toggle(row.id)}
          />
        );
      case 'picker':
        return (
          <PopUp
            label={row.label}
            options={row.options}
            chosen={String(settings[row.id])}
            onChoose={(option) => onChange(row.id, option)}
          />
        );
      case 'segmented':
        return (
          <fieldset className="flex rounded-[7px] bg-black/[0.06] p-0.5 dark:bg-white/[0.08]">
            <legend className="sr-only">{row.label}</legend>
            {row.options.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={settings[row.id] === option}
                onClick={() => onChange(row.id, option)}
                className={`rounded-[5px] px-3 py-[3px] text-[12px] ${ring} ${
                  settings[row.id] === option
                    ? 'bg-white shadow-sm dark:bg-white/[0.22]'
                    : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                {option}
              </button>
            ))}
          </fieldset>
        );
      case 'hotkey':
        return (
          <HotkeyRecorder
            label={row.label}
            value={data.hotkeys[row.id]}
            onChange={(hotkey) => setHotkey(row.id, hotkey)}
          />
        );
      case 'buttons':
        return (
          <span className="flex gap-2">
            {row.buttons.map((name) => (
              <button
                key={name}
                type="button"
                // As the app: nothing to forget once it is forgotten, or while nothing is kept.
                disabled={name === 'Forget Them' && (settings.history !== true || forgot)}
                onClick={() => press(name, row)}
                className={push}
              >
                {name}
              </button>
            ))}
          </span>
        );
      case 'value':
        return row.text ? <span className={dim}>{row.text}</span> : null;
      case 'field':
        return (
          <input
            aria-label={row.label}
            value={data.aliases[row.id] ?? ''}
            placeholder={row.placeholder}
            onChange={(event) => setAlias(row.id, event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`w-40 rounded-[5px] bg-transparent px-1.5 py-0.5 text-right select-text placeholder:text-black/55 dark:placeholder:text-white/50 ${ring}`}
          />
        );
      case 'slider':
        return (
          <span className={`flex items-center gap-2 text-[11px] ${dim}`}>
            {row.from}
            <input
              type="range"
              min={0}
              max={100}
              aria-label={row.label}
              value={Number(settings[row.id] ?? 50)}
              onChange={(event) => onChange(row.id, Number(event.target.value))}
              className="w-40 accent-(--accent)"
            />
            {row.to}
          </span>
        );
      default:
        return null;
    }
  }

  function line(row: Row) {
    if (row.kind === 'note') {
      return (
        <p key={row.text} className={`py-2 text-[11px] leading-[14px] ${dim}`}>
          {row.text}
        </p>
      );
    }
    return (
      <div
        key={row.label + row.kind}
        className="flex min-h-[37px] items-center justify-between gap-6 py-2"
      >
        <div className="min-w-0">
          <p>{row.label}</p>
          {'detail' in row && row.detail && (
            <p className={`mt-0.5 text-[11px] leading-[14px] ${dim}`}>{row.detail}</p>
          )}
        </div>
        <div className="shrink-0">{control(row)}</div>
      </div>
    );
  }

  function form(sections: Section[]) {
    return sections.map((section) => (
      <section key={section.title ?? 'untitled'} className="mb-5">
        {section.title && <GroupTitle>{section.title}</GroupTitle>}
        <div className={`${group} ${divided} px-2.5`}>
          {section.rows.filter((row) => !row.when || row.when(settings)).map(line)}
        </div>
        {section.footer && (
          <p className={`mt-1.5 px-2.5 text-[11px] leading-[14px] ${dim}`}>{section.footer}</p>
        )}
      </section>
    ));
  }

  // The pages that are not plain forms.
  let body: ReactNode;
  if (page.id === 'applications') {
    const shown = apps.filter((name) => name.toLowerCase().includes(filter.trim().toLowerCase()));
    const icon = (name: string, size: string, selected = false) =>
      name === 'Thaw' || name === 'Floe' ? (
        <Image
          src={name === 'Thaw' ? products.thaw.icon : products.floe.icon}
          alt=""
          className={size}
        />
      ) : (
        <span
          className={`${size} shrink-0 rounded-[4px] ${
            selected ? 'bg-white/30' : 'bg-black/[0.12] dark:bg-white/[0.16]'
          }`}
        />
      );
    body = (
      <div className="-mx-5 -mt-4">
        {selectedApp ? (
          // The editing controls exist only for the app picked from the list.
          <section className="h-[170px] px-5 pt-4">
            <h3 className="mb-2 flex items-center gap-1.5 px-2.5 text-[13px] font-bold">
              {icon(selectedApp, 'size-3.5')}
              {selectedApp}
            </h3>
            <div className={`${group} ${divided} px-2.5`}>
              <Field
                label="Alias"
                value={data.aliases[selectedApp] ?? ''}
                placeholder="None"
                onChange={(alias) => setAlias(selectedApp, alias)}
              />
              <div className="flex min-h-[37px] items-center justify-between gap-6 py-2">
                <div>
                  <p>Hotkey</p>
                  <p className={`mt-0.5 text-[11px] leading-[14px] ${dim}`}>
                    Opens the app, or hides it if it’s already in front.
                  </p>
                </div>
                <HotkeyRecorder
                  label={`Hotkey for ${selectedApp}`}
                  value={data.hotkeys[selectedApp]}
                  onChange={(hotkey) => setHotkey(selectedApp, hotkey)}
                />
              </div>
            </div>
          </section>
        ) : (
          <p className={`flex h-16 items-center justify-center ${dim}`}>
            Select an app to give it an alias or a hotkey.
          </p>
        )}
        <label
          className={`flex items-center gap-1.5 border-y border-black/[0.08] px-6 py-1.5 dark:border-white/[0.09] ${dim}`}
        >
          <ListFilter aria-hidden className="size-3.5 shrink-0" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter applications"
            aria-label="Filter applications"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-black/85 outline-none select-text placeholder:text-black/55 dark:text-white/[0.87] dark:placeholder:text-white/50"
          />
        </label>
        <ul className="px-3 py-1.5">
          {shown.map((name) => (
            <li key={name}>
              <button
                type="button"
                aria-pressed={name === selectedApp}
                onClick={() => setSelectedApp(name === selectedApp ? null : name)}
                className={`flex h-7 w-full items-center gap-2.5 rounded-[6px] px-3 text-left ${ring} ${
                  name === selectedApp ? 'bg-(--accent) text-(--on-accent)' : ''
                }`}
              >
                {icon(name, 'size-[18px]', name === selectedApp)}
                <span className="flex-1 truncate">{name}</span>
                {data.aliases[name] && (
                  <kbd
                    className={`rounded-[5px] px-1.5 py-[2px] font-sans text-[11px] ${
                      name === selectedApp ? 'bg-white/20' : 'bg-black/[0.08] dark:bg-white/[0.12]'
                    }`}
                  >
                    {data.aliases[name]}
                  </kbd>
                )}
                {data.hotkeys[name] && (
                  <span className={`tabular-nums ${name === selectedApp ? 'text-white/80' : dim}`}>
                    {hotkeyText(data.hotkeys[name])}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
            <Search aria-hidden className={`mb-1 size-8 ${dim}`} />
            <p className="text-[15px] font-bold">No Results for “{filter.trim()}”</p>
            <p className={`text-[11px] ${dim}`}>Check the spelling or try a new search.</p>
          </div>
        )}
      </div>
    );
  } else if (page.id === 'quicklinks') {
    const fallbacks = data.quicklinks.filter((link) => link.isFallback);
    // One place up or down among all the quicklinks, which is how the app's store moves one.
    const move = (link: Quicklink, by: number) =>
      onData((current) => {
        const from = current.quicklinks.findIndex((other) => other.id === link.id);
        const to = Math.min(Math.max(from + by, 0), current.quicklinks.length - 1);
        if (from < 0 || to === from) return current;
        const quicklinks = current.quicklinks.filter((other) => other.id !== link.id);
        quicklinks.splice(to, 0, link);
        return { ...current, quicklinks };
      });
    const arrow = `${push} flex size-[22px] items-center justify-center px-0`;
    body = (
      <>
        <section className="mb-5">
          <GroupTitle>Quicklinks</GroupTitle>
          <div className={`${group} ${divided} px-2.5`}>
            {data.quicklinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2.5 py-2">
                <QuicklinkTile symbol={link.symbol} />
                <div className="min-w-0 flex-1">
                  <p>{link.name}</p>
                  <p className={`text-[10px] leading-[13px] ${dim}`}>{link.keyword}</p>
                  <p className={`truncate text-[10px] leading-[13px] ${dim}`}>{link.url}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${link.name}`}
                  onClick={() => setSheet({ kind: 'quicklink', draft: link, isNew: false })}
                  className={push}
                >
                  Edit
                </button>
              </div>
            ))}
            <div className="flex h-[37px] items-center">
              <button
                type="button"
                onClick={() =>
                  setSheet({
                    kind: 'quicklink',
                    isNew: true,
                    draft: {
                      id: Date.now(),
                      name: '',
                      keyword: '',
                      url: 'https://',
                      isFallback: false,
                      symbol: 'magnifyingglass',
                    },
                  })
                }
                className={push}
              >
                New Quicklink
              </button>
            </div>
          </div>
        </section>
        <section className="mb-5">
          <GroupTitle>Fallbacks</GroupTitle>
          {fallbacks.length > 0 && (
            <div className={`${group} ${divided} px-2.5`}>
              {fallbacks.map((link, index) => (
                <div key={link.id} className="flex h-[37px] items-center gap-2.5">
                  <QuicklinkTile symbol={link.symbol} />
                  <span className="flex-1">{link.name}</span>
                  <button
                    type="button"
                    aria-label={`Move ${link.name} up`}
                    disabled={index === 0}
                    onClick={() => move(link, -1)}
                    className={arrow}
                  >
                    <ChevronUp aria-hidden className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${link.name} down`}
                    disabled={index === fallbacks.length - 1}
                    onClick={() => move(link, 1)}
                    className={arrow}
                  >
                    <ChevronDown aria-hidden className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className={`mt-1.5 px-2.5 text-[11px] ${dim}`}>
            Shown under your results when you search.
          </p>
        </section>
      </>
    );
  } else if (page.id === 'snippets') {
    body = (
      <>
        {form(page.sections ?? [])}
        <section className="mb-5">
          <GroupTitle>Snippets</GroupTitle>
          <div className={`${group} ${divided} px-2.5`}>
            {data.snippets.length === 0 && (
              <p className={`flex h-[37px] items-center ${dim}`}>No snippets yet.</p>
            )}
            {data.snippets.map((snippet) => (
              <button
                key={snippet.id}
                type="button"
                onClick={() => setSheet({ kind: 'snippet', draft: snippet, isNew: false })}
                className={`flex min-h-[37px] w-full items-center justify-between gap-6 rounded-[5px] py-2 text-left ${ring}`}
              >
                <span className="min-w-0">
                  <span className="block">{snippet.name}</span>
                  <span className={`mt-0.5 block truncate text-[11px] leading-[14px] ${dim}`}>
                    {snippet.text.split('\n')[0]}
                  </span>
                </span>
                <span className={`shrink-0 ${dim}`} style={mono}>
                  {snippet.keyword}
                </span>
              </button>
            ))}
            <div className="flex h-[37px] items-center">
              <button
                type="button"
                onClick={() =>
                  setSheet({
                    kind: 'snippet',
                    isNew: true,
                    draft: { id: Date.now(), name: '', keyword: '', text: '' },
                  })
                }
                className={push}
              >
                New Snippet
              </button>
            </div>
          </div>
        </section>
      </>
    );
  } else if (page.id === 'store') {
    body = (
      <>
        <p className={`mb-4 px-2.5 text-[11px] leading-[14px] ${dim}`}>
          Extensions come from the Raycast store’s open source repository. Floe installs them with
          Bun; some need Raycast features Floe doesn’t have yet.
        </p>
        <div className={`${group} flex h-64 flex-col items-center justify-center gap-3 px-6`}>
          <p className={`text-center ${dim}`}>The store is not loaded in this demo.</p>
          <a href={floeRepo} target="_blank" rel="noreferrer" className={push}>
            See Floe on GitHub
          </a>
        </div>
      </>
    );
  } else if (page.id === 'about') {
    // The same page as Thaw's About, which Floe's is ported from (AboutSettingsPane.swift),
    // at Thaw's sizes: the name beside the icon, the build, one card for updates, the
    // actions, then a quiet footer. Checking and downloading are one choice here, and
    // the first of them is the switch General and Privacy also show.
    const mode = settings.updates !== true ? 0 : settings.downloads === true ? 2 : 1;
    const link = `rounded-[3px] underline underline-offset-2 ${ring}`;
    const row = 'flex items-center justify-between gap-3 px-3';
    const action = `${push} flex h-6 items-center text-[13px]`;

    // The first two lines of what the app copies; its third names the Mac's macOS, which a
    // web page does not know.
    const copyVersion = async () => {
      try {
        await navigator.clipboard.writeText(
          `Floe ${build[0][1]} (${build[1][1]})\nCommit: ${build[2][1]}`,
        );
        setCopied(true);
        later(() => setCopied(false), 1200);
      } catch {
        onNotice('The browser did not allow the copy.');
      }
    };

    // Nothing is asked of any server: the demo is not an updater, so a check only takes
    // its moment and notes the time, and says nothing of versions.
    const checkNow = () => {
      setCheck('checking');
      later(() => {
        onData((current) => ({ ...current, lastChecked: Date.now() }));
        setCheck('answered');
        later(() => setCheck('idle'), checkTiming.answer);
      }, checkTiming.checking);
    };

    const open = (url: string) => () => {
      window.open(url, '_blank', 'noopener');
    };
    const finder = (name: string) => () => onInert(`Showing the ${name} in Finder`);
    body = (
      <div className="flex min-h-full flex-col items-center justify-center">
        <div className="flex items-center gap-[21px]">
          <h3 className="text-[46px] leading-[56px] font-bold">Floe</h3>
          <Image src={products.floe.icon} alt="" className="size-[77px]" />
        </div>
        <p className={`mt-[18px] text-[12px] leading-[15px] ${dim}`}>
          The open source launcher for macOS
        </p>

        <div className="mt-[19px] flex items-start gap-2.5">
          <dl className="grid grid-cols-[auto_auto] gap-x-2.5 gap-y-[5px]">
            {build.map(([label, value], index) => (
              <Fragment key={label}>
                <dt className={`text-right ${dim}`}>{label}</dt>
                <dd className={`select-text ${index === 0 ? 'font-semibold' : dim}`} style={mono}>
                  {value}
                </dd>
              </Fragment>
            ))}
          </dl>
          <button
            type="button"
            aria-label={copied ? 'Copied' : 'Copy version information'}
            title={copied ? 'Copied' : 'Copy the version, build and commit for a bug report'}
            onClick={copyVersion}
            className={`${push} -mt-[3px] flex h-[22px] w-[34px] items-center justify-center px-0`}
          >
            {copied ? (
              <Check aria-hidden className="size-3" />
            ) : (
              <Copy aria-hidden className="size-3" />
            )}
          </button>
        </div>

        <div className={`${group} ${divided} mt-[23px] w-[399px] text-[12px]`}>
          <div className={`${row} h-[33px]`}>
            Update channel
            <PopUp
              label="Update channel"
              options={['Stable', 'Beta']}
              chosen={String(settings.channel)}
              onChoose={(option) => onChange('channel', option)}
            />
          </div>
          <div className={`${row} h-[33px]`}>
            Automatic updates
            <PopUp
              label="Automatic updates"
              options={automaticUpdates}
              chosen={automaticUpdates[mode]}
              onChoose={(option) => {
                const next = automaticUpdates.indexOf(option);
                onChange('updates', next > 0);
                onChange('downloads', next === 2);
              }}
            />
          </div>
          <div className={`${row} h-[39px]`}>
            <span role="status" className={dim}>
              {check === 'checking'
                ? 'Checking…'
                : check === 'answered'
                  ? 'Up to date'
                  : data.lastChecked
                    ? checkedAt(data.lastChecked)
                    : 'Not checked yet'}
            </span>
            <button
              type="button"
              disabled={check === 'checking'}
              onClick={checkNow}
              className={`${push} text-[13px]`}
            >
              Check Now
            </button>
          </div>
        </div>

        <div className="mt-[25px] flex gap-2">
          {/* The app reads its changelog into a window of its own; the site has it as a page. */}
          <Link href={`${docsRoute}/floe/changelog`} className={action}>
            What’s New
          </Link>
          <a href={`${floeRepo}/issues`} target="_blank" rel="noreferrer" className={action}>
            Report a Bug
          </a>
          <span className="relative flex">
            <button
              type="button"
              aria-label="More about Floe"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
              className={action}
            >
              <Ellipsis aria-hidden className="size-4" />
            </button>
            {moreOpen && (
              <Menu
                label="More about Floe"
                align="left"
                rows={[
                  { label: 'Extensions Folder', onPick: finder('Extensions folder') },
                  { label: 'Data Folder', onPick: finder('Data folder') },
                  {
                    label: 'Raycast Extensions Folder',
                    onPick: finder('Raycast Extensions folder'),
                  },
                  null,
                  { label: 'Join the Discord', onPick: open(links.discord) },
                  { label: 'Raycast Extension Store', onPick: open(links.raycastExtensions) },
                  null,
                  { label: 'Acknowledgements', onPick: open(links.credits) },
                ]}
                onClose={closeMore}
              />
            )}
          </span>
        </div>

        <p className={`mt-6 flex gap-3 text-[10px] leading-[13px] ${dim}`}>
          <a href={floeRepo} target="_blank" rel="noreferrer" className={link}>
            Source Code
          </a>
          <span aria-hidden>·</span>
          <a href={links.credits} target="_blank" rel="noreferrer" className={link}>
            Credits
          </a>
          <span aria-hidden>·</span>
          <a href={links.sponsor} target="_blank" rel="noreferrer" className={link}>
            Support Floe
          </a>
          <span aria-hidden>·</span>
          <a href={links.thaw} target="_blank" rel="noreferrer" className={link}>
            Thaw
          </a>
        </p>
        <p className={`mt-3 text-center text-[10px] leading-[13px] ${dim}`}>
          Copyright © 2026 René Jiménez et al.
          <br />
          <span className="mt-1 inline-block">© 2026 Thaw-app</span>
        </p>
      </div>
    );
  } else {
    body = (
      <>
        {page.id === 'privacy' && (
          <div className="mb-5 flex gap-3 rounded-[10px] bg-[#2f9e6b]/15 p-3">
            <Hand aria-hidden className="mt-0.5 size-4 shrink-0 text-[#2f9e6b]" />
            <div>
              <p className="font-semibold">No analytics</p>
              <p className={`mt-0.5 text-[11px] leading-[14px] ${dim}`}>
                Floe collects no analytics or usage data. What you open, and how often, stays in a
                file on this Mac. The network calls it makes are listed below.
              </p>
            </div>
          </div>
        )}
        {page.id === 'appearance' && (
          <section className="mb-5">
            <GroupTitle>Preview</GroupTitle>
            <div className={`${group} flex justify-center p-4`}>
              <div
                className={`w-72 bg-black/[0.05] p-3 dark:bg-white/[0.07] ${
                  settings.border ? 'ring-1 ring-black/30 dark:ring-white/40' : ''
                } ${settings.shadow ? 'shadow-lg' : ''} rounded-[16px]`}
              >
                <div
                  className={`flex items-center gap-2 bg-black/[0.06] px-3 py-2 dark:bg-white/[0.09] ${dim} ${
                    { Rounded: 'rounded-[8px]', Capsule: 'rounded-full', Square: '' }[
                      String(settings.fieldShape)
                    ]
                  }`}
                >
                  <Search aria-hidden className="size-3.5" />
                  Search
                </div>
                {settings.layout === 'Extended' && (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <span className="h-4 rounded-[5px] bg-black/[0.09] dark:bg-white/[0.13]" />
                    <span className="h-4 w-4/5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07]" />
                    <span className="h-4 w-3/5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07]" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {form(page.sections ?? [])}
      </>
    );
  }

  return (
    <div
      // The system font, as in the app; the site's own face would not read as macOS.
      style={{
        zoom: scale,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
      className="floe-window relative h-[560px] w-[820px] overflow-hidden rounded-[17px] bg-white text-[13px] leading-[16px] text-black/85 shadow-[0_24px_60px_rgb(0_0_0/0.45)] ring-[0.5px] ring-black/10 select-none ring-inset dark:bg-[#212122] dark:text-white/[0.87] dark:ring-white/15"
    >
      {/* Out of reach while a sheet is up, as a window is behind one. */}
      <div className="flex size-full" inert={sheet !== null || alert !== null}>
        <div className="absolute inset-x-0 top-0 z-10 h-[52px] cursor-grab" {...dragProps} />

        <TrafficLights
          name="Floe Settings"
          onClose={onClose}
          onMinimize={onMinimize}
          className="absolute top-[19px] left-[19px] z-20"
        />
        <button
          type="button"
          aria-label={sidebarShown ? 'Hide Sidebar' : 'Show Sidebar'}
          onClick={() => setSidebarShown(!sidebarShown)}
          className={`absolute top-2 z-20 flex size-9 items-center justify-center transition-[left] duration-300 hover:bg-black/[0.07] ring-inset motion-reduce:transition-none dark:hover:bg-white/[0.14] ${glass} ${ring} ${
            sidebarShown ? 'left-[166px]' : 'left-[88px]'
          }`}
        >
          <PanelLeft aria-hidden className="size-4 opacity-70" />
        </button>

        {/* Out of reach while it is hidden, so Tab does not land on rows nobody can see. */}
        <aside
          inert={!sidebarShown}
          className={`shrink-0 overflow-hidden bg-[#ededed] transition-[width] duration-300 motion-reduce:transition-none dark:bg-[#272728] ${
            sidebarShown ? 'w-[210px]' : 'w-0'
          }`}
        >
          <div className="flex w-[210px] flex-col px-2.5 pt-[52px]">
            {pages.map((entry) => (
              <SidebarRow
                key={entry.id}
                current={entry.id === page.id}
                onClick={() => goTo(entry.id)}
                className="relative z-20 gap-2 px-2 text-[12px] font-medium"
                icon={
                  <span className="flex w-[22px] justify-center">
                    <entry.icon
                      aria-hidden
                      className={`size-4 ${entry.id === page.id ? '' : 'opacity-60'}`}
                    />
                  </span>
                }
              >
                {entry.name}
              </SidebarRow>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`flex h-[52px] shrink-0 items-center justify-between gap-4 pr-2 transition-[padding] duration-300 motion-reduce:transition-none ${
              sidebarShown ? 'pl-5' : 'pl-[138px]'
            }`}
          >
            {/* The two lines sit where a 16 and a 13 point line two points apart put them. */}
            <ToolbarTitle
              title={page.name}
              subtitle={page.summary}
              className="gap-[3.5px] pt-[1.5px]"
            />
            <SearchField
              onClick={() => onInert('Search')}
              icon={<Search aria-hidden className="size-3.5" />}
              className="relative z-20 w-[190px] gap-2 px-3 ring-inset"
            />
          </header>
          <div
            key={page.id}
            data-menu-room
            className="thaw-pane-in min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6"
          >
            {body}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          tabIndex={-1}
          aria-label="A Floe settings file to import"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Emptied, so choosing the same file again is still a change.
            event.target.value = '';
            if (file) importSettings(file);
          }}
        />
      </div>

      {sheet?.kind === 'quicklink' && (
        <QuicklinkEditor
          initial={sheet.draft}
          isNew={sheet.isNew}
          all={data.quicklinks}
          onCancel={() => setSheet(null)}
          onSave={(saved) => {
            onData((current) => ({
              ...current,
              quicklinks: sheet.isNew
                ? [...current.quicklinks, saved]
                : current.quicklinks.map((link) => (link.id === saved.id ? saved : link)),
            }));
            setSheet(null);
          }}
          onDelete={() => {
            // The editor closes first, and the question is asked over the page.
            const { draft } = sheet;
            setSheet(null);
            setAlert({
              title: 'Delete this quicklink?',
              buttons: [
                {
                  label: 'Delete',
                  kind: 'destructive',
                  onPick: () =>
                    onData((current) => ({
                      ...current,
                      quicklinks: current.quicklinks.filter((link) => link.id !== draft.id),
                    })),
                },
                { label: 'Cancel' },
              ],
            });
          }}
        />
      )}
      {sheet?.kind === 'snippet' && (
        <SnippetEditor
          initial={sheet.draft}
          isNew={sheet.isNew}
          all={data.snippets}
          onCancel={() => setSheet(null)}
          onSave={(saved) => {
            onData((current) => ({
              ...current,
              snippets: sheet.isNew
                ? [...current.snippets, saved]
                : current.snippets.map((snippet) => (snippet.id === saved.id ? saved : snippet)),
            }));
            setSheet(null);
          }}
          onDelete={(name) =>
            setAlert({
              title: `Delete “${name}”?`,
              buttons: [
                {
                  label: 'Delete',
                  kind: 'destructive',
                  onPick() {
                    onData((current) => ({
                      ...current,
                      snippets: current.snippets.filter((snippet) => snippet.id !== sheet.draft.id),
                    }));
                    setSheet(null);
                  },
                },
                { label: 'Cancel' },
              ],
            })
          }
        />
      )}
      {/* Keyed, so one alert following another is a new sheet that takes the keyboard afresh. */}
      {alert && (
        <Alert key={alert.title} icon={products.floe.icon} {...alert} onClose={closeAlert} />
      )}
    </div>
  );
}

const sheetButton = `${push} h-6 min-w-[68px] text-[13px]`;
const sheetDefault = `${pushDefault} h-6 min-w-[68px] px-2.5 text-[13px]`;
const sheetGroup = `${group} ${divided} px-2.5`;

/** The sheet a quicklink is made and edited in, with the app's own fields and wording. */
function QuicklinkEditor({
  initial,
  isNew,
  all,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: Quicklink;
  isNew: boolean;
  all: Quicklink[];
  onCancel: () => void;
  onSave: (link: Quicklink) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const edit = (change: Partial<Quicklink>) => setDraft((current) => ({ ...current, ...change }));
  const valid = quicklinkProblem(draft, all) === null;

  return (
    <Sheet
      label={isNew ? 'New Quicklink' : `Edit ${initial.name}`}
      onCancel={onCancel}
      className="w-[412px]"
    >
      <form
        className="flex min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave({ ...draft, name: draft.name.trim(), keyword: draft.keyword.trim() });
        }}
      >
        <div className="min-h-0 overflow-y-auto p-4">
          <div className={sheetGroup}>
            <Field label="Name" value={draft.name} first onChange={(name) => edit({ name })} />
            <Field
              label="Keyword"
              value={draft.keyword}
              onChange={(keyword) => edit({ keyword })}
            />
            <Field label="URL" value={draft.url} onChange={(url) => edit({ url })} />
            <Field
              label="Symbol"
              value={draft.symbol}
              placeholder="SF Symbol name"
              onChange={(symbol) => edit({ symbol })}
            />
            <div className="flex h-[37px] items-center justify-between">
              Use as fallback
              <Switch
                on={draft.isFallback}
                label="Use as fallback"
                onChange={() => edit({ isFallback: !draft.isFallback })}
              />
            </div>
          </div>
          <p className={`mt-1.5 px-2.5 text-[11px] leading-[14px] ${dim}`}>
            Use {'{query}'} where the search text goes.
          </p>
          {!isNew && (
            <div className={`${sheetGroup} mt-5 flex h-[37px] items-center`}>
              <button
                type="button"
                onClick={onDelete}
                className={`${push} text-[#d92d20] dark:text-[#ff6961]`}
              >
                Delete Quicklink
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button type="button" onClick={onCancel} className={sheetButton}>
            Cancel
          </button>
          <button type="submit" disabled={!valid} className={sheetDefault}>
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
}

/** The sheet a snippet is made and edited in: 460 by 440, as the app's. */
function SnippetEditor({
  initial,
  isNew,
  all,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: Snippet;
  isNew: boolean;
  all: Snippet[];
  onCancel: () => void;
  onSave: (snippet: Snippet) => void;
  /** Asks first, with the snippet's name as it stands in the editor. */
  onDelete: (name: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const edit = (change: Partial<Snippet>) => setDraft((current) => ({ ...current, ...change }));
  const problem = keywordProblem(draft, all);
  const valid = draft.name.trim() !== '' && problem === null;

  return (
    <Sheet
      label={isNew ? 'New Snippet' : `Edit ${initial.name}`}
      onCancel={onCancel}
      className="h-[440px] w-[460px]"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave({ ...draft, keyword: draft.keyword.trim() });
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className={sheetGroup}>
            <Field label="Name" value={draft.name} first onChange={(name) => edit({ name })} />
            <Field
              label="Keyword"
              value={draft.keyword}
              placeholder=";sig"
              onChange={(keyword) => edit({ keyword })}
            />
            {problem && draft.keyword !== '' && (
              <p role="alert" className="py-2 text-[#d92d20] dark:text-[#ff6961]">
                {problem}
              </p>
            )}
          </div>
          <p className={`mt-1.5 px-2.5 text-[11px] leading-[14px] ${dim}`}>
            Placeholders: {'{clipboard} {date} {time} {datetime} {uuid} {day}'}
          </p>
          <h3 className="mt-5 mb-2 px-2.5 text-[13px] font-bold">Text</h3>
          <div className={`${group} p-2.5`}>
            <textarea
              aria-label="Text"
              value={draft.text}
              onChange={(event) => edit({ text: event.target.value })}
              spellCheck={false}
              style={mono}
              className={`block h-[140px] w-full resize-none rounded-[5px] bg-transparent select-text ${ring}`}
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          {!isNew && (
            <button
              type="button"
              onClick={() => onDelete(draft.name)}
              className={`${sheetButton} text-[#d92d20] dark:text-[#ff6961]`}
            >
              Delete…
            </button>
          )}
          <span className="flex-1" />
          <button type="button" onClick={onCancel} className={sheetButton}>
            Cancel
          </button>
          <button type="submit" disabled={!valid} className={sheetDefault}>
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
}
