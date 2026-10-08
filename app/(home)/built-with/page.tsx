import type { Metadata } from 'next';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import fumadocs from '@/assets/stack/fumadocs.png';
import shieldcn from '@/assets/stack/shieldcn.png';
import { PageShell } from '@/components/page-shell';
import { SectionLabel } from '@/components/section-label';
import built from '@/lib/built-with.json';
import { links, products, repoUrl } from '@/lib/shared';
import { stackMarks } from '@/lib/stack-marks';

export const metadata: Metadata = {
  openGraph: { images: '/og/site/home/image.png' },
  title: 'Built with',
  description:
    'What Thaw, Floe and this site are built with, the services the project runs on, the licences everything is under, and who it owes.',
};

/** Which of the three something belongs to. */
type User = 'Thaw' | 'Floe' | 'Site';

interface Tool {
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
const made: Tool[] = [
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
const runsOn: Tool[] = [
  {
    name: 'GitHub',
    use: 'Code, issues, releases and discussions.',
    href: 'https://github.com/thaw-app',
    mark: 'github',
  },
  {
    name: 'Pulumi',
    use: 'Keeps the GitHub organisation as code: repositories, teams, rules and labels.',
    href: 'https://github.com/thaw-app/platform',
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
const ours = [
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
// own Acknowledgements name.
const thanks = [
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
  {
    to: 'Everyone who contributes',
    forWhat: 'Code, documentation and translations. They are listed by name on the community page.',
    href: '/community',
  },
  {
    to: 'shieldcn',
    forWhat:
      'They added what our badges needed from a pull request we sent, and their maintainer uses Thaw.',
    href: 'https://www.shieldcn.dev',
  },
  {
    to: 'Natural Earth',
    forWhat: 'The outline of the world on the community page’s map, which is in the public domain.',
    href: 'https://www.naturalearthdata.com',
  },
  {
    to: 'Vercel and Anthropic',
    forWhat: 'Thaw is part of the Vercel OSS Program and the Claude Open Source Program.',
    href: 'https://vercel.com/open-source-program',
  },
];

interface Package {
  name: string;
  url: string;
  license: string | null;
  /** Who uses it, and at which version. */
  users: Partial<Record<User, string | null>>;
}

// Every package in one list, by what it is written in.
const packages: { title: string; list: Package[] }[] = [
  { title: 'Swift packages', list: built.swift },
  { title: 'Rust crates', list: built.rust },
  { title: 'JavaScript packages', list: built.javascript },
];

/** Who uses something, as small quiet tags. */
function Users({ users }: { users: User[] }) {
  return (
    <span className="flex gap-1.5">
      {users.map((user) => (
        <span key={user} className="border px-1.5 text-xs text-fd-muted-foreground">
          {user}
        </span>
      ))}
    </span>
  );
}

function Tools({ tools }: { tools: Tool[] }) {
  return (
    <ul className="crossed grid grid-cols-2 border-t border-l sm:grid-cols-3 lg:grid-cols-4">
      {tools.map((tool) => (
        <li key={tool.name} className="border-r border-b">
          <a href={tool.href} className="flex h-full flex-col gap-3 p-5 hover:bg-fd-accent">
            <span className="flex items-start justify-between gap-3">
              {tool.mark ? (
                <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
                  <path d={stackMarks[tool.mark]} />
                </svg>
              ) : tool.image ? (
                <Image src={tool.image} alt="" className="size-7" />
              ) : (
                // No mark to hand: its initial, in the same square.
                <span
                  aria-hidden
                  className="flex size-7 items-center justify-center border font-display text-sm font-semibold"
                >
                  {tool.name[0]}
                </span>
              )}
              {tool.users && <Users users={tool.users} />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{tool.name}</span>
              <span className="text-sm text-fd-muted-foreground text-pretty">{tool.use}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * What Thaw, Floe and this site are made with and run on, and who they owe:
 * each tool and each package once, marked with which of the three uses it.
 * The package lists are read from each project when the site is built.
 */
export default function BuiltWithPage() {
  return (
    <PageShell>
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          What Thaw and Floe are built with.
        </h1>
        <p className="max-w-2xl text-lg text-fd-muted-foreground text-pretty">
          The languages and tools behind the two apps and this site, the services the project runs
          on, the licences everything is under, and the people and projects it owes.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <SectionLabel>Made with</SectionLabel>
        <Tools tools={made} />
      </section>

      <section className="flex flex-col gap-6">
        <SectionLabel>Runs on</SectionLabel>
        <Tools tools={runsOn} />
      </section>

      <section className="flex flex-col gap-6">
        <SectionLabel>Licences</SectionLabel>
        <ul className="crossed grid border-t border-l sm:grid-cols-2">
          {ours.map((item) => (
            <li key={item.name} className="border-r border-b">
              <a href={item.href} className="flex h-full flex-col gap-1 p-6 hover:bg-fd-accent">
                <span className="text-sm text-fd-muted-foreground">{item.name}</span>
                <span className="font-display text-3xl font-semibold tracking-tight">
                  {item.license}
                </span>
                <span className="text-sm text-fd-muted-foreground">{item.detail}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <SectionLabel>Thanks</SectionLabel>
        <dl className="border-t">
          {thanks.map((item) => (
            <div
              key={item.to}
              className="grid gap-x-10 gap-y-1 border-b py-4 sm:grid-cols-[18rem_minmax(0,1fr)]"
            >
              <dt className="font-medium">
                <Link href={item.href} className="tap link">
                  {item.to}
                </Link>
              </dt>
              <dd className="max-w-2xl text-fd-muted-foreground text-pretty">{item.forWhat}</dd>
            </div>
          ))}
        </dl>
      </section>

      {packages.map(({ title, list }) => (
        <section key={title} className="flex flex-col gap-6">
          <SectionLabel>{title}</SectionLabel>
          <ul className="grid border-t sm:grid-cols-2 sm:gap-x-10">
            {list.map((item) => {
              const users = Object.keys(item.users) as User[];
              // One number where everyone is on the same version; each one's otherwise.
              const versions = [...new Set(Object.values(item.users))];
              return (
                <li
                  key={item.name}
                  className="flex items-baseline justify-between gap-4 border-b py-2.5"
                >
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <a href={item.url} className="tap truncate font-medium link">
                      {item.name}
                    </a>
                    <span className="text-sm text-fd-muted-foreground tabular-nums">
                      {versions.length === 1
                        ? versions[0]
                        : users.map((user) => `${user} ${item.users[user]}`).join(', ')}
                    </span>
                    <Users users={users} />
                  </span>
                  <span className="shrink-0 text-sm text-fd-muted-foreground">
                    {item.license ?? 'See its repository'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-sm text-fd-muted-foreground">
        Each Swift package’s full licence text ships inside the apps, under Acknowledgements.
      </p>
    </PageShell>
  );
}
