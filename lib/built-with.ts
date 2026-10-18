import type { StaticImageData } from 'next/image';
import fumadocs from '@/assets/stack/fumadocs.png';
import shieldcn from '@/assets/stack/shieldcn.png';
import built from '@/lib/built-with.json';
import { links, products, repoUrl } from '@/lib/shared';
import type { stackMarks } from '@/lib/stack-marks';

// What the Built with page lists (app/(home)/built-with/page.tsx), kept here so the page's
// Markdown (lib/site-markdown.ts) says the same.

/** Which of the three something belongs to. */
export type User = 'Thaw' | 'Floe' | 'Site';

export interface Tool {
  name: string;
  use: string;
  href: string;
  /** A Simple Icons path, or the project's own icon; neither, and its initial stands in. */
  mark?: keyof typeof stackMarks;
  image?: StaticImageData;
  /** Left out for a service, which serves the whole project. */
  users?: User[];
}

// The languages, frameworks and runtimes, each once with who uses it: Swift is not listed
// twice for two apps, nor Bun once for Floe and again for the site. A package or a tool
// that only checks the code belongs in the package lists further down, not here.
export const made: Tool[] = [
  {
    name: 'Swift',
    use: 'The language both apps are written in.',
    href: 'https://www.swift.org',
    mark: 'swift',
    users: ['Thaw', 'Floe'],
  },
  {
    name: 'SwiftUI',
    use: 'Their interfaces.',
    href: 'https://developer.apple.com/swiftui/',
    mark: 'swift',
    users: ['Thaw', 'Floe'],
  },
  {
    name: 'Rust and Cargo',
    use: 'Floe’s calculator, built on fend.',
    href: 'https://www.rust-lang.org',
    mark: 'rust',
    users: ['Floe'],
  },
  {
    name: 'Bun',
    use: 'Runs Floe’s extensions, and builds this site.',
    href: 'https://bun.sh',
    mark: 'bun',
    users: ['Floe', 'Site'],
  },
  {
    name: 'React',
    use: 'What Floe’s extensions draw with, and this site.',
    href: 'https://react.dev',
    mark: 'react',
    users: ['Floe', 'Site'],
  },
  {
    name: 'Next.js',
    use: 'The site itself.',
    href: 'https://nextjs.org',
    mark: 'nextdotjs',
    users: ['Site'],
  },
  {
    name: 'Fumadocs',
    use: 'The docs, and their search.',
    href: 'https://fumadocs.dev',
    image: fumadocs,
    users: ['Site'],
  },
  {
    name: 'Tailwind CSS',
    use: 'Its styling.',
    href: 'https://tailwindcss.com',
    mark: 'tailwindcss',
    users: ['Site'],
  },
];

// What the project runs on: the main ones. The checks a workflow runs (code scanning,
// dependency updates, signing) are left to the Verified page, which is about them.
export const runsOn: Tool[] = [
  {
    name: 'GitHub',
    use: 'Code, issues, releases and discussions.',
    href: links.github,
    mark: 'github',
  },
  {
    name: 'Pulumi',
    use: 'Keeps the GitHub organisation as code: repositories, teams, rules and labels.',
    href: `${links.github}/platform`,
    mark: 'pulumi',
  },
  {
    name: 'SonarQube Cloud',
    use: 'Code quality and test coverage.',
    href: 'https://sonarcloud.io',
    mark: 'sonarqubecloud',
  },
  {
    name: 'CodeRabbit',
    use: 'Reviews pull requests.',
    href: 'https://www.coderabbit.ai',
    mark: 'coderabbit',
  },
  {
    name: 'Crowdin',
    use: 'Where the translations are done.',
    href: links.crowdin,
    mark: 'crowdin',
  },
  {
    name: 'Homebrew',
    use: 'One of the ways to install.',
    href: 'https://brew.sh',
    mark: 'homebrew',
  },
  {
    name: 'Vercel',
    use: 'Hosts this site, through its open source programme.',
    href: 'https://vercel.com',
    mark: 'vercel',
  },
  {
    name: 'shieldcn',
    use: 'Draws the badges across the organisation’s READMEs.',
    href: 'https://www.shieldcn.dev',
    image: shieldcn,
  },
];

// The licence each of ours is under. Floe's is the one its source files name.
export const ours = [
  {
    name: 'Thaw',
    license: 'GPL-3.0',
    detail: 'The menu bar manager.',
    href: `${repoUrl('thaw')}/blob/${products.thaw.branch}/LICENSE`,
  },
  {
    name: 'Floe',
    license: 'AGPL-3.0',
    detail: 'The launcher.',
    href: `${repoUrl('floe')}/blob/${products.floe.branch}/LICENSE`,
  },
];

// What is owed that the lists above do not already say. The first two are the ones Thaw's
// own Acknowledgements name; Floe's follow.
export const thanks = [
  {
    to: 'Ice, by Jordan Baird',
    forWhat: 'Thaw has its origins in Ice. Thank you for where it started.',
    href: 'https://github.com/jordanbaird/Ice',
  },
  {
    to: 'Barometer, by mackid1993',
    forWhat:
      'Thaw 3’s live system readings and the way it publishes several menu bar items are adapted from Barometer, under the GNU GPLv3 and with permission.',
    href: 'https://github.com/mackid1993/Barometer',
  },
  // Floe's own, from the "Built from" list in its CREDITS.md.
  {
    to: 'Droppy Code, by Jordy Spruit',
    forWhat:
      'Floe’s login shell environment, its process runner, the tools that answer Ask AI, its hang watchdog and the folder watcher behind hot reload come from Droppy Code, each changed for Floe and used with his permission.',
    href: 'https://getdroppycode.app',
  },
  {
    to: 'The Nix snowflake, by Simon Frankau and Tim Cuthbertson',
    forWhat: 'The Nix logo on the roadmap, used under the CC BY 4.0 licence.',
    href: 'https://github.com/NixOS/nixos-artwork/tree/master/logo',
  },
  {
    to: 'Natural Earth',
    forWhat: 'The outline of the world on the community page’s map, which is in the public domain.',
    href: 'https://www.naturalearthdata.com',
  },
];

export interface Package {
  name: string;
  url: string;
  license: string | null;
  /** Who uses it, and at which version. */
  users: Partial<Record<User, string | null>>;
}

// What "Made with" already names is not listed a second time as a package, and type
// definitions are left out: they are part of how the code is checked, not of what ships.
const namedAbove =
  /^(next|react|react-dom|tailwindcss|@tailwindcss\/.*|fumadocs-.*|@fumadocs\/.*)$/;
const shown = (list: Package[]) =>
  list.filter((item) => !item.name.startsWith('@types/') && !namedAbove.test(item.name));

// The packages in one list each, by what they are written in.
export const packages: { title: string; list: Package[] }[] = [
  { title: 'Swift packages', list: built.swift },
  { title: 'Rust crates', list: built.rust },
  { title: 'JavaScript packages', list: shown(built.javascript) },
];
