'use client';

import Link from 'next/link';
import { useState } from 'react';

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
  os,
  stable,
}: {
  tag: string;
  href: string;
  details: string;
  date?: string;
  dateLabel?: string;
  os?: string;
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
    <li data-os={os} className="release-entry">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline sm:grid-cols-[13rem_minmax(0,1fr)]">
        <Link href={href} className="tap justify-self-start py-2.5 font-mono text-sm sm:ps-3">
          <span
            className={`underline-offset-4 hover:underline ${stable ? 'font-semibold text-(--release-2)' : 'text-fd-foreground'}`}
          >
            {tag}
          </span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className="col-span-2 row-start-2 flex items-baseline justify-between gap-x-6 pb-2.5 text-start text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground sm:col-span-1 sm:row-start-auto sm:py-2.5 sm:pe-3"
        >
          <span>{details}</span>
          <span className="flex shrink-0 items-baseline gap-3">
            {date && <time dateTime={date}>{dateLabel}</time>}
            <span aria-hidden className="w-3 text-center font-mono text-fd-foreground">
              {open ? '−' : '+'}
            </span>
            <span className="sr-only">{open ? 'Hide the notes' : 'Show the notes'}</span>
          </span>
        </button>
      </div>
      {open && (
        <div className="pb-8 sm:ps-[13rem]">
          {notes === undefined && (
            <p className="text-sm text-fd-muted-foreground">Loading the notes…</p>
          )}
          {notes === null && (
            <p className="text-sm text-fd-muted-foreground">
              The notes could not be loaded here.{' '}
              <Link href={href} className="link text-fd-foreground">
                Open {tag} on its own page
              </Link>
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
