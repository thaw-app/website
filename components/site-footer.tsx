import Image from 'next/image';
import Link from 'next/link';
import community from '@/lib/community.json';
import { compact, docsRoute, links, products, repoUrl } from '@/lib/shared';
import { FooterConure } from './footer-conure';
import { FooterWordmark } from './footer-wordmark';

const docs = `${docsRoute}/thaw`;
const repo = repoUrl('thaw');

// The whole site at a glance, in columns, as a map of it: the product, its docs, the people
// and the project's rules.
const columns = [
  {
    title: 'Thaw',
    links: [
      { text: 'Install', href: '/' },
      { text: 'Try it in your browser', href: '/#try' },
      { text: 'Changelog', href: `${docs}/changelog` },
      { text: 'Roadmap', href: '/roadmap' },
      { text: 'What Verified means', href: '/verified' },
      { text: 'Built with', href: '/built-with' },
      { text: 'Floe, the launcher', href: `${docsRoute}/floe` },
    ],
  },
  {
    title: 'Docs',
    links: [
      { text: 'Thaw documentation', href: docs },
      { text: 'Frequent issues', href: `${docs}/frequent-issues` },
      { text: 'URL schemes', href: `${docs}/uri-schemes` },
      { text: 'Verifying releases', href: `${docs}/verifying-releases` },
      { text: 'Architecture', href: `${docs}/architecture` },
    ],
  },
  {
    title: 'Community',
    links: [
      { text: 'Who builds Thaw', href: '/community' },
      { text: 'Contributing', href: `${docs}/contribute` },
      { text: 'Discord', href: links.discord },
      { text: 'GitHub', href: repo },
      { text: 'Translate on Crowdin', href: links.crowdin },
      { text: 'Sponsor', href: links.sponsors },
    ],
  },
];

const policies = [
  { text: 'Security', href: `${docs}/security` },
  { text: 'Code of Conduct', href: `${docs}/contribute/code-of-conduct` },
  { text: 'Governance', href: `${docs}/governance` },
];

/** The foot of every page outside the docs: what Thaw is, a map of the site, and its licence. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="grid w-full gap-x-16 gap-y-12 px-6 py-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:px-10">
        <div className="flex flex-col items-start gap-5">
          <Image src={products.thaw.icon} alt="" width={32} className="size-8" />
          <p className="max-w-sm text-fd-muted-foreground text-pretty">
            The open source menu bar manager for macOS. It is free, it doesn’t track you, and you
            don’t need an account.
          </p>
          <a
            href={repo}
            className="tap flex items-center gap-3 border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Star Thaw on GitHub
            {typeof community.stars === 'number' && (
              <span className="text-fd-muted-foreground">{compact.format(community.stars)}</span>
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
            © {new Date().getFullYear()} Thaw. Open source under the{' '}
            <a
              href={`${repo}/blob/${products.thaw.branch}/LICENSE`}
              className="tap text-fd-foreground link"
            >
              GPL-3.0 licence
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
      <div className="footer-art relative w-full overflow-hidden">
        <FooterConure />
        <FooterWordmark />
      </div>
    </footer>
  );
}
