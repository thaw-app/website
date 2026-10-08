'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { FloeSearchDialog } from './search-dialog';

// The theme library sets the theme with a script tag it renders itself. On the
// server that tag runs before the page paints, which is its whole job. When the
// same component renders again in the browser, React warns that a script it
// renders there will never run. Marking the browser's copy as data, not code,
// keeps the server's behaviour and ends the warning.
const scriptProps = typeof window === 'undefined' ? undefined : { type: 'application/json' };

/** Fumadocs' providers for the whole site. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ scriptProps }} search={{ SearchDialog: FloeSearchDialog }}>
      {children}
    </RootProvider>
  );
}
