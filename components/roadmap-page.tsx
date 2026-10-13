import { Heading } from 'fumadocs-ui/components/heading';
import type { MDXContent } from 'mdx/types';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { choiceClass } from '@/components/choice-style';
import { HoverItem } from '@/components/hover-lines';
import { getMDXComponents } from '@/components/mdx';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Roadmap } from '@/components/roadmap';
import { type ProductSlug, products } from '@/lib/shared';

// Where each product's roadmap is.
const roadmaps: Record<ProductSlug, string> = { thaw: '/roadmap', floe: '/floe/roadmap' };

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

/** Whose roadmap this is, and the way to the other's: the choice the changelog has. */
function Whose({ product }: { product: ProductSlug }) {
  return (
    <nav aria-label="Whose roadmap" className="not-prose mt-6 flex flex-wrap gap-2">
      {(Object.keys(roadmaps) as ProductSlug[]).map((name) => (
        <Link
          key={name}
          href={roadmaps[name]}
          aria-current={name === product ? 'page' : undefined}
          className={choiceClass(name === product)}
        >
          {products[name].name}
        </Link>
      ))}
    </nav>
  );
}

/**
 * A product's roadmap: its headline, then the lists as written in content/site. Thaw's and
 * Floe's are this page with different lists, and Floe's is drawn in its own accent.
 */
export function RoadmapView({
  label,
  title,
  Lists,
  product = 'thaw',
}: {
  label: string;
  title: string;
  Lists: MDXContent;
  product?: ProductSlug;
}) {
  // The choice of product sits under the opening lines and over the lists, which is where
  // the lists' own row of counts begins.
  const Chosen = (props: ComponentProps<typeof Roadmap>) => (
    <>
      <Whose product={product} />
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
