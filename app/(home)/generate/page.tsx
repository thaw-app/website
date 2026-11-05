import type { Metadata } from 'next';
import { IconGenerator } from '@/components/icon-generator';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { pageAlternates } from '@/lib/releases';

export const metadata: Metadata = {
  title: 'Make your own Thaw icon',
  description:
    'A Thaw app icon of your own: the cube in an aura, a sketch, a blueprint, ink or papel picado. Made in your browser.',
  alternates: pageAlternates('/generate'),
};

/** A small thing to play with: an app icon of your own for Thaw. */
export default function GeneratePage() {
  return (
    <PageShell>
      <PageHeader label="Icon generator" title="Make your own Thaw icon.">
        <Lead>
          Give Thaw an app icon of your own. Start from the one it ships with, or draw the cube as
          an aura, a sketch, a blueprint, in ink or cut from paper. When you like it, press Copy,
          select Thaw in Finder, press ⌘I, click the small icon at the top of the window and paste.
          An update can put the original back, so keep the file. It is all drawn in your browser,
          and nothing is sent anywhere.
        </Lead>
      </PageHeader>
      <IconGenerator />
    </PageShell>
  );
}
