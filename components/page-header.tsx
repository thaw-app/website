import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The head of every page that is neither the home page nor the docs: the page's plain
 * name as a small label, a headline that says what it is about, and an opening line or
 * two. The label is what the page is called in the header and the footer.
 */
export function PageHeader({
  label,
  labelHref,
  title,
  className,
  children,
}: {
  label: string;
  /** Where the label leads, when the page hangs off a part of another. */
  labelHref?: string;
  title: string;
  className?: string;
  /** The opening lines, and anything that belongs under them. */
  children?: ReactNode;
}) {
  return (
    <header className={`flex flex-col gap-4 ${className ?? ''}`}>
      <p className="text-sm font-medium text-fd-muted-foreground">
        {labelHref ? (
          <Link href={labelHref} className="tap link-quiet">
            {label}
          </Link>
        ) : (
          label
        )}
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      {children}
    </header>
  );
}

/** The opening lines under a page's headline. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl text-lg text-fd-muted-foreground text-pretty">{children}</p>;
}
