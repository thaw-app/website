import { notFound } from 'next/navigation';
import { datedReleases, feedTitle, feedUrl } from '@/lib/releases';
import { docsRoute, type ProductSlug, products, siteUrl } from '@/lib/shared';

export const revalidate = false;

// What a feed reader is given must not end a tag early or start one.
const xml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A product's releases as an Atom feed, newest first, so they can be followed in a feed
 * reader: each entry is a release, with the channel it is on, the macOS it runs on and a
 * link to its notes on this site. Written when the site is built, like the changelog.
 */
export async function GET(_req: Request, { params }: RouteContext<'/feed/[name]'>) {
  const product = (await params).name.replace(/\.xml$/, '');
  if (!(product in products)) notFound();
  const slug = product as ProductSlug;
  const releases = datedReleases(slug).slice(0, 40);
  const changelog = `${siteUrl}${docsRoute}/${slug}/changelog`;
  const self = `${siteUrl}${feedUrl(slug)}`;

  const entries = releases.map((release) => {
    const link = `${siteUrl}${release.url}`;
    // A release's own line already says its macOS; one without is given its channel and macOS.
    const said = release.summary ?? [release.channel, release.os].filter(Boolean).join(' · ');
    return [
      '  <entry>',
      `    <title>${xml(`${products[slug].name} ${release.tag}`)}</title>`,
      `    <link href="${xml(link)}"/>`,
      `    <id>${xml(link)}</id>`,
      `    <updated>${release.date}T00:00:00Z</updated>`,
      `    <summary>${xml(said)}</summary>`,
      '  </entry>',
    ].join('\n');
  });

  const feed = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${xml(feedTitle(slug))}</title>`,
    `  <subtitle>${xml(products[slug].description)}</subtitle>`,
    `  <link href="${xml(changelog)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${xml(self)}"/>`,
    `  <id>${xml(changelog)}</id>`,
    `  <updated>${releases[0]?.date ?? '1970-01-01'}T00:00:00Z</updated>`,
    `  <author><name>${xml(`The ${products[slug].name} team`)}</name></author>`,
    ...entries,
    '</feed>',
    '',
  ].join('\n');

  return new Response(feed, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}

export function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ name: `${slug}.xml` }));
}
