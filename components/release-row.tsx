'use client';

import { useState } from 'react';
import { macosVersions } from '@/lib/macos';
import { IntentLink } from './intent-link';

/**
 * One earlier release as a line of the changelog: its tag, which opens its page, and the
 * rest of the line, which opens its notes under it. The notes are not in the changelog's
 * own page, where seventy of them would be most of its weight: they are read from the
 * release's page the first time the line is opened.
 */
export function ReleaseRow({
  tag,
  href,
  details,
  date,
  dateLabel,
  dateShort,
  os,
  channel,
  stable,
}: {
  tag: string;
  href: string;
  details: string;
  date?: string;
  dateLabel?: string;
  /** The date with its month shortened, for a phone. */
  dateShort?: string;
  os?: string;
  /** Its channel as the filter reads it, such as "beta" or "release-candidate". */
  channel: string;
  /** A release on the stable channel, which is told from the pre-releases around it. */
  stable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // undefined before it is asked for, null when it could not be read.
  const [notes, setNotes] = useState<string | null>();

  async function toggle() {
    setOpen(!open);
    if (open || notes !== undefined) return;
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error(String(response.status));
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const found = page.querySelector('.release-notes');
      // A heading's copy button works only on the page it was built for; here it would be dead.
      for (const button of found?.querySelectorAll('button') ?? []) button.remove();
      setNotes(found?.innerHTML ?? null);
    } catch {
      setNotes(null);
    }
  }

  return (
    // An open line is tinted faintly, so where its notes end and the next release starts can
    // be seen. Its tag starts where the newest release's does, and its notes where the
    // newest's notes do (release-list.tsx).
    <li
      data-os={macosVersions(os).join(' ') || undefined}
      data-channel={channel}
      data-open={open || undefined}
      className="release-entry release-row"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline sm:grid-cols-[13.5rem_minmax(0,1fr)]">
        <IntentLink
          href={href}
          className="tap justify-self-start pt-3 pb-0.5 font-mono text-sm sm:py-2.5"
        >
          <span
            className={`underline-offset-4 hover:underline ${stable ? 'font-semibold text-(--release-2)' : 'text-fd-foreground'}`}
          >
            {tag}
          </span>
        </IntentLink>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className="col-span-2 row-start-2 flex items-baseline justify-between gap-x-6 pb-3 text-start text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground sm:col-span-1 sm:row-start-auto sm:py-2.5 sm:pe-3"
        >
          <span>{details}</span>
          <span className="flex shrink-0 items-baseline gap-3">
            {date && (
              <time dateTime={date}>
                <span className="sm:hidden">{dateShort ?? dateLabel}</span>
                <span className="max-sm:hidden">{dateLabel}</span>
              </time>
            )}
            <span aria-hidden className="w-3 text-center font-mono text-fd-foreground">
              {open ? '−' : '+'}
            </span>
            <span className="sr-only">{open ? 'Hide the notes' : 'Show the notes'}</span>
          </span>
        </button>
      </div>
      {open && (
        <div className="pb-8 sm:ps-[13.5rem]">
          {notes === undefined && (
            <p className="text-sm text-fd-muted-foreground">Loading the notes…</p>
          )}
          {notes === null && (
            <p className="text-sm text-fd-muted-foreground">
              The notes could not be loaded here.{' '}
              <IntentLink href={href} className="link text-fd-foreground">
                Open {tag} on its own page
              </IntentLink>
              .
            </p>
          )}
          {notes && (
            <div
              className="prose release-notes max-w-none"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: this site's own page for the release, built from the changelog file
              dangerouslySetInnerHTML={{ __html: notes }}
            />
          )}
        </div>
      )}
    </li>
  );
}
