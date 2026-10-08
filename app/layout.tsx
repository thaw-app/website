import './global.css';
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { siteDescription, siteName, siteUrl } from '@/lib/shared';

// The text font, Innovator Grotesk, is declared in global.css.
const code = Geist_Mono({ subsets: ['latin'], variable: '--font-code' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  // Pages that do not name a picture of their own are shared with the site's.
  openGraph: { images: '/og/site/home/image.png' },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={code.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
