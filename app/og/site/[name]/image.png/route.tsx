import { notFound } from 'next/navigation';
import { shareImage } from '@/lib/og';
import { type SitePage, sitePages } from '@/lib/site-pages';

export const revalidate = false;

// The pictures a link to one of the site's own pages is shared with. The docs draw theirs
// from each page (app/og/docs).
export async function GET(_req: Request, { params }: RouteContext<'/og/site/[name]/image.png'>) {
  const { name } = await params;
  if (!(name in sitePages)) notFound();
  const page = sitePages[name as SitePage];
  // A headline ends in a full stop on its page; alone on a picture it reads better without.
  return shareImage({
    title: page.title.replace(/\.$/, ''),
    description: page.shared,
    withCube: true,
  });
}

export function generateStaticParams() {
  return Object.keys(sitePages).map((name) => ({ name }));
}
