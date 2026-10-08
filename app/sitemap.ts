import type { MetadataRoute } from 'next';
import community from '@/lib/community.json';
import { datedReleases } from '@/lib/releases';
import { docsRoute, type ProductSlug, products, siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

/**
 * Every page a search engine should know of: the site's own, then each docs page. A page
 * is given a date only where there is a true one: a release's own day, the changelog's
 * newest release, and for the pages that quote the project's numbers, the day those were
 * last read. A made-up date would be worse than none.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const read = Object.values(community.readOn).sort().at(-1);
  const newest = Object.fromEntries(
    (Object.keys(products) as ProductSlug[]).map((slug) => [slug, datedReleases(slug)[0]?.date]),
  );
  const site: [string, string | undefined][] = [
    ['/', read],
    ['/community', read],
    ['/verified', read],
    ['/built-with', undefined],
    ['/roadmap', newest.thaw],
    ['/privacy', undefined],
  ];
  return [
    ...site.map(([path, day]) => ({ url: `${siteUrl}${path}`, ...(day && { lastModified: day }) })),
    ...source.getPages().map((page) => {
      const day =
        page.data.release?.date ??
        (page.url === `${docsRoute}/${page.slugs[0]}/changelog`
          ? newest[page.slugs[0]]
          : undefined);
      return { url: `${siteUrl}${page.url}`, ...(day && { lastModified: day }) };
    }),
  ];
}
