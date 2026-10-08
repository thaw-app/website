import { Heading } from 'fumadocs-ui/components/heading';
import type { ReactNode } from 'react';

/** "In numbers" as "in-numbers": what the section answers to in an address. */
function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The name over a section, on every page: a small quiet label with its rule
 * running on to the edge. What a section holds is plain from looking at it, so
 * its name does not need to be a headline.
 *
 * Every one can be linked to, the way a heading in the docs can: the name is a link to
 * itself, with the control beside it that copies the address. A label that is not plain
 * text is given its `id` by hand.
 */
export function SectionLabel({
  as = 'h2',
  id,
  children,
}: {
  as?: 'h2' | 'h3';
  id?: string;
  children: ReactNode;
}) {
  return (
    <Heading
      as={as}
      id={id ?? (typeof children === 'string' ? slug(children) : undefined)}
      className="section-label"
    >
      {children}
    </Heading>
  );
}
