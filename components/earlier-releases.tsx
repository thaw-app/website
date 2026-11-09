'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Choice } from './choice';
import { IntentLink } from './intent-link';

/** One earlier release as a row of the table. */
export type ReleaseCells = {
  tag: string;
  href: string;
  /** Its place in the changelog, newest first: what "Version" sorts by. */
  order: number;
  channel: string;
  /** Its channel as the filter reads it, such as "beta". */
  channelKey: string;
  os?: string;
  /** Its macOS versions as the filter reads them, such as "15 26". */
  systems?: string;
  date?: string;
  dateShort?: string;
  added?: number;
  fixed?: number;
  stable: boolean;
};

type View = 'list' | 'table';
type Column = 'version' | 'date' | 'added' | 'fixed';

/** Where the viewer's choice of view is kept between visits, in their own browser. */
const storageKey = 'changelog-view';

/**
 * The changelog's earlier releases, as a list whose lines open their notes, or as a table
 * that can be sorted, as a Notion database has views of the same rows. Both are marked as
 * entries, so the macOS and channel buttons narrow either.
 */
export function EarlierReleases({ list, rows }: { list: ReactNode; rows: ReleaseCells[] }) {
  const [view, setView] = useState<View>('list');
  const [sort, setSort] = useState<{ by: Column; down: boolean }>({ by: 'version', down: true });

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === 'table') setView('table');
    } catch {}
  }, []);

  function choose(next: View) {
    setView(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {}
  }

  function sortBy(by: Column) {
    // A column chosen again turns its order round; a new one starts from the most.
    setSort((current) => ({ by, down: current.by === by ? !current.down : true }));
  }

  const value = (row: ReleaseCells) =>
    sort.by === 'version'
      ? -row.order
      : sort.by === 'date'
        ? (row.date ?? '')
        : (row[sort.by] ?? -1);
  const sorted = [...rows].sort((a, b) => {
    const [x, y] = [value(a), value(b)];
    const order = x < y ? -1 : x > y ? 1 : a.order - b.order;
    return sort.down ? -order : order;
  });

  // A column of numbers is set to the right, with its arrow before its name, so the name
  // ends where the numbers do.
  const header = (by: Column, label: string, className: string, end = false) => (
    <th
      scope="col"
      aria-sort={sort.by === by ? (sort.down ? 'descending' : 'ascending') : undefined}
      className={`py-2 font-normal ${end ? 'text-end' : 'text-start'} ${className}`}
    >
      <button
        type="button"
        onClick={() => sortBy(by)}
        className={`tap inline-flex items-baseline gap-1.5 transition-colors hover:text-fd-foreground ${end ? 'flex-row-reverse' : ''} ${sort.by === by ? 'text-fd-foreground' : ''}`}
      >
        {label}
        <span aria-hidden className="w-2 font-mono text-xs">
          {sort.by === by ? (sort.down ? '↓' : '↑') : ''}
        </span>
      </button>
    </th>
  );

  return (
    <section className="pt-10">
      {/* Named as every section of the site is: a small label with its rule, and here the
          choice of view at the end of the rule. */}
      <div className="mb-3 flex items-center gap-4">
        <h2 id="earlier-releases" className="section-label flex-1">
          Earlier releases
        </h2>
        <Choice
          legend="Show the earlier releases as"
          options={[
            { id: 'list' as View, label: 'List' },
            { id: 'table' as View, label: 'Table' },
          ]}
          value={view}
          onChange={choose}
        />
      </div>
      {view === 'list' ? (
        list
      ) : (
        // On a narrow phone the table scrolls inside its own box, never the page.
        <div className="overflow-x-auto">
          <table aria-labelledby="earlier-releases" className="w-full border-b text-sm">
            <thead className="border-b text-start text-fd-muted-foreground">
              <tr className="text-start">
                {header('version', 'Version', 'pe-3 sm:pe-6')}
                <th scope="col" className="py-2 pe-3 sm:pe-6 text-start font-normal max-sm:hidden">
                  Channel
                </th>
                <th scope="col" className="py-2 pe-3 sm:pe-6 text-start font-normal">
                  macOS
                </th>
                {header('date', 'Date', 'pe-3 sm:pe-6')}
                {header('added', 'New', 'pe-3 sm:pe-6 max-sm:hidden', true)}
                {header('fixed', 'Fixed', 'max-sm:hidden', true)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((row) => (
                <tr
                  key={row.href}
                  data-os={row.systems}
                  data-channel={row.channelKey}
                  className="release-entry transition-colors hover:bg-fd-accent/50"
                >
                  <td className="py-2.5 pe-3 sm:pe-6 whitespace-nowrap">
                    <IntentLink
                      href={row.href}
                      className={`tap font-mono underline-offset-4 hover:underline ${row.stable ? 'font-semibold text-(--release-2)' : 'text-fd-foreground'}`}
                    >
                      {row.tag}
                    </IntentLink>
                  </td>
                  <td className="py-2.5 pe-3 sm:pe-6 text-fd-muted-foreground max-sm:hidden">
                    {row.channel}
                  </td>
                  <td className="py-2.5 pe-3 sm:pe-6 text-fd-muted-foreground">
                    {row.os?.replace(/^macOS /, '')}
                  </td>
                  <td className="py-2.5 pe-3 sm:pe-6 whitespace-nowrap text-fd-muted-foreground">
                    {row.date && <time dateTime={row.date}>{row.dateShort}</time>}
                  </td>
                  <td className="py-2.5 pe-3 sm:pe-6 text-end text-fd-muted-foreground tabular-nums max-sm:hidden">
                    {row.added || ''}
                  </td>
                  <td className="py-2.5 text-end text-fd-muted-foreground tabular-nums max-sm:hidden">
                    {row.fixed || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
