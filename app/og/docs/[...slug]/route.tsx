import { notFound } from 'next/navigation';
import { shareImage } from '@/lib/og';
import { getPageImageUrl } from '@/lib/shared';
import { source } from '@/lib/source';

export const revalidate = false;
// An address that was not built is not there, and is not rendered on request.
export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return shareImage({
    title: page.data.title,
    description: page.data.description,
    product: page.slugs[0] === 'floe' ? 'floe' : 'thaw',
    label: 'Docs',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImageUrl(page).segments,
  }));
}
