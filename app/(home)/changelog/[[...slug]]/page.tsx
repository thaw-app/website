import type { Metadata } from 'next';
import { ChangelogView, changelogMetadata, changelogPaths } from '@/components/changelog-page';

// Thaw's changelog. Floe's is the same page under Floe's own header: app/(floe)/changelog.
export default async function ChangelogPage(props: PageProps<'/changelog/[[...slug]]'>) {
  return <ChangelogView path={(await props.params).slug} />;
}

export function generateStaticParams() {
  return changelogPaths('thaw').map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<'/changelog/[[...slug]]'>,
): Promise<Metadata> {
  return changelogMetadata((await props.params).slug);
}
