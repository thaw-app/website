import { Download } from 'lucide-react';
import Link from 'next/link';
import { countsFrom, VerifiedBlock } from '@/components/assurance';
import { FeatureCells, MarkRow, NameGroups, WorksWith } from '@/components/feature-list';
import { InstallFacts } from '@/components/install-facts';
import { SectionLabel } from '@/components/section-label';
import community from '@/lib/floe-community.json';
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
import { verifiedFrom } from '@/lib/verified';

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

/** Floe's own Verified values, read by the same sync as Thaw's. */
export function FloeAssurance() {
  return (
    <VerifiedBlock
      values={verifiedFrom(community.assurance, 'floe')}
      numbers={countsFrom(community)}
      communityHref="/floe/community"
    />
  );
}
