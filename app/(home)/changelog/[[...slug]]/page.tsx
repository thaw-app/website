import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { choiceClass } from '@/components/choice-style';
import { getMDXComponents } from '@/components/mdx';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ReleaseList, VersionReleases } from '@/components/release-list';
import { feedUrl, pageAlternates, pageTitle } from '@/lib/releases';
import {
  changelogSlugs,
  changelogUrl,
  getPageImageUrl,
  type ProductSlug,
  products,
} from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { source } from '@/lib/source';

/** The page an address under /changelog is for: a changelog, a version or one release. */
function pageAt(path?: string[]) {
  const page = source.getPage(changelogSlugs(path));
  // Thaw's has no name in its address, so one that names it is not an address of anything.
  if (!page || path?.[0] === 'thaw') notFound();
  return page;
}

export default async function ChangelogPage(props: PageProps<'/changelog/[[...slug]]'>) {
  const page = pageAt((await props.params).slug);
  const slug = page.slugs[0] as ProductSlug;
  const product = products[slug];
  const Notes = page.data.body;
  const release = page.data.release;
  // The line under the title often names the macOS already; it is not said twice.
  const forSystem =
    release?.os && !page.data.description?.includes(release.os) ? release.os : undefined;

  if (page.data.releaseIndex) {
    // A product with nothing released yet has no changelog to choose.
    const others = (Object.keys(products) as ProductSlug[]).filter((name) =>
      source.getPages().some((other) => other.slugs[0] === name && other.data.release),
    );
    return (
      <PageShell>
        <PageHeader
          label={sitePages.changelog.label}
          title={slug === 'thaw' ? sitePages.changelog.title : `Every release of ${product.name}.`}
        >
          <Lead>
            What changed in each release, newest first. The newest three have their notes written
            out. A line of an older one opens its notes under it.
          </Lead>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {others.length > 1 && (
              <nav aria-label="Whose changelog" className="flex flex-wrap gap-2">
                {others.map((name) => (
                  <Link
                    key={name}
                    href={changelogUrl(name)}
                    aria-current={name === slug ? 'page' : undefined}
                    className={choiceClass(name === slug)}
                  >
                    {products[name].name}
                  </Link>
                ))}
              </nav>
            )}
            <a href={feedUrl(slug)} className="tap link text-sm">
              Follow in a feed reader
            </a>
          </div>
        </PageHeader>
        <div>
          <ReleaseList product={slug} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <PageHeader
          label={`${product.name} changelog`}
          labelHref={changelogUrl(slug)}
          title={pageTitle(page)}
        >
          {page.data.description && <Lead>{page.data.description}</Lead>}
          {(forSystem || release?.url) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {forSystem && <span className="text-fd-muted-foreground">For {forSystem}</span>}
              {release?.url && (
                <a
                  href={release.url}
                  className="tap border px-3 py-1.5 font-medium transition-colors hover:bg-fd-accent"
                >
                  Downloads on GitHub
                </a>
              )}
            </div>
          )}
        </PageHeader>
        <div className={`prose max-w-none ${release ? 'release-notes' : ''}`}>
          <Notes components={getMDXComponents({ a: createRelativeLink(source, page) })} />
          {page.data.releaseGroup && (
            <VersionReleases product={slug} version={page.data.releaseGroup} />
          )}
          {/* A version's final release ends with the pre-releases that led up to it. */}
          {release?.final && <FinalReleaseTrail product={slug} version={release.version} />}
        </div>
      </article>
    </PageShell>
  );
}

function FinalReleaseTrail({ product, version }: { product: string; version: string }) {
  // VersionReleases draws nothing for a version with a single release.
  const any = source
    .getPages()
    .some(
      (page) =>
        page.slugs[0] === product &&
        page.data.release?.version === version &&
        !page.data.release.final,
    );
  if (!any) return null;
  return (
    <>
      <h2>Pre-releases</h2>
      <VersionReleases product={product} version={version} />
    </>
  );
}

export function generateStaticParams() {
  return source
    .getPages()
    .filter((page) => page.slugs[1] === 'changelog')
    .map((page) => ({ slug: page.url.split('/').slice(2) }));
}

export async function generateMetadata(
  props: PageProps<'/changelog/[[...slug]]'>,
): Promise<Metadata> {
  const page = pageAt((await props.params).slug);
  const own = page.data.releaseIndex && page.slugs[0] === 'thaw';
  return {
    title: own ? sitePages.changelog.label : pageTitle(page),
    description: page.data.description,
    // One address for the page, whichever domain it was reached on.
    alternates: pageAlternates(page.url),
    openGraph: { images: own ? '/og/site/changelog/image.png' : getPageImageUrl(page).url },
  };
}
