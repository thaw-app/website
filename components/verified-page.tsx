import Link from 'next/link';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ProductChoice } from '@/components/product-choice';
import { ResolvingText } from '@/components/resolving-text';
import thawCommunity from '@/lib/community.json';
import floeCommunity from '@/lib/floe-community.json';
import { docsRoute, longDate, type ProductSlug, products } from '@/lib/shared';
import { sitePages } from '@/lib/site-pages';
import { meaningsFor, readDays, standing, verifiedFrom } from '@/lib/verified';

const whose = [
  { name: 'Thaw', href: '/verified' },
  { name: 'Floe', href: '/floe/verified' },
];

// What is different between the two: where the numbers come from and why they matter.
const pages = {
  thaw: {
    community: thawCommunity,
    header: sitePages.verified,
    opening: 'Thaw asks for permissions that reach across your Mac.',
  },
  floe: {
    community: floeCommunity,
    header: sitePages.floeVerified,
    opening: 'Floe opens your apps and runs extensions on your Mac.',
  },
};

/**
 * The page behind "What does this mean?" on a product's page: each thing in its Verified
 * row, what it is, where the product stands on it today, and who says so.
 */
export function VerifiedView({ product }: { product: ProductSlug }) {
  const { community, header, opening } = pages[product];
  const { name } = products[product];
  const verified = verifiedFrom(community.assurance, product);
  const read = readDays(community.readOn, {
    bestPractices: 'The Best Practices badge',
    baseline: 'The Baseline level',
    scorecard: 'The Scorecard',
    coverage: 'Test coverage',
    field: 'The count of projects on OpenSSF’s list',
  });
  return (
    <PageShell tone={product === 'floe' ? 'floe' : undefined}>
      <div>
        <PageHeader {...header} className="mb-4">
          <Lead>
            {opening} These are the outside checks on how it is built and released: what each one
            is, and who vouches for it. A score a machine gives is not the same as a checklist a
            project fills in, so each says which it is. {standing(community.assurance, product)}
          </Lead>
        </PageHeader>
        <ProductChoice label="Whose checks" choices={whose} current={name} className="mt-6" />
      </div>

      <dl className="border-t">
        {meaningsFor(product).map((entry) => {
          // Matched by what it is: a value that could not be read is missing from the list.
          const now = verified.find((value) => value.id === entry.id);
          return (
            <div
              key={entry.term}
              className="grid gap-x-10 gap-y-3 border-b py-8 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <dt className="flex flex-col gap-1">
                <span className="text-sm text-fd-muted-foreground">{entry.term}</span>
                {now && (
                  <span className="font-display text-3xl leading-tight font-semibold tracking-tight">
                    <ResolvingText>{now.value}</ResolvingText>
                  </span>
                )}
              </dt>
              <dd className="flex max-w-2xl flex-col gap-3">
                <p className="text-pretty">{entry.meaning}</p>
                <p className="text-fd-muted-foreground text-pretty">
                  <span className="text-fd-foreground">Who says so.</span> {entry.checkedBy}
                </p>
                <p>
                  <a href={entry.href} className="tap link">
                    {new URL(entry.href).hostname.replace(/^www\./, '')}
                  </a>
                </p>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="text-sm text-fd-muted-foreground">
        {read.day && `Values read on ${longDate(read.day)}. `}
        {read.older.map((entry) => `${entry.name} is from ${longDate(entry.day)}. `)}
        The SLSA level is the one {name}’s release pipeline is built to.{' '}
        <Link href={`${docsRoute}/${product}/verifying-releases`} className="tap link">
          How to verify a release yourself
        </Link>
        .
      </p>
    </PageShell>
  );
}
