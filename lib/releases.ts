import { type ProductSlug, products } from './shared';
import { source } from './source';

/**
 * A product's published releases that have a date, newest first: what the changelog
 * feed lists, and where the home page and the sitemap learn what the latest one is.
 */
export function datedReleases(product: ProductSlug) {
  return source
    .getPages()
    .flatMap((page) => {
      const release = page.data.release;
      return page.slugs[0] === product && release?.date
        ? [{ ...release, date: release.date, url: page.url, summary: release.summary }]
        : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order);
}

/** The newest release on the stable channel, if the product has one. */
export function latestStable(product: ProductSlug) {
  return datedReleases(product).find((release) => release.channel === 'Stable');
}

/** Where a product's changelog can be followed in a feed reader. */
export function feedUrl(product: ProductSlug) {
  return `/feed/${product}.xml`;
}

export const feedTitle = (product: ProductSlug) => `${products[product].name} releases`;

/**
 * A page's own address, with the feeds beside it. A page that names its address replaces
 * what the root layout says here and does not add to it, so the feeds are said again.
 */
export function pageAlternates(canonical: string) {
  return {
    canonical,
    types: {
      'application/atom+xml': (Object.keys(products) as ProductSlug[]).map((slug) => ({
        url: feedUrl(slug),
        title: feedTitle(slug),
      })),
    },
  };
}
