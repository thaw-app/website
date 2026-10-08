import { useEffect, useState } from 'react';

/**
 * Keeps something on screen for a moment after it closes, so it can animate
 * out. `mounted` says whether to draw it, `closing` whether it is on its way.
 */
export function usePresence(open: boolean, exitMs = 160) {
  const [lingering, setLingering] = useState(false);

  useEffect(() => {
    if (open) {
      setLingering(true);
      return;
    }
    const timer = setTimeout(() => setLingering(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted: open || lingering, closing: !open && lingering };
}
