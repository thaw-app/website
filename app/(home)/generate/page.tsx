import type { Metadata } from 'next';
import { IconGenerator } from '@/components/icon-generator';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { pageAlternates } from '@/lib/releases';

export const metadata: Metadata = {
  title: 'Make a Thaw icon',
  description:
    'Thaw’s cube on any shape and background, for a profile picture, a slide or a favicon. Made in your browser.',
  alternates: pageAlternates('/generate'),
};

/** A small thing to play with: the cube from the app icon, made into an icon of your own. */
export default function GeneratePage() {
  return (
    <PageShell>
      <PageHeader label="Icon generator" title="Make a Thaw icon.">
        <Lead>
          The cube from the app icon, on any shape and background: for a profile picture, a slide, a
          favicon or a Mac. It is drawn in your browser, and nothing is sent anywhere.
        </Lead>
      </PageHeader>
      <IconGenerator />
    </PageShell>
  );
}
