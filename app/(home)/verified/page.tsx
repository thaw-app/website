import type { Metadata } from 'next';
import { VerifiedView } from '@/components/verified-page';
import { pageAlternates } from '@/lib/releases';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/verified', '/verified.md'),
  openGraph: { images: '/og/site/verified/image.png' },
  title: 'What Verified means',
  description:
    'What SLSA, the OpenSSF badges, the Scorecard and test coverage are, who vouches for each, and where Thaw stands.',
};

export default function VerifiedPage() {
  return <VerifiedView product="thaw" />;
}
