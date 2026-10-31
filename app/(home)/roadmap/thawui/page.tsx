import type { Metadata } from 'next';
import { RoadmapView } from '@/components/roadmap-page';
import Lists from '@/content/site/thawui-roadmap.mdx';
import { pageAlternates } from '@/lib/releases';
import { sitePages } from '@/lib/site-pages';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/roadmap/thawui', '/roadmap/thawui.md'),
  openGraph: { images: '/og/site/thawuiRoadmap/image.png' },
  title: 'ThawUI roadmap',
  description: 'The design Thaw and Floe share: what is being built and what has shipped.',
};

export default function ThawUIRoadmapPage() {
  return <RoadmapView {...sitePages.thawuiRoadmap} Lists={Lists} whose="ThawUI" />;
}
