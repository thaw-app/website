import type { ReactNode } from 'react';
import { PageFade } from './page-fade';

/**
 * The frame of every page that is neither the home page nor the docs, which
 * both run the width of the window: one column, one width, the same room
 * between its sections.
 */
export function PageShell({
  children,
  tone,
}: {
  children: ReactNode;
  /** Whose accent the page is drawn in, where it is not Thaw's (global.css). */
  tone?: string;
}) {
  return (
    <PageFade>
      <main
        id="content"
        data-tone={tone}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-12"
      >
        {children}
      </main>
    </PageFade>
  );
}
