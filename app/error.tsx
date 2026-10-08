'use client';

import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import { type CSSProperties, useEffect } from 'react';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { baseOptions } from '@/lib/layout.shared';
import { links } from '@/lib/shared';

/**
 * For a page that broke while it was being shown: say so in the site's own words, offer
 * to try again, and say where to report it. Without this a visitor gets the framework's
 * bare screen. The footer is left off, since whatever broke may be in it.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <HomeLayout {...baseOptions()} style={{ '--fd-layout-width': '100%' } as CSSProperties}>
      <PageShell>
        <PageHeader label="Error" title="This page did not load." className="py-10">
          <Lead>Something went wrong on our side while showing it. Trying again often works.</Lead>
          <ul className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-2">
            <li>
              <button
                type="button"
                onClick={() => retry()}
                className="tap border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
              >
                Try again
              </button>
            </li>
            <li>
              <Link href="/" className="tap link">
                Home
              </Link>
            </li>
            <li>
              <a href={`${links.github}/website/issues`} className="tap link">
                Report it on GitHub
              </a>
            </li>
          </ul>
        </PageHeader>
      </PageShell>
    </HomeLayout>
  );
}
