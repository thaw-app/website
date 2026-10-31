import { Heading } from 'fumadocs-ui/components/heading';
import type { MDXContent } from 'mdx/types';
import type { ComponentProps } from 'react';
import { HoverItem } from '@/components/hover-lines';
import { getMDXComponents } from '@/components/mdx';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ProductChoice } from '@/components/product-choice';
import { Roadmap } from '@/components/roadmap';
import { type ProductSlug, products } from '@/lib/shared';

// Where each roadmap is: one for each product, and one for the design they share.
const roadmaps = [
  { name: products.thaw.name, href: '/roadmap' },
  { name: products.floe.name, href: '/floe/roadmap' },
  { name: 'ThawUI', href: '/roadmap/thawui' },
];

/** The paragraph the roadmap opens with, set as this site sets a page's opening lines. */
function Opening(props: ComponentProps<'p'>) {
  return (
    <p
      {...props}
      className="max-w-2xl text-lg text-fd-muted-foreground text-pretty [&_a]:text-fd-foreground [&_a]:underline [&_a]:decoration-fd-foreground/45 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:decoration-fd-foreground"
    />
  );
}

/**
 * A heading written in the roadmap's own text, set as the name over any section is.
 */
function Section(props: ComponentProps<'h2'>) {
  return <Heading as="h2" {...props} className="section-label mt-14 mb-6 scroll-mt-24" />;
}

/**
 * A roadmap: its headline, then the lists as written in content/site. Thaw's, Floe's and
 * ThawUI's are this page with different lists, and Floe's is drawn in its own accent.
 */
export function RoadmapView({
  label,
  title,
  Lists,
  product = 'thaw',
  whose = products[product].name,
}: {
  label: string;
  title: string;
  Lists: MDXContent;
  product?: ProductSlug;
  /** The name of this roadmap among the choices. */
  whose?: string;
}) {
  // The choice of product sits under the opening lines and over the lists, which is where
  // the lists' own row of counts begins.
  // biome-ignore lint/correctness/noComponentHookFactories: a server component, drawn once per page, so nothing here can remount
  const Chosen = (props: ComponentProps<typeof Roadmap>) => (
    <>
      <ProductChoice
        label="Whose roadmap"
        choices={roadmaps}
        current={whose}
        className="not-prose mt-6"
      />
      <Roadmap {...props} />
    </>
  );
  return (
    <PageShell tone={product}>
      <div>
        <PageHeader label={label} title={title} className="mb-4" />
        <Lists
          components={getMDXComponents({ p: Opening, h2: Section, li: HoverItem, Roadmap: Chosen })}
        />
      </div>
    </PageShell>
  );
}
