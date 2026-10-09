'use client';

import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useState } from 'react';

const FloeSearchDialog = dynamic(
  () => import('./search-dialog').then((module) => module.FloeSearchDialog),
  { ssr: false },
);

/**
 * The search box, fetched the first time it is opened. Fumadocs keeps its dialog mounted
 * while it is shut, so a lazy import alone would still fetch it with every page: this
 * holds it back until someone asks for it, and keeps it from then on.
 */
function SearchOnDemand(props: SharedProps) {
  const [wanted, setWanted] = useState(false);
  if (props.open && !wanted) setWanted(true);
  const { onOpenChange } = props;

  // The keyboard shortcut opens it through `open`. A search button is tied to the dialog
  // itself, so until the dialog exists a click on one opens nothing: that first click is
  // answered here.
  useEffect(() => {
    if (wanted) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element | null)?.closest?.('[data-search], [data-search-full]')) return;
      setWanted(true);
      onOpenChange(true);
    };
    // Pointing at a button, or tabbing to it, fetches the box ahead of the click, so the
    // click is not left waiting on the network with nothing to show for it.
    const warm = (event: Event) => {
      if ((event.target as Element | null)?.closest?.('[data-search], [data-search-full]'))
        void import('./search-dialog');
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', warm, true);
    document.addEventListener('focusin', warm, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', warm, true);
      document.removeEventListener('focusin', warm, true);
    };
  }, [wanted, onOpenChange]);

  return wanted ? <FloeSearchDialog {...props} /> : null;
}

// The theme library sets the theme with a script tag it renders itself. On the
// server that tag runs before the page paints, which is its whole job. When the
// same component renders again in the browser, React warns that a script it
// renders there will never run. Marking the browser's copy as data, not code,
// keeps the server's behaviour and ends the warning.
const scriptProps = typeof window === 'undefined' ? undefined : { type: 'application/json' };

/** Fumadocs' providers for the whole site. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ scriptProps }} search={{ SearchDialog: SearchOnDemand }}>
      {children}
    </RootProvider>
  );
}
