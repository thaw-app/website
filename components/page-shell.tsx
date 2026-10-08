import type { ReactNode } from 'react';

/**
 * The frame of every page that is neither the home page nor the docs, which
 * both run the width of the window: one column, one width, the same room
 * between its sections.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-12">
      {children}
    </main>
  );
}
