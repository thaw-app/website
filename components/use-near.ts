import { useEffect, useRef, useState } from 'react';

/** Whether an element has come near the window: a screen and a half ahead of a reader scrolling. */
export function useNear<T extends Element>() {
  const stage = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        seen.disconnect();
      },
      { rootMargin: '150% 0px' },
    );
    seen.observe(element);
    return () => seen.disconnect();
  }, []);
  return { stage, near };
}
