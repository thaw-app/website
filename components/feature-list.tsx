import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { docsRoute } from '@/lib/shared';
import { thawAlso, thawFeatures, thawWorksWith } from '@/lib/thaw-features';
import { HoverLine, HoverLines } from './hover-lines';
import { Mark } from './product-marks';

/** A product's main features in equal ruled cells, in the order given. */
export function FeatureCells({ features }: { features: { title: string; detail: string }[] }) {
  return (
    <ul className="crossed sm:grid-cols-2">
      {features.map((feature) => (
        <li key={feature.title} className="flex flex-col gap-2 p-6">
          <h3 className="font-display text-xl leading-tight font-semibold tracking-tight">
            {feature.title}
          </h3>
          <p className="text-fd-muted-foreground text-pretty">{feature.detail}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Everything else a product does, by name, filed under what it is for. A name that has a
 * sentence about it opens on that sentence (hover-lines.tsx), so the names can be read down
 * the page and any one of them asked about.
 */
export function NameGroups({
  groups,
}: {
  groups: { group: string; names: (string | { name: string; about: string })[] }[];
}) {
  return (
    <HoverLines className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(({ group, names }) => (
        <section key={group}>
          <h4 className="mb-2.5 text-sm font-medium text-fd-muted-foreground">{group}</h4>
          <ul className="flex flex-col gap-1 text-sm">
            {names.map((entry) =>
              typeof entry === 'string' ? (
                <li key={entry}>{entry}</li>
              ) : (
                <li key={entry.name}>
                  <HoverLine summary={<span className="line-name">{entry.name}</span>}>
                    <p className="line-more pt-0.5 pb-1.5 text-fd-muted-foreground text-pretty">
                      {entry.about}
                    </p>
                  </HoverLine>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </HoverLines>
  );
}

/** What a product works with: each one's mark, its name and how, beside one another. */
export function WorksWith({
  items,
  className,
}: {
  items: { name: string; how: string; href: string; mark: string }[];
  className: string;
}) {
  return (
    <ul className={`grid gap-x-10 gap-y-6 ${className}`}>
      {items.map((item) => (
        <li key={item.name}>
          <Link href={item.href} className="group tap flex items-center gap-3.5">
            <span
              aria-hidden
              className="flex size-6 flex-none items-center justify-center text-2xl text-fd-foreground"
            >
              <Mark name={item.mark} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium underline-offset-4 group-hover:underline">
                {item.name}
              </span>
              <span className="text-sm text-fd-muted-foreground">{item.how}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * A row of marks alone, for names a visitor knows on sight. Each is still named to a screen
 * reader, and to a pointer that rests on it.
 */
export function MarkRow({ items }: { items: { name: string; href: string; mark: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-9 gap-y-5">
      {items.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            aria-label={item.name}
            title={item.name}
            className="tap flex items-center justify-center text-[1.75rem] text-fd-foreground transition-opacity hover:opacity-60"
          >
            <Mark name={item.mark} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * What Thaw does, as a sheet to read down and not a wall to take in: the ten
 * main features in equal ruled cells; then everything else by name, filed under what it is
 * for. Only the ten are ruled: the names and the partners under them sit open on the page, so
 * the grid marks what to read first.
 */
export function FeatureList() {
  return (
    <div className="not-prose my-6">
      <FeatureCells features={thawFeatures} />

      <SectionLabel as="h3">Also in Thaw</SectionLabel>
      {/* Six groups, so two or three to a row leaves no place empty. */}
      <NameGroups groups={thawAlso} />
      <SectionLabel as="h3">Works with</SectionLabel>
      <WorksWith items={thawWorksWith} className="grid-cols-2 sm:grid-cols-3" />
      {/* The lists are Thaw 3's, and Install gives a Mac on macOS 26 Thaw 2: said once, with
          where to find which version a Mac gets. */}
      <p className="mt-4 text-sm text-fd-muted-foreground text-pretty">
        Some of these features are only in Thaw 3.{' '}
        <Link href={`${docsRoute}/thaw/versions`} className="tap text-fd-foreground link">
          See which Thaw your Mac gets
        </Link>
        .
      </p>
    </div>
  );
}
