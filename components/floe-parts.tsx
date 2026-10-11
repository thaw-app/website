import { Heading } from 'fumadocs-ui/components/heading';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { FeatureCells, NameGroups, WorksWith } from '@/components/feature-list';
import { SectionLabel } from '@/components/section-label';
import { floeAlso, floeDownload, floeFeatures, floeWorksWith } from '@/lib/floe-features';
import { latestStable } from '@/lib/releases';
import { docsRoute } from '@/lib/shared';

// What a person weighs before installing a launcher that runs other people's extensions.
const facts = [
  {
    label: 'Needs',
    value: 'macOS 26 or later',
    detail: 'Floe is signed and notarized, and updates itself.',
  },
  {
    label: 'Needs',
    value: 'Accessibility',
    detail: 'The one permission Floe requires. Calendar, Reminders and Contacts are optional.',
  },
  {
    label: 'Know first',
    value: 'Floe is early',
    detail: 'Extensions are not sandboxed, so install only the ones you trust.',
  },
];

/** How to get Floe: one download, set out as Thaw's install box is (install-tabs.tsx). */
export function FloeInstall() {
  const stable = latestStable('floe');
  return (
    <div className="not-prose my-6">
      <div className="border">
        <div className="flex flex-col gap-2.5 px-4 py-4">
          <p className="text-sm text-fd-muted-foreground">
            {stable ? `Floe ${stable.tag}. ` : ''}Open the disk image and move Floe to Applications.
          </p>
          <a
            href={floeDownload}
            className="flex items-center justify-between gap-3 border bg-fd-foreground/[0.04] px-4 py-3 font-medium transition-colors hover:bg-fd-foreground/[0.08]"
          >
            Download Floe
            <Download aria-hidden className="size-4" />
          </a>
        </div>
        <dl className="grid border-t sm:grid-cols-3 sm:divide-x max-sm:divide-y">
          {facts.map((fact) => (
            <div key={fact.value} className="flex flex-col gap-1 px-4 py-3.5">
              <dt className="text-sm text-fd-muted-foreground">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
              <dd className="text-sm text-fd-muted-foreground text-pretty">{fact.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t px-4 py-2.5 text-sm">
          <Link href="/floe#try" className="tap font-medium link">
            Try it in your browser first
          </Link>
          <Link href={`${docsRoute}/floe`} className="tap link link-quiet">
            Floe documentation
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * What Floe does, in the parts Thaw's features are in (feature-list.tsx): numbered cells,
 * everything else by name, then what it works with.
 */
export function FloeFeatures() {
  return (
    <div className="not-prose my-6">
      <FeatureCells features={floeFeatures} />
      <SectionLabel as="h3">Also in Floe</SectionLabel>
      <NameGroups groups={floeAlso} />
      <SectionLabel as="h3">Works with</SectionLabel>
      <WorksWith items={floeWorksWith} className="grid-cols-2" />
      {/* Said in the README's licence section, which the page leaves out. */}
      <p className="mt-4 text-sm text-fd-muted-foreground text-pretty">
        Raycast is a trademark of Raycast Technologies Inc. Floe is not affiliated with Raycast.
      </p>
    </div>
  );
}

/**
 * Where Thaw's page has its Verified values, Floe's says they are on the way: Floe is early
 * and has none of its own to show yet.
 */
export function FloeAssurance() {
  return (
    <>
      <Heading as="h2" id="verified">
        Verified
      </Heading>
      <div className="not-prose my-6">
        <p className="mb-3 font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
          Incoming.
        </p>
        <p className="mb-6 text-fd-muted-foreground text-pretty">
          Floe is early, and we are committed to bringing it on par with Thaw in this area.
        </p>
        <Link
          href="/#verified"
          className="tap flex items-center justify-between gap-x-6 gap-y-1 border px-5 py-3 font-medium transition-colors hover:bg-fd-accent max-sm:flex-col max-sm:items-start"
        >
          See where Thaw stands
          <span aria-hidden className="text-fd-muted-foreground">
            SLSA, OpenSSF and test coverage
          </span>
        </Link>
      </div>
    </>
  );
}
