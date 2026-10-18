import { Heading } from 'fumadocs-ui/components/heading';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { FeatureCells, MarkRow, NameGroups, WorksWith } from '@/components/feature-list';
import { InstallFacts } from '@/components/install-facts';
import { SectionLabel } from '@/components/section-label';
import {
  floeAlso,
  floeAskAi,
  floeDownload,
  floeFeatures,
  floeInstallFacts,
  floeWorksWith,
} from '@/lib/floe-features';
import { latestStable } from '@/lib/releases';
import { docsRoute } from '@/lib/shared';

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
            className="press flex items-center justify-between gap-3 border bg-fd-foreground/[0.04] px-4 py-3 font-medium transition-colors hover:bg-fd-foreground/[0.08]"
          >
            Download Floe
            <Download aria-hidden className="size-4" />
          </a>
        </div>
        <InstallFacts facts={floeInstallFacts} />
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
 * What Floe does, in the parts Thaw's features are in (feature-list.tsx): ruled cells,
 * everything else by name, then what it works with.
 */
export function FloeFeatures() {
  return (
    <div className="not-prose my-6">
      <FeatureCells features={floeFeatures} />
      <SectionLabel as="h3">Also in Floe</SectionLabel>
      <NameGroups groups={floeAlso} />
      <SectionLabel as="h3">Works with</SectionLabel>
      <WorksWith items={floeWorksWith} className="grid-cols-2 sm:grid-cols-3" />
      {/* Who can answer Ask AI: the choice is the visitor's, so each is shown by its mark. */}
      <SectionLabel as="h3">Ask AI with</SectionLabel>
      <MarkRow items={floeAskAi} />
      {/* The first sentence is said in the README's licence section, which the page leaves out. */}
      <p className="mt-4 text-sm text-fd-muted-foreground text-pretty">
        Raycast is a trademark of Raycast Technologies Inc. Floe is not affiliated with Raycast, or
        with any of the companies above, whose names and marks are their own.
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
          Part of the way.
        </p>
        <p className="mb-6 text-fd-muted-foreground text-pretty">
          Floe is signed and notarised, each release comes with a record of how it was built, and
          the project has an{' '}
          <a
            href="https://scorecard.dev/viewer/?uri=github.com/thaw-app/Floe"
            className="tap text-fd-foreground link"
          >
            OpenSSF Scorecard
          </a>
          . Thaw’s other checks, such as its OpenSSF Best Practices badge, are still to come.
        </p>
        <Link
          href="/#verified"
          className="tap press flex items-center justify-between gap-x-6 gap-y-1 border px-5 py-3 font-medium transition-colors hover:bg-fd-accent max-sm:flex-col max-sm:items-start"
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
