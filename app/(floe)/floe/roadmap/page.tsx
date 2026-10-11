import type { Metadata } from 'next';
import { RoadmapView } from '@/components/roadmap-page';
import Lists from '@/content/site/floe-roadmap.mdx';
import { pageAlternates } from '@/lib/releases';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/floe/roadmap'),
  openGraph: { images: '/og/site/floeRoadmap/image.png' },
  title: 'Floe roadmap',
  description:
    'What comes next for Floe, what comes later, what is not planned, and what has shipped.',
};

export default function FloeRoadmapPage() {
  return <RoadmapView {...sitePages.floeRoadmap} Lists={Lists} product="floe" />;
}
