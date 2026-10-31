import type { MetadataRoute } from 'next';
import community from '@/lib/community.json';
import floeCommunity from '@/lib/floe-community.json';
import { datedReleases } from '@/lib/releases';
import { type ProductSlug, products, siteUrl } from '@/lib/shared';
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
    ['/floe', newest.floe],
    ['/floe/roadmap', newest.floe],
    ['/floe/community', Object.values(floeCommunity.readOn).sort().at(-1)],
    ['/floe/verified', Object.values(floeCommunity.readOn).sort().at(-1)],
    ['/community', read],
    ['/verified', read],
    ['/faq', undefined],
    ['/built-with', undefined],
    ['/roadmap', newest.thaw],
    ['/roadmap/thawui', newest.thaw],
    ['/privacy', undefined],
  ];
  const docs = source.getPages().filter((page) => page.slugs.at(-1) !== 'readme');
  return [
    ...site.map(([path, day]) => ({ url: `${siteUrl}${path}`, ...(day && { lastModified: day }) })),
    // A README is drawn on its product's own page, listed above, and not as a docs page.
    ...docs.map((page) => {
      const day =
        page.data.release?.date ?? (page.data.releaseIndex ? newest[page.slugs[0]] : undefined);
      return { url: `${siteUrl}${page.url}`, ...(day && { lastModified: day }) };
    }),
  ];
}
