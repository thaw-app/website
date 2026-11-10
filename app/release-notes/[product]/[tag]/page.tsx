import type { Metadata } from 'next';
import { ReleaseNotes, releaseNotesParams } from '@/components/changelog-page';
import type { ProductSlug } from '@/lib/shared';

// One release's notes and nothing round them, for the changelog to open under the release's
// line (components/release-row.tsx). Outside the site's route groups, so it is drawn without
// their header and footer. Every release is built ahead; any other address is not found.
export const dynamicParams = false;

export function generateStaticParams() {
  return releaseNotesParams();
}

// Not a page to be found by search: the release's own page is.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ReleaseNotesPage(props: PageProps<'/release-notes/[product]/[tag]'>) {
  const { product, tag } = await props.params;
  return <ReleaseNotes product={product as ProductSlug} tag={tag} />;
}
