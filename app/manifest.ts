import type { MetadataRoute } from 'next';
import { siteDescription, siteName } from '@/lib/shared';

/** What the site is called and looks like when a phone or a browser keeps it as an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: '/',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icons/thaw-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/thaw-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
