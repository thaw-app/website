'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import floePapelIcon from '@/assets/floe-papel-icon.png';
import thawPapelIcon from '@/assets/thaw-papel-icon.png';
import { pagesOf } from '@/lib/header-pages';
import { changelogUrl, docsRoute, type ProductSlug, products } from '@/lib/shared';

// The papel picado versions of each product's icon, in the header.
const icons: Record<ProductSlug, typeof thawPapelIcon> = {
  thaw: thawPapelIcon,
  floe: floePapelIcon,
};

// Each product's own page.
const pages: Record<ProductSlug, string> = { thaw: '/', floe: '/floe' };

/** Whose page an address is: Floe's own pages, changelog and docs are Floe's, the rest Thaw's. */
function productAt(pathname: string): ProductSlug {
  const floes = ['/floe', changelogUrl('floe'), `${docsRoute}/floe`];
  return floes.some((start) => pathname === start || pathname.startsWith(`${start}/`))
    ? 'floe'
    : 'thaw';
}

/**
 * The name at the left of the header: which product the page is about, and the way to that
 * product's own page. It is one header for Thaw's pages, Floe's and the docs of both, so it
 * reads the address to know whose page it is on. The other product is a link at the end of
 * the header's pages (lib/layout.shared.tsx), not a list opened from here.
 */
export function ProductName({ className }: ComponentProps<'a'>) {
  const current = productAt(usePathname());
  return (
    <Link
      href={pages[current]}
      aria-label={`${products[current].name}, home`}
      className={`tap -mx-2 px-2 py-1.5 ${className ?? ''}`}
    >
      <Image src={icons[current]} alt="" width={24} className="in-season size-6" />
      <Image src={products[current].icon} alt="" width={24} className="off-season size-6" />
      <span className="font-display text-base font-semibold tracking-tight">
        {products[current].name}
      </span>
    </Link>
  );
}

/**
 * The header's pages for whichever product the address is under, for the docs' header,
 * which is one header over both products' docs. Drawn as the layout draws its own links.
 */
export function ProductPages() {
  const pathname = usePathname();
  return pagesOf[productAt(pathname)].map((page) => (
    <Link
      key={page.url}
      href={page.url}
      data-active={
        'active' in page
          ? pathname === page.url || pathname.startsWith(`${page.url}/`)
          : pathname === page.url
      }
      className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground data-[active=true]:text-fd-primary"
    >
      {page.text}
    </Link>
  ));
}

/** The header's title as the layout asks for it: a function it calls with the link's props. */
export function navTitle(props: ComponentProps<'a'>) {
  return <ProductName {...props} />;
}
