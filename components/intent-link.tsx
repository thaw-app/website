'use client';

import Link from 'next/link';
import { type ComponentProps, useState } from 'react';

/**
 * A Link that prefetches on hover, touch or focus instead of on scrolling into view, for
 * long lists where most pages are never opened (Next.js: hover-triggered prefetch).
 */
export function IntentLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: Omit<ComponentProps<typeof Link>, 'prefetch'>) {
  const [wanted, setWanted] = useState(false);
  return (
    <Link
      {...props}
      prefetch={wanted ? null : false}
      onMouseEnter={(event) => {
        setWanted(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setWanted(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setWanted(true);
        onTouchStart?.(event);
      }}
    />
  );
}
