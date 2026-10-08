'use client';

import { useTheme } from 'next-themes';
import { use, useEffect, useId, useState } from 'react';

/** Renders a mermaid code block from the docs as a diagram. */
export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);

  // Mermaid measures text in the browser, so nothing is drawn on the server.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(key: string, setPromise: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const { default: mermaid } = use(cachePromise('mermaid', () => import('mermaid')));

  mermaid.initialize({
    startOnLoad: false,
    // The docs come from repositories that take pull requests from anyone, so a diagram is
    // not trusted: no HTML in its labels and no click handlers.
    securityLevel: 'strict',
    fontFamily: 'inherit',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () =>
      mermaid.render(id, chart.replaceAll('\\n', '\n')),
    ),
  );

  return (
    <div
      ref={(container) => {
        if (container) bindFunctions?.(container);
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the SVG mermaid drew from our own docs
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
