import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Linked from the header, but out of the sitemap and search until release.
export const metadata: Metadata = {
  icons: { icon: '/icons/punkto-96.png', apple: '/icons/punkto-180.png' },
  robots: { index: false, follow: false },
  // Not Thaw's and Floe's release feeds, which the rest of the site points readers to.
  alternates: {},
};

// The browser's own bars take the page's ground (global.css, data-tone="punkto"), not the site's.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#08090a' },
  ],
};

// Outside the site's frame: no header, footer or papel picado.
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
