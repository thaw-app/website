import type { Metadata } from 'next';
import { RoadmapView } from '@/components/roadmap-page';
import Lists from '@/content/site/roadmap.mdx';
import { pageAlternates } from '@/lib/releases';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/roadmap', '/roadmap.md'),
  openGraph: { images: '/og/site/roadmap/image.png' },
  title: 'Roadmap',
  description:
    'What the Thaw team is working on now, what comes next, what macOS is holding back, and what has shipped.',
};

export default function RoadmapPage() {
  return <RoadmapView {...sitePages.roadmap} Lists={Lists} />;
}
