import Image from 'next/image';
import Link from 'next/link';
import community from '@/lib/community.json';
import { feedUrl } from '@/lib/releases';
import {
  changelogUrl,
  compact,
  docsRoute,
  links,
  type ProductSlug,
  products,
  repoUrl,
} from '@/lib/shared';
import { FooterArt } from './footer-art';

interface Foot {
  about: string;
  /** How many stars the repository has, where the sync reads it. */
  stars?: number;
  license: string;
  columns: { title: string; links: { text: string; href: string }[] }[];
  policies: { text: string; href: string }[];
}

const thawDocs = `${docsRoute}/thaw`;
const floeDocs = `${docsRoute}/floe`;

// The whole site at a glance, in columns, as a map of it: the product, its docs, the people
// and the project's rules. Thaw's are seven or eight to a column;
// Floe's are shorter, as Floe has fewer pages.
const feet: Record<ProductSlug, Foot> = {
  thaw: {
    about:
      'The open source menu bar manager for macOS. It is free, it doesn’t track you, and you don’t need an account.',
    stars: typeof community.stars === 'number' ? community.stars : undefined,
    license: 'GPL-3.0',
    columns: [
      {
        title: 'Thaw',
        links: [
          { text: 'Install', href: '/' },
          { text: 'Try it in your browser', href: '/#try' },
          { text: 'Questions', href: '/faq' },
          { text: 'Changelog', href: '/changelog' },
          { text: 'Release feed', href: feedUrl('thaw') },
          { text: 'Roadmap', href: '/roadmap' },
          { text: 'Built with', href: '/built-with' },
          { text: 'Floe, the launcher', href: '/floe' },
        ],
      },
      {
        title: 'Docs',
        links: [
          { text: 'Thaw documentation', href: thawDocs },
          { text: 'Getting started', href: `${thawDocs}/getting-started` },
          { text: 'Frequent issues', href: `${thawDocs}/frequent-issues` },
          { text: 'URL schemes', href: `${thawDocs}/uri-schemes` },
          { text: 'Verifying releases', href: `${thawDocs}/verifying-releases` },
          { text: 'What Verified means', href: '/verified' },
          { text: 'Architecture', href: `${thawDocs}/architecture` },
        ],
      },
      {
        title: 'Community',
        links: [
          { text: 'Who builds Thaw', href: '/community' },
          { text: 'Contributing', href: `${thawDocs}/contribute` },
          { text: 'Discord', href: links.discord },
          { text: 'GitHub', href: repoUrl('thaw') },
          { text: 'Report a problem', href: `${repoUrl('thaw')}/issues` },
          { text: 'Translate on Crowdin', href: links.crowdin },
          { text: 'Sponsor', href: links.sponsors },
        ],
      },
    ],
    policies: [
      { text: 'Privacy', href: '/privacy' },
      { text: 'Security', href: `${thawDocs}/security` },
      { text: 'Code of Conduct', href: `${thawDocs}/contribute/code-of-conduct` },
      { text: 'Governance', href: `${thawDocs}/governance` },
    ],
  },
  floe: {
    about:
      'The open source launcher for macOS. It is free, it has no analytics, and you don’t need an account.',
    license: 'AGPL-3.0',
    columns: [
      {
        title: 'Floe',
        links: [
          { text: 'Install', href: '/floe' },
          { text: 'Try it in your browser', href: '/floe#try' },
          { text: 'Changelog', href: changelogUrl('floe') },
          { text: 'Release feed', href: feedUrl('floe') },
          { text: 'Roadmap', href: '/floe/roadmap' },
          { text: 'Thaw, the menu bar manager', href: '/' },
        ],
      },
      {
        title: 'Docs',
        links: [
          { text: 'Floe documentation', href: floeDocs },
          { text: 'What Floe does not do yet', href: `${floeDocs}/limitations` },
          { text: 'Developing Floe', href: `${floeDocs}/development` },
          { text: 'Security policy', href: `${floeDocs}/security` },
        ],
      },
      {
        title: 'Community',
        links: [
          { text: 'Who builds Thaw', href: '/community' },
          { text: 'Contributing', href: `${floeDocs}/contribute` },
          { text: 'Discord', href: links.discord },
          { text: 'GitHub', href: repoUrl('floe') },
          { text: 'Report a problem', href: `${repoUrl('floe')}/issues` },
        ],
      },
    ],
    policies: [
      { text: 'Privacy', href: '/privacy' },
      { text: 'Security', href: `${floeDocs}/security` },
      { text: 'Code of Conduct', href: `${floeDocs}/contribute/code-of-conduct` },
      {
        text: 'Governance',
        href: `${repoUrl('floe')}/blob/${products.floe.branch}/.github/GOVERNANCE.md`,
      },
    ],
  },
};

/** The foot of every page outside the docs: what the product is, a map of the site, and its licence. */
export function SiteFooter({
  product = 'thaw',
  conure = true,
}: {
  product?: ProductSlug;
  /** Whether the conure comes by. Not on a page where it is already somewhere else. */
  conure?: boolean;
}) {
  const { about, stars, license, columns, policies } = feet[product];
  const { name, icon, branch } = products[product];
  const repo = repoUrl(product);
  return (
    <footer className="border-t">
      <div className="grid w-full gap-x-16 gap-y-12 px-6 py-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:px-10">
        <div className="flex flex-col items-start gap-5">
          <Image src={icon} alt="" width={32} className="size-8" />
          <p className="max-w-sm text-fd-muted-foreground text-pretty">{about}</p>
          <a
            href={repo}
            className="tap press flex items-center gap-3 border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Star {name} on GitHub
            {stars !== undefined && (
              <span className="text-fd-muted-foreground">{compact.format(stars)}</span>
            )}
          </a>
        </div>

        <nav
          aria-label="Site map"
          className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:gap-x-16"
        >
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium">{column.title}</h2>
              <ul className="flex flex-col gap-2 text-sm text-fd-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.href}
                      className="tap transition-colors hover:text-fd-foreground"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t">
        <div className="flex w-full flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-6 py-5 text-sm text-fd-muted-foreground lg:px-10">
          <p>
            © {new Date().getFullYear()} {name}. Open source under the{' '}
            <a href={`${repo}/blob/${branch}/LICENSE`} className="tap text-fd-foreground link">
              {license} licence
            </a>
            .
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {policies.map((policy) => (
              <li key={policy.text}>
                <Link href={policy.href} className="tap transition-colors hover:text-fd-foreground">
                  {policy.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Both products' names in moving type, running off the bottom of the page, with a
          conure that comes by to sit on them. */}
      <FooterArt conure={conure} />
    </footer>
  );
}
