import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/og/'],
      // What the site's text may be used for (contentsignals.org): all of it is open, so an
      // AI tool can answer questions about Thaw from the docs as they are.
      other: { 'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes' },
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
