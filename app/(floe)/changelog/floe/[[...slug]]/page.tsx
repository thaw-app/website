import type { Metadata } from 'next';
import { ChangelogView, changelogMetadata, changelogPaths } from '@/components/changelog-page';

// Floe's changelog: the page Thaw's is, at /changelog/floe and under Floe's header.
export default async function FloeChangelogPage(props: PageProps<'/changelog/floe/[[...slug]]'>) {
  return <ChangelogView path={['floe', ...((await props.params).slug ?? [])]} />;
}

export function generateStaticParams() {
  return changelogPaths('floe').map((path) => ({ slug: path.slice(1) }));
}

export async function generateMetadata(
  props: PageProps<'/changelog/floe/[[...slug]]'>,
): Promise<Metadata> {
  return changelogMetadata(['floe', ...((await props.params).slug ?? [])]);
}
