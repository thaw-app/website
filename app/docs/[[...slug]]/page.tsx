import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { pageAlternates, pageTitle } from '@/lib/releases';
import { docsRoute, getPageImageUrl, getPageMarkdownUrl, productOf } from '@/lib/shared';
import { source } from '@/lib/source';

/** The product whose copy of a shared page is the one search engines are pointed to. */
const sharedHome = 'thaw';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  // The changelog is the site's own page (app/(home)/changelog), not a docs page.
  if (!page || page.slugs[1] === 'changelog') notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const product = productOf(page.slugs);

  return (
    // A column of reading width, at the left of the space it has: lines of about ninety
    // characters at most, and room beside them.
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      // A page with no headings to list gives that column back to its text.
      tableOfContent={{ enabled: page.data.toc.length > 0 }}
      className="max-w-[52rem]"
    >
      {/* global.css reads this to give the page its product's colour. */}
      <span hidden data-product={page.slugs[0]} />
      {/* The title, with what can be done with the page beside it and not on a row of its own. */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <DocsTitle className="text-4xl leading-[1.15] tracking-tight">{pageTitle(page)}</DocsTitle>
        <div className="flex flex-row items-center gap-2 pt-1">
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
      </div>
      {/* A synced page opens with the paragraph its description was taken from. */}
      {!page.data.source && (
        <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      )}
      {/* No rule parts the head from the page: a little room does it. */}
      <DocsBody className="mt-4">
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams().filter((params) => params.slug[1] !== 'changelog');
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: pageTitle(page),
    description: page.data.description,
    // One address for the page, whichever domain it was reached on. A shared page is the
    // same under every product, so search engines are given the one copy's.
    alternates: pageAlternates(
      page.data.shared
        ? `${docsRoute}/${[sharedHome, ...page.slugs.slice(1)].join('/')}`
        : page.url,
    ),
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
