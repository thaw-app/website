'use client';

import { Check, Copy, Download } from 'lucide-react';
import Link from 'next/link';
import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { InstallFacts } from '@/components/install-facts';
import { installFacts as factsFor, installWays as ways } from '@/lib/install';
import { repoUrl } from '@/lib/shared';

/** The ways to install Thaw, one per tab, with the command ready to copy. */
export function InstallTabs() {
  const [chosen, setChosen] = useState<(typeof ways)[number]['id']>('macos-26');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const way = ways.find((candidate) => candidate.id === chosen) ?? ways[0];
  const facts = factsFor[way.id];
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Tabs as a keyboard expects them: one stop for the whole list, and the arrow keys,
  // Home and End move between tabs, choosing each as it is reached.
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = ways.length - 1;
    const to = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    setChosen(ways[to].id);
    tabs.current[to]?.focus();
  }

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
        <div
          role="tablist"
          aria-label="Ways to install Thaw"
          // On a phone the three names are a few pixels wider than the box, so the gap closes up.
          className="flex gap-3.5 border-b px-4 sm:gap-5"
        >
          {ways.map(({ id, label }, index) => (
            <button
              key={id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${id}`}
              aria-selected={id === chosen}
              aria-controls={`${base}-panel`}
              tabIndex={id === chosen ? 0 : -1}
              onClick={() => setChosen(id)}
              onKeyDown={(event) => onTabKey(event, index)}
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

        <div
          role="tabpanel"
          id={`${base}-panel`}
          aria-labelledby={`${base}-tab-${way.id}`}
          className="flex flex-col gap-2.5 px-4 py-4"
        >
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
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left font-mono text-[0.9375rem] transition-colors hover:bg-fd-foreground/[0.04] active:bg-fd-foreground/[0.08]"
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
                  // On a phone the icon alone, so the command beside it is not cut short to make room.
                  className="tap flex items-center justify-center gap-2 border-l px-4 text-sm font-medium transition-colors hover:bg-fd-foreground/[0.06] active:bg-fd-foreground/[0.12] sm:min-w-24"
                >
                  {copyState === 'copied' ? (
                    <Check aria-hidden className="size-4" />
                  ) : (
                    <Copy aria-hidden className="size-4" />
                  )}
                  <span className="max-sm:sr-only">
                    {copyState === 'copied'
                      ? 'Copied'
                      : copyState === 'failed'
                        ? 'Couldn’t copy'
                        : 'Copy'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-fd-muted-foreground">{way.note}</p>
              {/* For someone who has never opened Terminal this is the whole install, so it is
                  a button as large as the command beside it, not a link in a sentence. */}
              <a
                href={way.href}
                className="press flex items-center justify-between gap-3 border bg-fd-foreground/[0.04] px-4 py-3 font-medium transition-colors hover:bg-fd-foreground/[0.08]"
              >
                Download Thaw from GitHub
                <Download aria-hidden className="size-4" />
              </a>
            </>
          )}
        </div>

        {/* What a person weighs before installing something that moves their menu bar about:
            what it asks for and what is optional. */}
        <InstallFacts facts={facts} />

        <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t px-4 py-2.5 text-sm">
          <Link href="/#try" className="tap font-medium link">
            Try it in your browser first
          </Link>
          <a href={`${repoUrl('thaw')}/issues`} className="tap link link-quiet">
            Stuck? Ask on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
