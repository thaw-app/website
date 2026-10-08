import { createGetUrl } from 'fumadocs-core/source';
import floeIcon from '@/assets/floe-icon.png';
import thawIcon from '@/assets/thaw-icon.png';
import project from './project.json';

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
// scripts/sync-docs.mjs. The key is the product's folder under content/docs. What a product
// is called, where it lives and its colour are in lib/project.json, which the scripts read
// too; what only a page needs is added here.
export const products = {
  thaw: {
    ...project.products.thaw,
    icon: thawIcon,
    description: 'The open source menu bar manager for macOS.',
    license: 'GPL-3.0',
    branch: process.env.THAW_DOCS_REF || project.products.thaw.ref,
  },
  floe: {
    ...project.products.floe,
    icon: floeIcon,
    description: 'The open source launcher for macOS.',
    license: 'AGPL-3.0',
    branch: process.env.FLOE_DOCS_REF || project.products.floe.ref,
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

/** Where the project lives outside this site. Each is written once, here or in project.json. */
export const links = {
  ...project.links,
  github: `https://github.com/${project.org}`,
  discord: `https://discord.gg/${project.discordInvite}`,
  /** The project's entry with OpenSSF, which holds its Best Practices badge and Baseline level. */
  bestPractices: `https://www.bestpractices.dev/projects/${project.bestPractices}`,
};

/** A count as people say it: 11.8K, 365.4K. */
export const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export { longDate, slug } from './format.mjs';
