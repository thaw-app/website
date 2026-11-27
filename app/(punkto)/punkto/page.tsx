import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import iconDark from '@/assets/punkto-icon-dark.png';
import iconLight from '@/assets/punkto-icon-light.png';
import { links } from '@/lib/shared';
import { PunktoInstall } from './install';
import { PunktoMenuBar } from './menu-bar';

export const metadata: Metadata = {
  // Its own name alone: the page stands apart from Thaw's.
  title: { absolute: 'Punkto' },
  description:
    'Punkto hides the menu bar items you choose, and does nothing else. From the makers of Thaw.',
};

// Checked against packages/Punkto in the Thaw repo: PunktoSettings.rehideChoices,
// PunktoModel.handle and PunktoIconStyle.
const details = [
  {
    title: 'One item in the menu bar',
    text: 'Click it to show the apps you hid. Click again and they go.',
  },
  {
    title: 'Choose with a right click',
    text: 'Drag apps between Visible and Hidden in the panel it opens.',
  },
  {
    title: 'Hides them again',
    text: 'After 5 or 10 seconds, or only when you click.',
  },
  {
    title: 'Keeps their order',
    text: 'macOS forgets where hidden items sat. Punkto puts them back where they were.',
  },
  {
    title: 'Hides the way Thaw does',
    text: 'The same code finds and hides the items, with Full or Native hiding.',
  },
  {
    title: 'Its own look, or none',
    text: 'A dot, an ellipsis, an eye, the puck from its icon, a picture of yours, or nothing at all.',
  },
  {
    title: 'From a link',
    text: 'punkto://toggle, show and hide, for Raycast, Shortcuts or a script.',
  },
  {
    title: 'Asks for two things',
    text: 'Accessibility, to read the menu bar, and access to its layout, to hide what is in it.',
  },
];

// The size is the signed, stripped zip; an unstripped Release build is about three times larger.
const build = { version: '0.1.0', size: '7.8 MB download' };

// Fill in on release day: it shows the install line and links and drops "not out yet".
const release = null as { cask: string; download: string; source: string } | null;

// Colours are in global.css under data-tone="punkto".
const column = 'mx-auto w-[min(100%-2.5rem,38rem)] sm:w-[min(100%-3rem,38rem)]';
const link =
  'underline decoration-(--punkto-muted) underline-offset-[0.22em] hover:text-(--punkto-strong) hover:decoration-current';

export default function PunktoPage() {
  return (
    <div
      data-tone="punkto"
      className="flex flex-1 flex-col bg-(--punkto-ground) font-sans text-[17px] leading-[1.7] text-(--punkto-ink)"
    >
      <header
        className={`${column} flex items-center justify-between gap-4 pt-7 font-mono text-[0.82rem] leading-normal text-(--punkto-muted) sm:pt-10`}
      >
        <p className="flex items-baseline gap-2.5 text-(--punkto-strong)">
          <span className="text-(--punkto-muted)" aria-hidden="true">
            p.
          </span>
          punkto
        </p>
        <nav aria-label="Other apps" className="flex items-baseline gap-2">
          <Link href="/" className="hover:text-(--punkto-strong)">
            thaw
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/floe" className="hover:text-(--punkto-strong)">
            floe
          </Link>
        </nav>
      </header>

      <main id="content" className={`${column} flex-1 pt-16 sm:pt-26`}>
        {/* The site's theme picks the icon, so both are drawn; unpreloaded, the hidden one isn't fetched. */}
        <Image src={iconLight} width={96} alt="" className="size-24 dark:hidden" />
        <Image src={iconDark} width={96} alt="" className="hidden size-24 dark:block" />

        <h1 className="mt-7 mb-6 text-[1.6rem] leading-tight font-normal tracking-[-0.025em] text-(--punkto-strong)">
          Hides the menu bar items you choose.
        </h1>

        <p className="text-(--punkto-muted)">
          Punkto comes from the makers of{' '}
          <Link href="/" className={`text-(--punkto-strong) ${link}`}>
            Thaw
          </Link>{' '}
          and does one of Thaw’s jobs from a single item in your menu bar.
        </p>

        {/* Wraps between facts, never inside one. */}
        <p className="mt-6 font-mono text-[0.8rem] leading-relaxed text-(--punkto-muted)">
          {[
            `v${build.version}`,
            build.size,
            'macOS 27',
            'free',
            'GPL-3.0',
            ...(release ? [] : ['not out yet']),
          ].map((fact, i) => (
            <Fragment key={fact}>
              {/* The non-breaking space keeps a line from starting with a dot. */}
              {i > 0 && ' · '}
              <span className="whitespace-nowrap">{fact}</span>
            </Fragment>
          ))}
        </p>

        {release && <PunktoInstall command={`brew install --cask ${release.cask}`} />}

        {release && (
          <ul className="mt-6 grid gap-1 text-(--punkto-muted)">
            {[
              { href: release.download, text: 'Download Punkto for macOS 27' },
              { href: release.source, text: 'Source' },
              { href: links.discord, text: 'Discord' },
            ].map((item) => (
              <li key={item.text}>
                <span aria-hidden="true">→ </span>
                <a href={item.href} className={link}>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        )}

        <PunktoMenuBar version={build.version} />

        <section
          aria-label="What it does"
          className="mt-14 grid gap-7 border-t border-(--punkto-rule) pt-8 text-(--punkto-muted)"
        >
          {details.map((detail) => (
            <div key={detail.title}>
              <h2 className="mb-0.5 text-base font-normal text-(--punkto-strong)">
                {detail.title}
              </h2>
              <p>{detail.text}</p>
            </div>
          ))}
        </section>

        {/* The owner's words. */}
        <section className="mt-14 grid gap-4 border-t border-(--punkto-rule) pt-8 text-(--punkto-muted)">
          <h2 className="-mb-3.5 text-base font-normal text-(--punkto-strong)">The point</h2>
          <p>
            Punkto is built around a simple idea: reduce complexity without removing capability. The
            work can be complicated; using it shouldn’t have to be.
          </p>
          <p>
            The whole app is one item in your menu bar and the panel it opens. It’s meant to ship
            complete, with updates to keep it working rather than a growing list of features.
          </p>
        </section>
      </main>

      <footer
        className={`${column} mt-16 pb-10 font-mono text-[0.72rem] leading-normal text-(--punkto-muted) sm:mt-20`}
      >
        punkto · from the makers of{' '}
        <Link href="/" className={link}>
          thaw
        </Link>{' '}
        and{' '}
        <Link href="/floe" className={link}>
          floe
        </Link>
      </footer>
    </div>
  );
}
