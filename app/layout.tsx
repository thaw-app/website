import './global.css';
import type { Metadata, Viewport } from 'next';
import { Fragment_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from '@/components/providers';
import { pageAlternates } from '@/lib/releases';
import { siteDescription, siteName, siteUrl } from '@/lib/shared';

// Both are open fonts, fetched at build time and served from the site itself.
const text = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-text' });
// Fragment Mono is drawn in one weight only.
const code = Fragment_Mono({ subsets: ['latin'], weight: '400', variable: '--font-code' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  // Pages that do not name a picture of their own are shared with the site's.
  openGraph: { images: '/og/site/home/image.png' },
  // Each product's releases, for a feed reader to find from any page.
  alternates: { types: pageAlternates('/').types },
};

// The colour a browser gives its own bars round the page: the page's ground in each theme.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${text.variable} ${code.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
