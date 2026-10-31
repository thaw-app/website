'use client';

import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import { useGallery } from './conure-greeting';

// The game the conure opens, fetched only if someone opens it.
const FooterShootout = dynamic(
  () => import('./footer-shootout').then((module) => module.FooterShootout),
  { ssr: false },
);

/**
 * The part of the page for an address that is no page where its conure stands, which is
 * where the shooting gallery opens when it is the one asked. What is here stays out of
 * reach while the game covers it, from the moment the game has noted where the focus was.
 */
export function StrayStage({ children }: { children: ReactNode }) {
  const { playing, close } = useGallery();
  const [covered, setCovered] = useState(false);
  return (
    <div data-shootout={playing || undefined} className="stray-stage relative -mx-6 px-6">
      <div inert={(playing && covered) || undefined}>{children}</div>
      {playing && <FooterShootout onDone={close} leaving="page" onOpen={() => setCovered(true)} />}
    </div>
  );
}
