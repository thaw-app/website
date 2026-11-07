'use client';

import { type ReactNode, useState } from 'react';
import { macosVersions } from '@/lib/macos';
import { Choice } from './choice';

/**
 * Buttons that narrow the changelog: to one macOS, and to the stable releases, which are
 * the ones most people install. The entries are drawn on the server, each marked with its
 * macOS and whether it is stable, and this hides the ones that do not match.
 */
export function ReleaseFilter({
  systems,
  entries,
  children,
}: {
  /** The macOS versions any release runs on, newest first. */
  systems: number[];
  /** What each entry is, in the order drawn: enough to know when a choice leaves none. */
  entries: { os?: string; stable: boolean }[];
  children: ReactNode;
}) {
  const [system, setSystem] = useState<string | null>(null);
  const [which, setWhich] = useState<'all' | 'stable'>('all');
  const stableOnly = which === 'stable';
  // The choice is only offered where it would change something.
  const mixed = entries.some((entry) => entry.stable) && entries.some((entry) => !entry.stable);
  const left = entries.filter(
    (entry) =>
      (!system || macosVersions(entry.os).includes(Number(system))) &&
      (!stableOnly || entry.stable),
  ).length;
  const hidden = [
    // An entry carries its versions as a list ("15 26"), and shows under each of them.
    system && `.release-entry:not([data-os~="${system}"])`,
    stableOnly && '.release-entry:not([data-stable])',
  ].filter(Boolean);

  return (
    <>
      {(systems.length > 1 || mixed) && (
        <div className="not-prose mb-10 flex flex-wrap gap-x-8 gap-y-3">
          {systems.length > 1 && (
            <Choice
              legend="Show releases for"
              options={[
                { id: null, label: 'Every macOS' },
                ...systems.map((version) => ({
                  id: String(version) as string | null,
                  label: `macOS ${version}`,
                })),
              ]}
              value={system}
              onChange={setSystem}
            />
          )}
          {mixed && (
            <Choice
              legend="Which releases to show"
              options={[
                { id: 'all', label: 'Every release' },
                { id: 'stable', label: 'Stable only' },
              ]}
              value={which}
              onChange={setWhich}
            />
          )}
        </div>
      )}
      {hidden.length > 0 && <style>{`${hidden.join(', ')} { display: none; }`}</style>}
      {left === 0 ? (
        <p className="not-prose border-t py-10 text-fd-muted-foreground">
          No stable release{system ? ` for macOS ${system}` : ''} yet. Its pre-releases are under
          “Every release”.
        </p>
      ) : (
        children
      )}
    </>
  );
}
