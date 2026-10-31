import type { Metadata } from 'next';
import { VerifiedView } from '@/components/verified-page';
import { pageAlternates } from '@/lib/releases';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/floe/verified', '/floe/verified.md'),
  openGraph: { images: '/og/site/floeVerified/image.png' },
  title: 'What Verified means for Floe',
  description:
    'What SLSA, the OpenSSF badges, the Scorecard and test coverage are, who vouches for each, and where Floe stands.',
};

export default function FloeVerifiedPage() {
  return <VerifiedView product="floe" />;
}
