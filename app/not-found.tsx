import Link from 'next/link';
import { Frost } from '@/components/frost';
import { Lead, PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteFrame } from '@/components/site-frame';
import { StrayConure } from '@/components/stray-conure';
import { docsRoute } from '@/lib/shared';

export const metadata = { title: 'Not found' };

/** For an address that is no page: say so, and offer the places most people wanted. */
export default function NotFound() {
  return (
    <SiteFrame>
      <PageShell>
        {/* Frost on the ground behind the words, which melts where the pointer goes. */}
        <div className="relative -mx-6 px-6">
          <Frost />
          <PageHeader
            label="404"
            title="There is no page at this address."
            // The footer's conure is up here on this page, so it is not sent to the footer too.
            titleEnd={<StrayConure />}
            className="relative py-10"
          >
            <Lead>It may have moved, or the link that brought you here was mistyped.</Lead>
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
                <Link href={'/changelog'} className="tap link">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href={`${docsRoute}/thaw/frequent-issues`} className="tap link">
                  Frequent issues
                </Link>
              </li>
            </ul>
          </PageHeader>
        </div>
      </PageShell>
      <SiteFooter conure={false} />
    </SiteFrame>
  );
}
