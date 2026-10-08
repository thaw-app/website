import { Newsreader } from 'next/font/google';
import Image from 'next/image';
import vercelOssDark from '@/assets/vercel-oss-dark.png';
import vercelOssLight from '@/assets/vercel-oss-light.png';
import { AsciiCube } from '@/components/ascii-cube';
import { ClaudeMark } from '@/components/claude-mark';
import { DesktopLazy } from '@/components/desktop-lazy';
import { getMDXComponents } from '@/components/mdx';
import { ProductHuntMark } from '@/components/product-hunt-mark';
import { source } from '@/lib/source';

// A free serif in the manner of the one Claude's own wordmark is set in.
const badgeFont = Newsreader({ subsets: ['latin'], weight: ['500'] });

export default function HomePage() {
  const readme = source.getPage(['thaw', 'readme']);
  if (!readme) throw new Error('The Thaw README was not synced; run scripts/sync-docs.mjs.');
  const Readme = readme.data.body;

  return (
    <main className="flex flex-1 flex-col">
      {/* Edge to edge: the left column starts at the window's left side and the README runs to
          its right side, however wide the window is. */}
      <div className="grid w-full lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Left: who this is, held in place while the right side scrolls, and centred in the
            height of the window. On a window too short to show it all, it scrolls to its end
            first and holds there. */}
        <header className="flex flex-col gap-8 border-b px-6 py-14 lg:sticky lg:top-[min(3.5rem,calc(100dvh-100%))] lg:min-h-[calc(100dvh-3.5rem)] lg:justify-center lg:self-start lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-6">
            {/* Centred in the column, and sized so the headline and the lines under it fit one
                screen with it. */}
            <AsciiCube className="ascii-cube mx-auto w-full max-w-52 sm:max-w-64 lg:max-w-[20rem] xl:max-w-[21.5rem]" />
            <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-5xl">
              The open source menu bar manager for macOS.
            </h1>
            <p className="max-w-md text-lg text-fd-muted-foreground text-pretty">
              Take back your menu bar. Hide what you don’t need, and find anything in a keystroke.
            </p>
            <p className="max-w-md text-fd-muted-foreground text-pretty">
              <span className="font-medium text-fd-foreground">
                Free under GPL-3.0, with no tracking and no account.
              </span>{' '}
              When a new macOS comes out, you get an update, not an upgrade to buy.
            </p>
          </div>

          {/* The programmes that support Thaw's development, and where it was featured. */}
          <div className="flex flex-col items-start gap-3.5 pointer-coarse:gap-0.5">
            <a
              href="https://vercel.com/open-source-program"
              aria-label="Vercel OSS Program"
              className="tap"
            >
              <Image src={vercelOssLight} alt="" width={240} className="h-6 w-auto dark:hidden" />
              <Image
                src={vercelOssDark}
                alt=""
                width={240}
                className="hidden h-6 w-auto dark:block"
              />
            </a>
            {/* Anthropic has no badge for this programme, so this one is laid out like
                Vercel's. The wording is the one the maintainers' READMEs use. */}
            <a
              href="https://claude.com/contact-sales/claude-for-oss"
              aria-label="Claude Open Source Program"
              className="tap flex items-center gap-3 text-fd-foreground"
            >
              <ClaudeMark className="size-6" />
              <span className={`${badgeFont.className} text-[18px] leading-none font-medium`}>
                Claude Open Source Program
              </span>
            </a>
            <a
              href="https://www.producthunt.com/products/thaw-2"
              aria-label="Featured on Product Hunt"
              className="tap flex items-center gap-3 text-fd-foreground"
            >
              <ProductHuntMark className="size-6" />
              <span className="text-[18px] leading-none font-medium">Featured on Product Hunt</span>
            </a>
          </div>
        </header>

        {/* Right: the page itself. */}
        <div className="min-w-0">
          {/* Install, the app itself, what it does and why to trust it: built from Thaw's README,
              synced from its repository like the docs are. */}
          <article className="px-6 py-10 lg:px-10">
            <div className="readme prose max-w-none">
              <Readme components={getMDXComponents()} />
            </div>
          </article>
        </div>
      </div>

      {/* Under the page itself: Thaw, rebuilt in the browser, to use before installing.
          It needs the full width, so it is not in the columns above. */}
      <section id="try" className="scroll-mt-20 border-t px-6 py-14 lg:px-10">
        {/* As wide as the window allows, up to the real width of that screen. */}
        <div className="mx-auto flex w-full max-w-[1512px] flex-col gap-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Try it before you install it.
          </h2>
          {/* Three things to do in it, said as shortly as they can be. */}
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 max-sm:hidden">
            <p className="text-sm text-fd-muted-foreground">Things to try</p>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              <li>Click the dot in the menu bar</li>
              <li>Drag an item on the Layout pane</li>
              <li>Switch on the Thaw Bar</li>
            </ul>
          </div>
          {/* A phone is too small to work the controls, so there it is a picture and says so. */}
          <p className="text-lg text-fd-muted-foreground text-pretty sm:hidden">
            This is Thaw, rebuilt in the browser. It is too small to use on a phone: open this page
            on a Mac to click around in it.
          </p>
          <DesktopLazy />
        </div>
      </section>
    </main>
  );
}
