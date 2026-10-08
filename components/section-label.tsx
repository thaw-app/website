import { Heading } from 'fumadocs-ui/components/heading';
import type { ReactNode } from 'react';
import { slug } from '@/lib/format.mjs';

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

/**
 * A section of a page: its name, then what it holds, the same distance under the name
 * every time. Written out by hand that distance drifted from one section to the next.
 */
export function Section({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <SectionLabel id={id}>{label}</SectionLabel>
      {children}
    </section>
  );
}
