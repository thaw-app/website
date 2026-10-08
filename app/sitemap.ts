import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

/** Every page a search engine should know of: the site's own, then each docs page. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...['/', '/community', '/verified', '/built-with'].map((path) => ({
      url: `${siteUrl}${path}`,
    })),
    ...source.getPages().map((page) => ({ url: `${siteUrl}${page.url}` })),
  ];
}
