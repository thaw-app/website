import type { ReactNode } from 'react';

/**
 * A note set apart from the text around it: what GitHub draws as a boxed alert ("Note",
 * "Important", "Warning"). Here it has no box, icon or stripe. A rule is over it, its name
 * stands at the left and what it says beside it, the way a release's sections are set.
 * The kind is in the name, so a warning is told from a note by its word and not a colour.
 */
export function Callout({
  title,
  children,
}: {
  type?: string;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="callout my-6 grid gap-x-0 gap-y-2 border-t pt-5 md:grid-cols-[9.5rem_minmax(0,1fr)]">
      <p className="not-prose pe-6 font-semibold text-fd-foreground">{title ?? 'Note'}</p>
      <div className="prose-no-margin min-w-0 text-fd-muted-foreground">{children}</div>
    </aside>
  );
}
