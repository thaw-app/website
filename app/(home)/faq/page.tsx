import type { Metadata } from 'next';
import { FaqList, faqData } from '@/components/faq';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { pageAlternates } from '@/lib/releases';
import { repoUrl } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { thawFaq } from '@/lib/thaw-faq';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/faq'),
  openGraph: { images: '/og/site/faq/image.png' },
  title: 'Frequently asked questions',
  description:
    'Whether Thaw is free, which macOS it needs, what its permissions are for, and how to remove it.',
};

/**
 * The questions people ask before they install Thaw, behind "Questions? Look here." on the
 * home page. They are given to search engines in the same words (schema.org's FAQPage).
 */
export default function FaqPage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: data for search engines, built here from the site's own values and with "<" escaped, as the Next.js guide has it
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData(thawFaq)).replace(/</g, '\\u003c'),
        }}
      />
      <PageHeader {...sitePages.faq}>
        <Lead>
          What people ask before they install Thaw. If yours is not here,{' '}
          <a href={`${repoUrl('thaw')}/issues`} className="tap text-fd-foreground link">
            ask on GitHub
          </a>
          .
        </Lead>
      </PageHeader>
      <FaqList questions={thawFaq} />
    </PageShell>
  );
}
