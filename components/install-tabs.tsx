'use client';

import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { docsRoute } from '@/lib/shared';

// Named by the macOS a visitor is on, which they know, not by the version of Thaw, which
// they would have to work out. A browser does not say which macOS it runs on, so the
// stable release is shown first.
const ways = [
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
    id: 'download',
    label: 'Without Homebrew',
    note: 'Get the disk image for your macOS from the releases and drag Thaw to Applications.',
    href: 'https://github.com/thaw-app/Thaw/releases',
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
  detail: 'It gives you live previews and a tint from your wallpaper. Hiding works without it.',
};
const factsFor = {
  'macos-26': [accessibility, screenRecording],
  'macos-27': [accessibility, layoutAccess, screenRecording],
  // Either release may be the one downloaded, so the one that is not always asked says when.
  download: [accessibility, { ...layoutAccess, label: 'Needs, on macOS 27' }, screenRecording],
};

/** The ways to install Thaw, one per tab, with the command ready to copy. */
export function InstallTabs() {
  const [chosen, setChosen] = useState<(typeof ways)[number]['id']>('macos-26');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const way = ways.find((candidate) => candidate.id === chosen) ?? ways[0];
  const facts = factsFor[way.id];

  async function copy(command: string) {
    // A browser can refuse the clipboard, for one when the page is not in focus.
    try {
      await navigator.clipboard.writeText(command);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 1800);
  }

  return (
    <div className="not-prose my-6">
      <div className="border">
        <div role="tablist" aria-label="Ways to install Thaw" className="flex gap-5 border-b px-4">
          {ways.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === chosen}
              onClick={() => setChosen(id)}
              className={`tap -mb-px border-b py-2.5 text-sm whitespace-nowrap transition-colors ${
                id === chosen
                  ? 'border-fd-foreground text-fd-foreground'
                  : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="flex flex-col gap-2.5 px-4 py-4">
          {'command' in way ? (
            <>
              <p className="text-sm text-fd-muted-foreground">
                {way.about} Paste this into Terminal:
              </p>
              {/* Set apart as a line of its own, with a prompt, so it reads as something to
                  run and not as a sentence. The whole line copies, as well as the button. */}
              <div className="flex items-stretch border bg-fd-foreground/[0.04]">
                <button
                  type="button"
                  onClick={() => copy(way.command)}
                  aria-label={`Copy the command ${way.command}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left font-mono text-[0.9375rem] hover:bg-fd-foreground/[0.04]"
                >
                  <span aria-hidden className="text-fd-muted-foreground select-none">
                    $
                  </span>
                  <code className="truncate">{way.command}</code>
                </button>
                <button
                  type="button"
                  onClick={() => copy(way.command)}
                  aria-live="polite"
                  className="tap flex min-w-24 items-center justify-center gap-2 border-l px-4 text-sm font-medium hover:bg-fd-foreground/[0.06]"
                >
                  {copyState === 'copied' ? (
                    <Check aria-hidden className="size-4" />
                  ) : (
                    <Copy aria-hidden className="size-4" />
                  )}
                  {copyState === 'copied'
                    ? 'Copied'
                    : copyState === 'failed'
                      ? 'Couldn’t copy'
                      : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-fd-muted-foreground">
              {way.note}{' '}
              <a href={way.href} className="text-fd-foreground link">
                Releases
              </a>
            </p>
          )}
        </div>

        {/* What a person weighs before installing something that moves their menu bar about:
            what it asks for and what is optional. */}
        <dl
          className={`grid border-t sm:divide-x max-sm:divide-y ${
            facts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {facts.map((fact) => (
            <div key={fact.value} className="flex flex-col gap-1 px-4 py-3.5">
              <dt className="text-sm text-fd-muted-foreground">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
              <dd className="text-sm text-fd-muted-foreground text-pretty">{fact.detail}</dd>
            </div>
          ))}
        </dl>

        <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t px-4 py-2.5 text-sm">
          <Link href="/#try" className="tap font-medium link">
            Try it in your browser first
          </Link>
          <Link href={`${docsRoute}/thaw/frequent-issues`} className="tap link link-quiet">
            Stuck? Frequent issues
          </Link>
        </p>
      </div>
    </div>
  );
}
