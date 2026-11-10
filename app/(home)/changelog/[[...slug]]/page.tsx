import type { Metadata } from 'next';
import { ChangelogView, changelogMetadata, changelogPaths } from '@/components/changelog-page';

// Thaw's changelog. Floe's is the same page under Floe's own header: app/(floe)/changelog.
export default async function ChangelogPage(props: PageProps<'/changelog/[[...slug]]'>) {
  return <ChangelogView path={(await props.params).slug} />;
}

// An address that was not built is not there, and is not rendered on request.
export const dynamicParams = false;

export function generateStaticParams() {
  return changelogPaths('thaw').map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<'/changelog/[[...slug]]'>,
): Promise<Metadata> {
  return changelogMetadata((await props.params).slug);
}
