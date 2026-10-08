'use client';

import {
  BookOpen,
  Code,
  CornerDownLeft,
  Download,
  Eye,
  LifeBuoy,
  Link as LinkIcon,
  type LucideIcon,
  MapIcon,
  MessageCircle,
  ScrollText,
  Search,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, type RefObject, useId, useMemo, useState } from 'react';
import { docsRoute, links, repoUrl } from '@/lib/shared';
import type { DesktopAction, FloeSettings, Quicklink } from './model';

interface Command {
  title: string;
  /** The grey line under the title, as Floe shows the app a command belongs to. */
  owner: string;
  icon: LucideIcon;
  /** Extra words to match, beyond the title and owner. */
  keywords?: string;
  href?: string;
  /** Acts on the mock desktop, the way Thaw's own actions show up in Floe. */
  action?: DesktopAction;
  /** A row made for this search, such as a quicklink's; it has a group of its own. */
  section?: string;
}

const commands: Command[] = [
  { title: 'Toggle hidden menu bar items', owner: 'Thaw', icon: Eye, action: 'toggle-menu-bar' },
  {
    title: 'Thaw Settings',
    owner: 'Thaw',
    icon: Settings,
    keywords: 'preferences',
    action: 'open-settings',
  },
  {
    title: 'Download Thaw',
    owner: 'Thaw',
    icon: Download,
    keywords: 'install brew',
    href: `${repoUrl('thaw')}/releases/latest`,
  },
  { title: 'Floe Settings', owner: 'Floe', icon: Settings, action: 'open-floe-settings' },
  {
    title: 'Download Floe',
    owner: 'Floe',
    icon: Download,
    keywords: 'install',
    href: `${repoUrl('floe')}/releases/latest`,
  },
  { title: 'Thaw documentation', owner: 'Docs', icon: BookOpen, href: `${docsRoute}/thaw` },
  { title: 'Floe documentation', owner: 'Docs', icon: BookOpen, href: `${docsRoute}/floe` },
  {
    title: 'Frequent issues',
    owner: 'Thaw',
    icon: LifeBuoy,
    keywords: 'help problem fix',
    href: `${docsRoute}/thaw/frequent-issues`,
  },
  {
    title: 'URL schemes',
    owner: 'Thaw',
    icon: LinkIcon,
    keywords: 'thaw:// raycast alfred shortcuts script',
    href: `${docsRoute}/thaw/uri-schemes`,
  },
  { title: 'Roadmap', owner: 'Thaw', icon: MapIcon, href: `${docsRoute}/thaw/roadmap` },
  {
    title: 'Thaw changelog',
    owner: 'Thaw',
    icon: ScrollText,
    keywords: 'releases',
    href: `${docsRoute}/thaw/changelog`,
  },
  {
    title: 'Floe changelog',
    owner: 'Floe',
    icon: ScrollText,
    keywords: 'releases',
    href: `${docsRoute}/floe/changelog`,
  },
  { title: 'GitHub', owner: 'thaw-app', icon: Code, href: links.github },
  {
    title: 'Discord',
    owner: 'Community',
    icon: MessageCircle,
    keywords: 'chat',
    href: links.discord,
  },
];

interface LauncherProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onAction: (action: DesktopAction) => void;
  onClose: () => void;
  /** What Floe's Appearance settings say the panel looks like. */
  settings: FloeSettings;
  /** The web searches set up on the settings' Quicklinks page. */
  quicklinks: Quicklink[];
  /** Searches that opened something, oldest first; kept while Privacy says to remember them. */
  searches: string[];
  onRemember: (query: string) => void;
  /** Called for a control that has nothing behind it here, with its name. */
  onInert?: (name: string) => void;
}

// The two groups Floe's own list opens with.
const sections = [
  { title: 'Suggestions', owners: ['Thaw'] },
  { title: 'Commands', owners: ['Floe', 'Docs', 'thaw-app', 'Community'] },
];

