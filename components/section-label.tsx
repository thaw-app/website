import type { ReactNode } from 'react';

/**
 * The name over a section, on every page: a small quiet label with its rule
 * running on to the edge. What a section holds is plain from looking at it, so
 * its name does not need to be a headline.
 */
export function SectionLabel({
  as: Tag = 'h2',
  id,
  children,
}: {
  as?: 'h2' | 'h3';
  id?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className="section-label">
      {children}
    </Tag>
  );
}
