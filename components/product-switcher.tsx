'use client';

import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { changelogUrl, docsRoute, type ProductSlug, products } from '@/lib/shared';

// Each product's own page, and what it is in two or three words.
const pages: Record<ProductSlug, { href: string; kind: string }> = {
  thaw: { href: '/', kind: 'Menu bar manager' },
  floe: { href: '/floe', kind: 'Launcher' },
};

/** Whose page an address is: Floe's own pages, changelog and docs are Floe's, the rest Thaw's. */
function productAt(pathname: string): ProductSlug {
  const floes = ['/floe', changelogUrl('floe'), `${docsRoute}/floe`];
  return floes.some((start) => pathname === start || pathname.startsWith(`${start}/`))
    ? 'floe'
    : 'thaw';
}

/**
 * The name at the left of the header. It says which product the page is about, and opens a
 * list of both to go to the other. It stands where the layout would put a link home, and
 * takes that link's look.
 */
export function ProductSwitcher({ className }: ComponentProps<'a'>) {
  const current = productAt(usePathname());
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`${products[current].name}. Choose a product`}
        className={`tap -mx-2 rounded-md px-2 py-1.5 transition-colors hover:bg-fd-accent data-[popup-open]:bg-fd-accent ${className ?? ''}`}
      >
        <Image src={products[current].icon} alt="" width={24} className="size-6" />
        <span className="font-display text-base font-semibold tracking-tight">
          {products[current].name}
        </span>
        <ChevronsUpDown aria-hidden className="size-3.5 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto flex-col gap-0.5 p-1.5">
        {(Object.keys(pages) as ProductSlug[]).map((slug) => (
          <Link
            key={slug}
            href={pages[slug].href}
            // The list closes as a link in it is followed.
            onClick={() => setOpen(false)}
            aria-current={slug === current ? 'page' : undefined}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-fd-accent"
          >
            <Image src={products[slug].icon} alt="" width={32} className="size-8" />
            <span className="flex flex-1 flex-col">
              <span className="font-medium text-fd-foreground">{products[slug].name}</span>
              <span className="text-fd-muted-foreground">{pages[slug].kind}</span>
            </span>
            {slug === current && <Check aria-hidden className="size-4 text-fd-muted-foreground" />}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** The header's title as the layout asks for it: a function it calls with the link's props. */
export function navTitle(props: ComponentProps<'a'>) {
  return <ProductSwitcher {...props} />;
}
