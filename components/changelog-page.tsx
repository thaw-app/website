import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getMDXComponents } from '@/components/mdx';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ProductChoice } from '@/components/product-choice';
import {
  hasEarlierReleases,
  ReleaseList,
  ReleaseSteps,
  VersionReleases,
} from '@/components/release-list';
import { ReleasePeople } from '@/components/release-people';
import { tagSaysChannel } from '@/lib/channels';
import { commitOf, feedUrl, pageAlternates, pageTitle } from '@/lib/releases';
import {
  changelogRoute,
  changelogUrl,
  getPageImageUrl,
  longDate,
  type ProductSlug,
  products,
  tabTitle,
} from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { source } from '@/lib/source';

/** The page an address under /changelog is for: a changelog, a version or one release. */
function pageAt(path: string[] = []) {
  // Found by its address, since a release's address leaves out the folder it is filed in.
  const url = [changelogRoute, ...path].join('/');
  const page = source
    .getPages()
    .find((candidate) => candidate.slugs[1] === 'changelog' && candidate.url === url);
  if (!page) notFound();
  return page;
}

/**
 * The page at an address under /changelog, given what follows /changelog in it. Thaw's and
 * Floe's are the same page under different headers, so each has a route that draws this.
 */
export function ChangelogView({ path }: { path?: string[] }) {
  const page = pageAt(path);
  const slug = page.slugs[0] as ProductSlug;
  const product = products[slug];
  const Notes = page.data.body;
  const release = page.data.release;
  const commit = release?.commit ? commitOf(slug, release.commit) : undefined;
  // A release's description is its particulars ("6 November 2026 · macOS 27 only · Build
  // 63"), sometimes with a name. The fields under the title say the particulars, so only
  // the rest of it is said as a line.
  const parts = page.data.description?.split(' · ') ?? [];
  const build = release && parts.find((part) => /^Build \d+$/.test(part))?.slice(6);
  const lead = release
    ? parts
        .filter(
          (part) =>
            !/^Build \d+$/.test(part) &&
            !part.startsWith('macOS') &&
            !(release.date && part === longDate(release.date)),
        )
        .join(' · ')
    : page.data.description;

  if (page.data.releaseIndex) {
    // A product with nothing released yet has no changelog to choose.
    const others = (Object.keys(products) as ProductSlug[]).filter((name) =>
      source.getPages().some((other) => other.slugs[0] === name && other.data.release),
    );
    return (
      <PageShell tone={slug}>
        <PageHeader
          label={sitePages.changelog.label}
          title={slug === 'thaw' ? sitePages.changelog.title : `Every release of ${product.name}.`}
        >
          <Lead>
            What changed in each release, newest first.
            {/* Only said of a changelog long enough to have older releases folded away. */}
            {hasEarlierReleases(slug) &&
              ' The newest has its notes written out. A line of an older one opens its notes under it.'}
          </Lead>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {others.length > 1 && (
              <ProductChoice
                label="Whose changelog"
                choices={others.map((name) => ({
                  name: products[name].name,
                  href: changelogUrl(name),
                }))}
                current={products[slug].name}
              />
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
    <PageShell tone={slug}>
      <article className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <PageHeader
          // The title names the product already ("Thaw 2.2.0"), so the label above it does not.
          label={sitePages.changelog.label}
          labelHref={changelogUrl(slug)}
          title={pageTitle(page)}
        >
          {lead && <Lead>{lead}</Lead>}
          {release && <ReleaseProperties release={release} commit={commit} build={build} />}
        </PageHeader>
        <div className={`prose max-w-none ${release ? 'release-notes' : ''}`}>
          <Notes components={getMDXComponents({ a: createRelativeLink(source, page) })} />
          {page.data.releaseGroup && (
            <VersionReleases product={slug} version={page.data.releaseGroup} />
          )}
          {/* A version's final release ends with the pre-releases that led up to it. */}
          {release?.final && <FinalReleaseTrail product={slug} version={release.version} />}
        </div>
        {release && <ReleaseSteps product={slug} url={page.url} />}
      </article>
    </PageShell>
  );
}

type Release = NonNullable<ReturnType<typeof pageAt>['data']['release']>;

/**
 * A release's particulars as a list of named fields under its title, as a Notion page has
 * its properties: when, which channel, which macOS, what it was built from, and who it
 * credits, and where to download it. A field the release does not have is left out.
 */
function ReleaseProperties({
  release,
  commit,
  build,
}: {
  release: Release;
  commit?: { url: string; short: string };
  build?: string;
}) {
  const fields: { name: string; value: ReactNode }[] = [
    release.date && {
      name: 'Released',
      value: <time dateTime={release.date}>{longDate(release.date)}</time>,
    },
    // A channel the number spells ("2.2.0-beta.2") is not said again.
    !tagSaysChannel(release.tag, release.channel) && { name: 'Channel', value: release.channel },
    release.os && { name: 'Runs on', value: release.os },
    build && { name: 'Build', value: build },
    commit && {
      name: 'Built from',
      value: (
        <a href={commit.url} className="tap link font-mono">
          {commit.short}
        </a>
      ),
    },
    // What changed in code since the release GitHub compares it with, on GitHub.
    release.compare && {
      name: 'Changes since',
      value: (
        <a href={release.compare.url} className="tap link font-mono">
          {release.compare.from}
        </a>
      ),
    },
    // A plain link, like the commit's: the downloads are one of its particulars.
    release.url && {
      name: 'Download',
      value: (
        <a href={release.url} className="tap link">
          GitHub
        </a>
      ),
    },
    // Eight pictures and a count of the rest, so the line stays one line high; the notes name
    // everyone.
    release.people && {
      name: 'Credited',
      value: <ReleasePeople people={release.people} max={8} />,
    },
  ].filter((field) => !!field);

  return (
    // A spec list: each field's name and its value on a line, in two columns where there is
    // room, filled across.
    <dl className="not-prose grid text-sm md:grid-cols-2 md:gap-x-10">
      {fields.map((field) => (
        <div
          key={field.name}
          className="grid min-h-9 grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-4 py-1"
        >
          <dt className="text-fd-muted-foreground">{field.name}</dt>
          <dd className="text-fd-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
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

/** Every address under /changelog that is one product's, as what follows /changelog in it. */
export function changelogPaths(product: ProductSlug) {
  const pages = source.getPages().filter((page) => page.slugs[1] === 'changelog');
  // Two releases with one tag would share an address, and one would never be seen.
  const twice = pages.find((page, index) => pages.findIndex((p) => p.url === page.url) !== index);
  if (twice) throw new Error(`Two changelog pages share the address ${twice.url}`);
  return pages
    .filter((page) => page.slugs[0] === product)
    .map((page) => page.url.split('/').slice(2));
}

export function changelogMetadata(path?: string[]): Metadata {
  const page = pageAt(path);
  const own = page.data.releaseIndex && page.slugs[0] === 'thaw';
  const title = page.data.releaseIndex
    ? own
      ? sitePages.changelog.label
      : `${products[page.slugs[0] as ProductSlug].name} changelog`
    : pageTitle(page);
  return {
    title: tabTitle(title),
    description: page.data.description,
    // One address for the page, whichever domain it was reached on.
    alternates: pageAlternates(page.url),
    openGraph: { images: own ? '/og/site/changelog/image.png' : getPageImageUrl(page).url },
  };
}
