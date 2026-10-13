import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import Image from 'next/image';
import vercelOssDark from '@/assets/vercel-oss-dark.png';
import vercelOssLight from '@/assets/vercel-oss-light.png';
import { AsciiCube } from '@/components/ascii-cube';
import { ClaudeMark } from '@/components/claude-mark';
import { FaqPrompt } from '@/components/faq';
import { getMDXComponents } from '@/components/mdx';
import { PageFade } from '@/components/page-fade';
import { ProductHuntMark } from '@/components/product-hunt-mark';
import { ProductLanding, TryIt } from '@/components/product-landing';
import { latestStable, pageAlternates } from '@/lib/releases';
import { products, repoUrl, siteUrl } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { source } from '@/lib/source';
import { homeFaq, thawFaq } from '@/lib/thaw-faq';

// A free serif in the manner of the one Claude's own wordmark is set in.
// Three words low on the page: not worth a place in line ahead of the stylesheet.
const badgeFont = Newsreader({ subsets: ['latin'], weight: ['500'], preload: false });

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/'),
};

/**
 * What Thaw is, in the form search engines read (schema.org), so a result can show it as
 * an app: its name, that it is for macOS and free, its licence and where to get it. Only
 * what is true and on the page: no rating is given, because there is none to give.
 */
function structuredData() {
  const stable = latestStable('thaw');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: products.thaw.name,
    description: products.thaw.description,
    url: siteUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'macOS',
    ...(stable && { softwareVersion: stable.tag, datePublished: stable.date }),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://www.gnu.org/licenses/gpl-3.0.html',
    isAccessibleForFree: true,
    downloadUrl: `${repoUrl('thaw')}/releases`,
    codeRepository: repoUrl('thaw'),
    image: `${siteUrl}/icons/thaw-512.png`,
  };
}

export default function HomePage() {
  const readme = source.getPage(['thaw', 'readme']);
  if (!readme) throw new Error('The Thaw README was not synced; run scripts/sync-docs.mjs.');
  const Readme = readme.data.body;

  return (
    <PageFade>
      <main id="content" className="flex flex-1 flex-col">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: data for search engines, built here from the site's own values and with "<" escaped, as the Next.js guide has it
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c'),
          }}
        />
        <ProductLanding
          // Centred in the column, and sized so the headline and the lines under it fit one
          // screen with it: on a short window the cube gives up height before the words do.
          mark={
            <AsciiCube className="ascii-cube mx-auto w-full max-w-52 sm:max-w-64 lg:max-w-[min(20rem,max(12rem,calc(100dvh-37rem)))] xl:max-w-[min(21.5rem,max(12rem,calc(100dvh-37rem)))]" />
          }
          title={sitePages.home.title}
          lead="Take back your menu bar. Hide what you don’t need, and find anything in a keystroke."
          terms={[
            'Free under GPL-3.0, with no tracking and no account.',
            'When a new macOS comes out, you get an update, not an upgrade to buy.',
          ]}
          after={
            <>
              {/* The programmes that support Thaw's development, and where it was featured. */}
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pointer-coarse:gap-y-0.5">
                <a
                  href="https://vercel.com/open-source-program"
                  aria-label="Vercel OSS Program"
                  className="tap transition-opacity hover:opacity-70"
                >
                  <Image
                    src={vercelOssLight}
                    alt=""
                    width={240}
                    className="h-5 w-auto dark:hidden"
                  />
                  <Image
                    src={vercelOssDark}
                    alt=""
                    width={240}
                    className="hidden h-5 w-auto dark:block"
                  />
                </a>
                {/* Anthropic has no badge for this programme, so this one is laid out like
                Vercel's. The wording is the one the maintainers' READMEs use. */}
                <a
                  href="https://claude.com/contact-sales/claude-for-oss"
                  aria-label="Claude Open Source Program"
                  className="tap flex items-center gap-2.5 text-fd-foreground transition-opacity hover:opacity-70"
                >
                  <ClaudeMark className="size-5" />
                  <span className={`${badgeFont.className} text-base leading-none font-medium`}>
                    Claude Open Source Program
                  </span>
                </a>
                <a
                  href="https://www.producthunt.com/products/thaw-2"
                  aria-label="Featured on Product Hunt"
                  className="tap flex items-center gap-2.5 text-fd-foreground transition-opacity hover:opacity-70"
                >
                  <ProductHuntMark className="size-5" />
                  <span className="text-[15px] leading-none font-medium">
                    Featured on Product Hunt
                  </span>
                </a>
              </div>
            </>
          }
        >
          {/* Install, what it does and why to trust it: built from Thaw's README, synced from
            its repository like the docs are. */}
          <Readme components={getMDXComponents()} />
        </ProductLanding>

        <TryIt
          product="thaw"
          things={[
            'Click the dot in the menu bar',
            'Drag an item on the Layout pane',
            'Switch on the Thaw Bar',
          ]}
          phone="This is Thaw, rebuilt in the browser. It is too small to use on a phone: open this page on a Mac to click around in it."
        />

        {/* What people ask before installing has a page of its own; these are the first of
            them, and the way to it. */}
        <FaqPrompt questions={homeFaq} total={thawFaq.length} />
      </main>
    </PageFade>
  );
}
