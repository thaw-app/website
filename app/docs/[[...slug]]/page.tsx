import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { ReleaseList, VersionReleases } from '@/components/release-list';
import { docsRoute, getPageImageUrl, getPageMarkdownUrl, productOf } from '@/lib/shared';
import { source } from '@/lib/source';

/** The product whose copy of a shared page is the one search engines are pointed to. */
const sharedHome = 'thaw';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const product = productOf(page.slugs);

  return (
    // Fumadocs caps a page at 900px; here it runs to the right edge of its column.
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      // A page with no headings to list gives that column back to its text.
      tableOfContent={{ enabled: page.data.toc.length > 0 }}
      className="max-w-none"
    >
      {/* global.css reads this to give the page its product's colour. */}
      <span hidden data-product={page.slugs[0]} />
      <DocsTitle>{pageTitle(page)}</DocsTitle>
      {/* A synced page opens with the paragraph its description was taken from. */}
      {(!page.data.source ||
        page.data.release ||
        page.data.releaseIndex ||
        page.data.releaseGroup) && (
        <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      )}
      {page.data.release?.os && (
        <p className="text-sm text-fd-muted-foreground">For {page.data.release.os}</p>
      )}
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        {page.data.release?.url && (
          <a
            href={page.data.release.url}
            className="border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Downloads on GitHub
          </a>
        )}
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={
            page.data.sourceUrl ??
            (product &&
              page.data.source &&
              `https://github.com/${product.repo}/blob/${product.branch}/${page.data.source}`)
          }
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
        {page.data.releaseIndex && <ReleaseList product={page.slugs[0]} />}
        {page.data.releaseGroup && (
          <VersionReleases product={page.slugs[0]} version={page.data.releaseGroup} />
        )}
        {/* A version's final release ends with the pre-releases that led up to it. */}
        {page.data.release?.final && (
          <FinalReleaseTrail product={page.slugs[0]} version={page.data.release.version} />
        )}
      </DocsBody>
    </DocsPage>
  );
}

function FinalReleaseTrail({ product, version }: { product: string; version: string }) {
  const list = <VersionReleases product={product} version={version} />;
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
      {list}
    </>
  );
}

/** A release's page is titled by its tag alone, which needs the product's name beside it. */
function pageTitle(page: NonNullable<ReturnType<typeof source.getPage>>) {
  const product = productOf(page.slugs);
  // A release named in words, such as "macOS 27 Preview 3", is left as it is.
  const numbered = page.data.release
    ? /^\d/.test(page.data.title)
    : page.data.releaseGroup && /^\d/.test(page.data.title);
  return numbered && product ? `${product.name} ${page.data.title}` : page.data.title;
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: pageTitle(page),
    description: page.data.description,
    // A shared page is the same under every product, so search engines are given one address for it.
    ...(page.data.shared && {
      alternates: { canonical: `${docsRoute}/${[sharedHome, ...page.slugs.slice(1)].join('/')}` },
    }),
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
