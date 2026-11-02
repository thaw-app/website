import type { Metadata } from 'next';
import { AsciiCube } from '@/components/ascii-cube';
import { floeMask } from '@/components/ascii-cube-mask';
import { JsonLd } from '@/components/json-ld';
import { getMDXComponents } from '@/components/mdx';
import { PapelPicado } from '@/components/papel-picado';
import { ProductLanding, TryIt } from '@/components/product-landing';
import { latestStable, pageAlternates } from '@/lib/releases';
import { products, repoUrl, siteUrl } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { source } from '@/lib/source';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/floe', '/floe.md'),
  openGraph: { images: '/og/site/floe/image.png' },
  title: 'Floe',
  description:
    'Floe is the open source launcher for macOS: one hotkey opens a search over your apps, commands and settings, and it runs Raycast extensions unmodified.',
};

/**
 * What Floe is, in the form search engines read (schema.org), as the home page says it of
 * Thaw. Only what is true and on the page.
 */
function structuredData() {
  const stable = latestStable('floe');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: products.floe.name,
    description: products.floe.description,
    url: `${siteUrl}/floe`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'macOS',
    ...(stable && { softwareVersion: stable.tag, datePublished: stable.date }),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    isAccessibleForFree: true,
    downloadUrl: `${repoUrl('floe')}/releases`,
    codeRepository: repoUrl('floe'),
  };
}

export default function FloePage() {
  const readme = source.getPage(['floe', 'readme']);
  if (!readme) throw new Error('The Floe README was not synced; run scripts/sync-docs.mjs.');
  const Readme = readme.data.body;

  return (
    <main id="content" data-tone="floe" className="flex flex-1 flex-col">
      <JsonLd data={structuredData()} />
      <ProductLanding
        // Floe's icon in characters and in its own blue, where Thaw's page has its cube. It
        // drifts where the cube melts.
        mark={
          <>
            <div className="in-season">
              <PapelPicado product="floe" />
            </div>
            <div className="off-season">
              <AsciiCube
                mask={floeMask}
                label="Floe’s icon, a floe of ice, drawn in text characters"
                className="ascii-floe"
                drift
              />
            </div>
          </>
        }
        title={sitePages.floe.title}
        lead="One hotkey, one search: your apps, commands, quicklinks and System Settings, and Raycast extensions, unmodified."
        terms={[
          'Free under AGPL-3.0, with no analytics and no account.',
          'Floe is early, and made by the people who make Thaw.',
        ]}
      >
        {/* How to get it and what it does: built from Floe's README, synced from its
            repository like the docs are. */}
        <Readme components={getMDXComponents()} />
      </ProductLanding>

      <TryIt
        product="floe"
        things={[
          'Type “settings” and press Return',
          'Search the web with a quicklink',
          'Press Control-Option-Space to close and reopen it',
        ]}
        phone="This is Floe, rebuilt in the browser. It is too small to use on a phone: open this page on a Mac to type into it."
      />
    </main>
  );
}
