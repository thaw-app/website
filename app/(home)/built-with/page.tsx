import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Section } from '@/components/section-label';
import { made, ours, packages, runsOn, type Tool, thanks, type User } from '@/lib/built-with';
import { pageAlternates } from '@/lib/releases';
import { stackMarks } from '@/lib/stack-marks';

export const metadata: Metadata = {
  // One address for the page, whichever domain it was reached on.
  alternates: pageAlternates('/built-with'),
  openGraph: { images: '/og/site/home/image.png' },
  title: 'Built with',
  description:
    'What Thaw, Floe and this site are built with, the services the project runs on, the licences everything is under, and who it owes.',
};

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

/** A set of tools: ruled into cells, or `open` on the page where a second grid would only repeat the first. */
function Tools({ tools, open = false }: { tools: Tool[]; open?: boolean }) {
  return (
    <ul
      className={`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${open ? 'grid gap-x-10 gap-y-10' : 'crossed'}`}
    >
      {tools.map((tool) => (
        <li key={tool.name}>
          <a
            href={tool.href}
            className={`group flex h-full flex-col gap-3 ${open ? '' : 'p-5 transition-colors hover:bg-fd-accent'}`}
          >
            <span className="flex items-start justify-between gap-3">
              {tool.mark ? (
                <svg viewBox="0 0 24 24" aria-hidden className="size-7 shrink-0 fill-current">
                  <path d={stackMarks[tool.mark]} />
                </svg>
              ) : tool.image ? (
                <Image src={tool.image} alt="" width={28} className="size-7 shrink-0" />
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
              <span className="font-medium underline-offset-4 group-hover:underline">
                {tool.name}
              </span>
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
      <PageHeader label="Built with" title="What Thaw and Floe are built with.">
        <Lead>
          The languages and tools behind the two apps and this site, the services the project runs
          on, the licences everything is under, and the people and projects it owes.
        </Lead>
      </PageHeader>

      <Section label="Made with">
        <Tools tools={made} />
      </Section>

      <Section label="Runs on">
        <Tools tools={runsOn} open />
      </Section>

      <Section label="Licences">
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {ours.map((item) => (
            <li key={item.name}>
              <a href={item.href} className="group flex flex-col gap-1">
                <span className="text-sm text-fd-muted-foreground">{item.name}</span>
                <span className="font-display text-3xl font-semibold tracking-tight underline-offset-4 group-hover:underline">
                  {item.license}
                </span>
                <span className="text-sm text-fd-muted-foreground">{item.detail}</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Thanks">
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
      </Section>

      {packages.map(({ title, list }) => (
        <Section key={title} label={title}>
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
                    <a href={item.url} className="tap truncate font-medium link max-sm:basis-full">
                      {item.name}
                    </a>
                    <span className="text-sm text-fd-muted-foreground">
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
        </Section>
      ))}
      <p className="text-sm text-fd-muted-foreground">
        Each Swift package’s full licence text ships inside the apps, under Acknowledgements.
      </p>
    </PageShell>
  );
}
