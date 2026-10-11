import { Heading } from 'fumadocs-ui/components/heading';
import type { ReactNode } from 'react';
import { DesktopLazy } from '@/components/desktop-lazy';
import type { ProductSlug } from '@/lib/shared';

/**
 * A product's own page: who it is on the left, held in place, and its README on the right.
 * Edge to edge: the left column starts at the window's left side and the README runs to
 * its right side, however wide the window is.
 */
export function ProductLanding({
  mark,
  title,
  lead,
  terms,
  after,
  children,
}: {
  /** The drawing over the headline. */
  mark: ReactNode;
  title: string;
  lead: string;
  /** What it costs and asks of you: the first sentence is set darker than the rest. */
  terms: [string, string];
  /** What follows the words in the left column. */
  after?: ReactNode;
  /** The page itself, on the right. */
  children: ReactNode;
}) {
  return (
    <div className="grid w-full lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Held in place while the right side scrolls, and centred in the height of the
          window. On a window too short to show it all, it scrolls to its end first and
          holds there. */}
      <header className="flex flex-col gap-8 border-b px-6 py-14 lg:sticky lg:top-[min(3.5rem,calc(100dvh-100%))] lg:min-h-[calc(100dvh-3.5rem)] lg:justify-center lg:self-start lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-6">
          {mark}
          <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-lg text-fd-muted-foreground text-pretty">{lead}</p>
          <p className="max-w-md text-fd-muted-foreground text-pretty">
            <span className="font-medium text-fd-foreground">{terms[0]}</span> {terms[1]}
          </p>
        </div>
        {after}
      </header>

      <div className="min-w-0">
        <article className="px-6 py-10 lg:px-10">
          <div className="readme prose max-w-none">{children}</div>
        </article>
      </div>
    </div>
  );
}

/**
 * Under the page itself: the app, rebuilt in the browser, to use before installing. It
 * needs the full width, so it is not in the columns above.
 */
export function TryIt({
  product,
  things,
  phone,
}: {
  /** Whose window the desktop opens on. */
  product: ProductSlug;
  /** Three things to do in it, said as shortly as they can be. */
  things: string[];
  /** What a phone is told, which gets a picture and not the demo. */
  phone: string;
}) {
  return (
    <section className="border-t px-6 py-14 lg:px-10">
      {/* As wide as the window allows, up to the real width of that screen. */}
      <div className="mx-auto flex w-full max-w-[1512px] flex-col gap-6">
        {/* The section answers to #try by its heading, which can be linked to like any other. */}
        <Heading
          as="h2"
          id="try"
          className="scroll-mt-20 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Try it before you install it.
        </Heading>
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 max-sm:hidden">
          <p className="text-sm text-fd-muted-foreground">Things to try</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {things.map((thing) => (
              <li key={thing}>{thing}</li>
            ))}
          </ul>
        </div>
        {/* A phone is too small to work the controls, so there it is a picture and says so. */}
        <p className="text-lg text-fd-muted-foreground text-pretty sm:hidden">{phone}</p>
        <DesktopLazy product={product} />
      </div>
    </section>
  );
}
