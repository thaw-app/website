'use client';

import type { ComponentProps } from 'react';

/**
 * What holds the header, a page and the footer. Fumadocs makes this the page's `main`,
 * which puts the header and the footer inside it and leaves a page's own `main` as a
 * second one within the first. Here it is a plain box, so each page has one `main` and
 * it holds only the page.
 */
export function SiteContainer({ className, ...props }: ComponentProps<'main'>) {
  return (
    <div
      id="nd-home-layout"
      {...(props as ComponentProps<'div'>)}
      className={`flex flex-1 flex-col ${className ?? ''}`}
    />
  );
}
