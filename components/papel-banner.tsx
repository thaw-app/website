'use client';

import { useState } from 'react';
import { Paper } from '@/components/papel-lazy';
import { useNear } from '@/components/use-near';
import { fitting } from '@/lib/papel-designs';

/**
 * The string of papel picado at the head of the footer, to brush, pull and rip. Its room is kept
 * from the start (the stylesheet gives it a height), so nothing moves when it arrives. Out of
 * season it is hidden, so it is never near and nothing is fetched.
 */
export function PapelBanner() {
  const { stage, near } = useNear<HTMLDivElement>();
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div
      ref={stage}
      role="img"
      aria-label="A string of tissue paper flags in bright colours, cut with Floe’s ice floe, Thaw’s cube, Droppy’s drop and traditional figures"
      className="papel-banner in-season relative"
    >
      {near && (
        <Paper designs={fitting} options={{ sag: 34, below: 180 }} onFail={() => setFailed(true)} />
      )}
    </div>
  );
}
