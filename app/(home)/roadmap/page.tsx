import { Heading } from 'fumadocs-ui/components/heading';
import type { Metadata } from 'next';
import type { ComponentProps } from 'react';
import { getMDXComponents } from '@/components/mdx';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import Lists from '@/content/site/roadmap.mdx';
import { pageAlternates } from '@/lib/releases';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/roadmap'),
  openGraph: { images: '/og/site/roadmap/image.png' },
  title: 'Roadmap',
  description:
    'What the Thaw team is working on now, what comes next, what macOS is holding back, and what has shipped.',
};

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

export default function RoadmapPage() {
  return (
    <PageShell>
      <div>
        <PageHeader {...sitePages.roadmap} className="mb-4" />
        <Lists components={getMDXComponents({ p: Opening, h2: Section })} />
      </div>
    </PageShell>
  );
}
