import './global.css';
import type { Metadata } from 'next';
import { Fragment_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from '@/components/providers';
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
