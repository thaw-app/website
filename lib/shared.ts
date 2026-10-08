import { createGetUrl } from 'fumadocs-core/source';
import floeIcon from '@/assets/floe-icon.png';
import thawIcon from '@/assets/thaw-icon.png';

// Vercel names the production domain at build time; SITE_URL overrides it.
export const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');
export const siteName = 'Thaw';
export const siteDescription = 'Open source menu bar manager and launcher for macOS.';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Each product's app repo, which is also where its docs are written: see
// scripts/sync-docs.mjs. The key is the product's folder under content/docs.
export const products = {
  thaw: {
    name: 'Thaw',
    icon: thawIcon,
    description: 'The open source menu bar manager for macOS.',
    license: 'GPL-3.0',
    repo: 'thaw-app/Thaw',
    branch: process.env.THAW_DOCS_REF || 'development',
  },
  floe: {
    name: 'Floe',
    icon: floeIcon,
    description: 'The open source launcher for macOS.',
    license: 'AGPL-3.0',
    repo: 'thaw-app/Floe',
    branch: process.env.FLOE_DOCS_REF || 'main',
  },
} as const;

export type ProductSlug = keyof typeof products;

export function productOf(slugs: string[]) {
  const slug = slugs[0];
  return slug && slug in products ? products[slug as ProductSlug] : undefined;
}

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}

/** A product's repository on GitHub. */
export function repoUrl(product: keyof typeof products) {
  return `https://github.com/${products[product].repo}`;
}

/** Where the project lives outside this site. Each is written once, here. */
export const links = {
  discord: 'https://discord.gg/KDfWjWDnR4',
  crowdin: 'https://crowdin.com/project/thaw',
  sponsors: 'https://github.com/sponsors/stonerl',
};

/** A count as people say it: 11.8K, 365.4K. */
export const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** "2026-10-07" as "7 October 2026", for a date a person reads. */
export function longDate(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
