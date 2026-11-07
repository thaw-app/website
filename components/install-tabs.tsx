'use client';

import { Check, Copy, Download } from 'lucide-react';
import Link from 'next/link';
import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { InstallFacts } from '@/components/install-facts';
import { SweepText } from '@/components/sweep-text';
import { installFacts as factsFor, installWays as ways } from '@/lib/install';
import { repoUrl } from '@/lib/shared';

/** The ways to install Thaw, one per tab, with the command ready to copy. */
export function InstallTabs() {
  const [chosen, setChosen] = useState<(typeof ways)[number]['id']>(ways[0].id);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const way = ways.find((candidate) => candidate.id === chosen) ?? ways[0];
  const facts = factsFor[way.id];
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const index = ways.findIndex((candidate) => candidate.id === way.id);
  const shown = useRef(index);
  shown.current = index;
  // The first placing, and a choice made from the keyboard, move the line without sliding it.
  const still = useRef(true);
  const [swaps, setSwaps] = useState(0);
  const copyTimer = useRef<number | undefined>(undefined);

  // One line under the chosen tab, which slides to the next one chosen. It is measured, so
  // it fits each name, on whichever row the name has wrapped to.
  function place(slide: boolean) {
    const tab = tabs.current[shown.current];
    const element = line.current;
    if (!tab || !element || !list.current) return;
    element.style.transitionDuration = slide ? '' : '0s';
    element.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop + tab.offsetHeight - 1}px) scaleX(${tab.offsetWidth / 100})`;
    list.current.dataset.slide = '';
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: placed again whenever the choice changes
  useLayoutEffect(() => {
    place(!still.current);
    still.current = false;
  }, [index]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: place reads only refs
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const resized = new ResizeObserver(() => place(false));
    resized.observe(element);
    return () => {
      resized.disconnect();
      window.clearTimeout(copyTimer.current);
    };
  }, []);

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
    still.current = true;
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
    setSwaps((count) => count + 1);
    // A second copy starts the wait again, so the label does not go back early.
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => {
      setCopyState('idle');
      setSwaps((count) => count + 1);
    }, 1800);
  }

  return (
    <div className="not-prose my-6">
      <div className="border">
        <div
          role="tablist"
          aria-label="Ways to install Thaw"
          // Short enough to fit one row on a phone; a name too long for it wraps.
          ref={list}
          className="relative flex flex-wrap gap-x-3.5 border-b px-4 sm:gap-x-5"
        >
          <span
            ref={line}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 h-px w-[100px] origin-left bg-fd-foreground opacity-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] in-data-[slide]:opacity-100 motion-reduce:transition-none"
          />
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
                  ? // Its own line until the sliding one is placed, and where there is no script.
                    'border-fd-foreground text-fd-foreground in-data-[slide]:border-transparent'
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
          {'commands' in way ? (
            <>
              <p className="text-sm text-fd-muted-foreground">
                {way.about} Paste {way.commands.length > 1 ? 'these' : 'this'} into Terminal:
              </p>
              {/* Set apart as a line of its own, with a prompt, so it reads as something to
                  run and not as a sentence. The whole line copies, as well as the button. */}
              <div className="flex items-stretch border bg-fd-foreground/[0.04]">
                <button
                  type="button"
                  onClick={() => copy(way.commands.join('\n'))}
                  aria-label={`Copy the ${way.commands.length > 1 ? 'commands' : 'command'} ${way.commands.join(', then ')}`}
                  className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] content-center gap-x-3 gap-y-1.5 px-4 py-3 leading-6 text-left font-mono text-[0.9375rem] transition-colors hover:bg-fd-foreground/[0.04] active:bg-fd-foreground/[0.08]"
                >
                  {/* A line each, with its prompt; a line too long for a phone wraps, so all of
                      it is read, rather than being cut short. */}
                  {way.commands.map((line) => (
                    <span key={line} className="contents">
                      <span aria-hidden className="text-fd-muted-foreground select-none">
                        $
                      </span>
                      <code className="[overflow-wrap:anywhere]">
                        <SweepText>{line}</SweepText>
                      </code>
                    </span>
                  ))}
                </button>
                <button
                  type="button"
                  onClick={() => copy(way.commands.join('\n'))}
                  aria-live="polite"
                  // On a phone the icon alone, so the command beside it is not cut short to make room.
                  className="tap flex items-center justify-center gap-2 border-l px-4 text-sm font-medium transition-colors hover:bg-fd-foreground/[0.06] active:bg-fd-foreground/[0.12] sm:min-w-24"
                >
                  {/* Changed by a copy, the icon comes in; on the page's first drawing it is just there. */}
                  <span key={swaps} className={`flex ${swaps > 0 ? 'icon-swap' : ''}`}>
                    {copyState === 'copied' ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <Copy aria-hidden className="size-4" />
                    )}
                  </span>
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
