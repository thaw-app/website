import { Banner } from 'fumadocs-ui/components/banner';
import Link from 'next/link';

/**
 * One line of news over Thaw's pages, which a visitor can close for good. It scrolls away
 * with the page and does not stick: the header under it does that, and the two would
 * otherwise sit on top of one another. It stays positioned, which its close button needs.
 * A new piece of news needs a new id, or the people who closed the last one never see it.
 */
export function SiteBanner() {
  return (
    <Banner id="macos-15-returns" changeLayout={false} className="relative gap-x-3 border-b">
      <p className="text-pretty">
        <span className="font-semibold">macOS 15 is coming back.</span>{' '}
        <span className="font-normal text-fd-muted-foreground max-sm:hidden">
          We are adding compatibility with macOS 15 back in Thaw 2.2.0.
        </span>
        <span className="font-normal text-fd-muted-foreground sm:hidden">In Thaw 2.2.0.</span>
      </p>
      <Link href="/roadmap" className="tap link max-sm:hidden">
        Roadmap
      </Link>
    </Banner>
  );
}
