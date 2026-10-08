import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { baseOptions } from '@/lib/layout.shared';
import { docsRoute } from '@/lib/shared';

export const metadata = { title: 'Not found' };

/** For an address that is no page: say so, and offer the places most people wanted. */
export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()} style={{ '--fd-layout-width': '100%' } as CSSProperties}>
      <PageShell>
        <header className="flex flex-col gap-4 py-10">
          <p className="text-sm text-fd-muted-foreground">404</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            There is no page at this address.
          </h1>
          <p className="max-w-2xl text-lg text-fd-muted-foreground text-pretty">
            It may have moved, or the link that brought you here was mistyped.
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            <li>
              <Link href="/" className="tap link">
                Home
              </Link>
            </li>
            <li>
              <Link href={`${docsRoute}/thaw`} className="tap link">
                Thaw documentation
              </Link>
            </li>
            <li>
              <Link href={`${docsRoute}/thaw/changelog`} className="tap link">
                Changelog
              </Link>
            </li>
            <li>
              <Link href={`${docsRoute}/thaw/frequent-issues`} className="tap link">
                Frequent issues
              </Link>
            </li>
          </ul>
        </header>
      </PageShell>
      <SiteFooter />
    </HomeLayout>
  );
}
