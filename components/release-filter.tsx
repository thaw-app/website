'use client';

import { type ReactNode, useState } from 'react';
import { Choice } from './choice';

/**
 * Buttons that narrow the changelog to one macOS. The entries are drawn on
 * the server, each marked with its macOS, and this hides the ones that do
 * not match.
 */
export function ReleaseFilter({ systems, children }: { systems: string[]; children: ReactNode }) {
  const [system, setSystem] = useState<string | null>(null);

  return (
    <>
      {systems.length > 1 && (
        <Choice
          legend="Show releases for"
          className="not-prose mb-10"
          options={[
            { id: null, label: 'Every macOS' },
            ...systems.map((name) => ({ id: name as string | null, label: name })),
          ]}
          value={system}
          onChange={setSystem}
        />
      )}
      {system && <style>{`.release-entry:not([data-os="${system}"]) { display: none; }`}</style>}
      {children}
    </>
  );
}
