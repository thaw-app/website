'use client';

import { useEffect, useRef, useState } from 'react';

/** The install command; a click anywhere copies it and the last word reports the result. */
export function PunktoInstall({ command }: { command: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    // The clipboard is refused when the page isn't focused.
    try {
      await navigator.clipboard.writeText(command);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${command}`}
      className="group mt-6 flex w-full items-center gap-3 rounded-lg border border-(--punkto-rule) bg-(--punkto-bar) px-4 py-2.5 text-left font-mono text-[0.8rem] leading-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--punkto-strong)"
    >
      <span className="text-(--punkto-muted)" aria-hidden="true">
        $
      </span>
      <code className="min-w-0 flex-1 truncate text-(--punkto-strong)">{command}</code>
      <span
        aria-live="polite"
        className="shrink-0 text-(--punkto-muted) group-hover:text-(--punkto-strong)"
      >
        {state === 'copied' ? 'copied' : state === 'failed' ? 'couldn’t copy' : 'copy'}
      </span>
    </button>
  );
}
