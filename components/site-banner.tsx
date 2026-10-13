import { Banner } from 'fumadocs-ui/components/banner';
import Link from 'next/link';

/**
 * One line of news over Thaw's pages, which a visitor can close for good. It scrolls away
 * with the page and does not stick: the header under it does that, and the two would
 * otherwise sit on top of one another. It stays positioned, which its close button needs.
 * A new piece of news needs a new id, or the people who closed the last one never see it.
 * It is tinted with the accent, so it reads as news and not as part of the header under it.
 */
export function SiteBanner() {
  return (
    <Banner
      id="macos-15-returns"
      changeLayout={false}
      className="relative gap-x-3 border-b border-(color:--product-tone)/30 bg-(--product-tone)/12"
    >
      <p className="text-pretty">
        <span className="font-semibold">macOS 15 is coming back.</span>{' '}
        <span className="font-normal text-fd-foreground/80 max-sm:hidden">
          We are adding compatibility with macOS 15 back in Thaw 2.2.0.
        </span>
        <span className="font-normal text-fd-foreground/80 sm:hidden">In Thaw 2.2.0.</span>
      </p>
      <Link href="/roadmap" className="tap link max-sm:hidden">
        Roadmap
      </Link>
    </Banner>
  );
}