/** A key, drawn as Floe draws one in its bottom bar. */
function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="rounded-[5px] bg-black/[0.08] px-1 py-0.5 font-sans text-[10px] leading-none font-medium text-black/55 dark:bg-white/[0.12] dark:text-white/55">
      {children}
    </kbd>
  );
}

/**
 * Floe's launcher, to the measurements in its own source: a panel 750 by 474
 * with corners of 24, a search field set in from the edge by 12, rows 36 high
 * with a 24-point icon and the kind of thing at the right, section headings,
 * and a bottom bar with the gear on the left and the selected row's actions,
 * with their keys, on the right. The glass is the web's nearest to it, and
 * the icons are Lucide's nearest to the SF Symbols the app uses, which are
 * Apple's and cannot be served from a website.
 */
export function Launcher({
  inputRef,
  onAction,
  onClose,
  settings,
  quicklinks,
  searches,
  onRemember,
  onInert,
}: LauncherProps) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  // Which remembered search the Up arrow last brought back, counted from the oldest.
  const [recalled, setRecalled] = useState<number | null>(null);

  const results = useMemo(() => {
    const text = query.trim();
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (found: string) => words.every((word) => found.toLowerCase().includes(word));
    const matched = commands.filter((command) =>
      matches(`${command.title} ${command.owner} ${command.keywords ?? ''}`),
    );
    if (!text) return matched;

    // Quicklinks three ways, as in the app (QuicklinkSearchProvider): `keyword rest` on top,
    // by name or keyword among the results, and the fallbacks at the bottom.
    const search = (link: Quicklink, rest: string, section?: string): Command => ({
      title: `Search ${link.name} for “${rest}”`,
      owner: 'Quicklink',
      icon: Search,
      href: link.url.replaceAll('{query}', encodeURIComponent(rest)),
      section,
    });
    const keyed = quicklinks.find((link) => text.startsWith(`${link.keyword} `));
    const named: Command[] = quicklinks
      .filter((link) => matches(`${link.name} ${link.keyword}`))
      .map((link) => ({
        title: link.name,
        owner: 'Quicklink',
        icon: LinkIcon,
        href: link.url.replaceAll('{query}', ''),
      }));
    return [
      ...(keyed ? [search(keyed, text.slice(keyed.keyword.length + 1))] : []),
      ...matched,
      ...named,
      ...quicklinks
        .filter((link) => link.isFallback)
        .map((link) => search(link, text, 'Fallbacks')),
    ];
  }, [query, quicklinks]);
  // Compact shows only the search bar until something is typed.
  const compact = settings.layout === 'Compact' && !query;
  const fieldRadius =
    { Capsule: 'rounded-full', Square: 'rounded-none' }[String(settings.fieldShape)] ??
    'rounded-[12px]';
  const active = Math.min(selected, results.length - 1);
  const chosen = results[active];

  function run(command: Command) {
    // A search that opened something is remembered, for the Up arrow to bring back.
    if (query.trim() && settings.history === true) onRemember(query.trim());
    if (command.action) onAction(command.action);
    else if (command.href?.startsWith('/')) router.push(command.href);
    else if (command.href) window.open(command.href, '_blank', 'noopener');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' && active <= 0 && searches.length > 0) {
      // Up at the top of the list walks back through the remembered searches: from an
      // empty field the newest, from one that was brought back the one before it.
      const held = recalled !== null && searches[recalled] === query ? recalled : null;
      if (query === '' || held !== null) {
        event.preventDefault();
        const older = (held ?? searches.length) - 1;
        if (older >= 0) {
          setRecalled(older);
          setQuery(searches[older]);
          setSelected(0);
        }
        return;
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setSelected((active + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter' && chosen) {
      run(chosen);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }

  // With nothing typed the list is in Floe's two groups; a search is one flat list.
  const groups = query
    ? [
        { title: '', rows: results.filter((command) => !command.section) },
        { title: 'Fallbacks', rows: results.filter((command) => command.section) },
      ].filter((group) => group.rows.length)
    : sections
        .map((section) => ({
          title: section.title,
          rows: results.filter((command) => section.owners.includes(command.owner)),
        }))
        .filter((group) => group.rows.length);

  return (
    <div
      className={`flex w-[750px] flex-col overflow-hidden rounded-[24px] bg-[rgb(244_244_246/0.95)] text-[13px] text-black/85 backdrop-blur-2xl backdrop-saturate-150 dark:bg-[rgb(30_30_33/0.95)] dark:text-white/90 ${
        compact ? 'h-[67px]' : 'h-[474px]'
      } ${settings.border ? 'border border-black/15 dark:border-white/20' : ''} ${
        settings.shadow ? 'shadow-[0_24px_60px_rgb(0_0_0/0.35)]' : ''
      }`}
    >
      <label
        className={`mx-3 mt-3 mb-2.5 flex items-center gap-2.5 bg-black/[0.05] px-3.5 py-[11px] ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#1560e8] dark:bg-white/[0.07] dark:ring-white/15 dark:focus-within:ring-[#6aa5ff] ${fieldRadius}`}
      >
        <Search aria-hidden className="size-[17px] shrink-0 text-black/50 dark:text-white/55" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={chosen ? `${listId}-${active}` : undefined}
          aria-label="Search apps and commands"
          placeholder="Search apps and commands…"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-[17px] leading-[21px] outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
        />
      </label>

      <div
        id={listId}
        role="listbox"
        className={`min-h-0 flex-1 overflow-y-auto px-3 ${compact ? 'hidden' : ''}`}
      >
        {results.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <Search aria-hidden className="mb-1 size-7 text-black/35 dark:text-white/35" />
            <p className="font-semibold">Nothing matches</p>
            <p className="text-[11px] text-black/50 dark:text-white/55">
              Try part of an app’s or a command’s name, or an alias.
            </p>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.title || 'results'}>
            {group.title && (
              <p className="py-2.5 pl-1.5 font-semibold text-black/50 dark:text-white/55">
                {group.title}
              </p>
            )}
            {group.rows.map((command) => {
              const index = results.indexOf(command);
              return (
                <button
                  key={`${command.section ?? ''}${command.title}`}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  onClick={() => run(command)}
                  onMouseMove={() => setSelected(index)}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-[12px] px-2 text-left ${
                    index === active ? 'bg-black/[0.09] dark:bg-white/[0.13]' : ''
                  }`}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-black/[0.06] dark:bg-white/[0.09]">
                    <command.icon
                      aria-hidden
                      className="size-[13px] text-black/70 dark:text-white/80"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{command.title}</span>
                  <span className="shrink-0 text-[10px] text-black/50 dark:text-white/55">
                    {command.owner}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className={`items-center gap-2.5 px-3 py-2.5 text-[12px] ${compact ? 'hidden' : 'flex'}`}
      >
        <button
          type="button"
          aria-label="Open Settings"
          title="Open Settings"
          onClick={() => onAction('open-floe-settings')}
          className="flex size-7 items-center justify-center rounded-md text-black/50 hover:bg-black/[0.06] dark:text-white/55 dark:hover:bg-white/[0.08]"
        >
          <Settings aria-hidden className="size-[18px]" />
        </button>
        <span className="flex-1" />
        {chosen && (
          <>
            <button
              type="button"
              onClick={() => onInert?.('Actions')}
              className="flex h-7 items-center gap-[5px] rounded-md pr-[3px] pl-2 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            >
              Actions <KeyCap>⌘</KeyCap>
              <KeyCap>K</KeyCap>
            </button>
            <button
              type="button"
              onClick={() => run(chosen)}
              className="flex h-7 items-center gap-[5px] rounded-md pr-[3px] pl-2 font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            >
              {chosen.action ? 'Run' : 'Open'}
              <span className="flex items-center rounded-[5px] bg-black/[0.08] p-1 text-black/55 dark:bg-white/[0.12] dark:text-white/55">
                <CornerDownLeft aria-hidden className="size-[11px]" />
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
