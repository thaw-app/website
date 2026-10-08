'use client';

import { useEffect, useState } from 'react';
import { barItems } from './menu-bar-model';

/**
 * Apple's own items, which Thaw cannot photograph. Their glyphs are cut from a
 * capture of the real menu bar (reference/menubar/cut-glyphs.cjs); each is
 * listed with its size in points.
 */
const systemGlyphs: Record<string, { file: string; w: number; h: number }> = {
  Bluetooth: { file: 'bluetooth', w: 8.5, h: 14.5 },
  WiFi: { file: 'wifi', w: 16.5, h: 12 },
  'Control Center': { file: 'control-center', w: 13.5, h: 13.5 },
};

/**
 * One menu bar item, drawn the same in the menu bar and in the Layout editor, as the app
 * shows each item there as it looks in the bar: Apple's by their glyphs, the clock as the time.
 */
export function BarItemView({ id }: { id: string }) {
  const item = barItems[id];
  if (!item) return null;

  if (item.kind === 'marker') {
    return (
      <span className="flex h-5 items-center rounded-full border border-white/60 px-2 text-[11px] font-semibold whitespace-nowrap">
        {item.name}
      </span>
    );
  }
  if (item.kind === 'clock') return <Clock />;
  const glyph = item.kind === 'system' ? systemGlyphs[item.name] : undefined;
  if (glyph) {
    return (
      // biome-ignore lint/performance/noImgElement: a glyph at its exact size
      <img
        src={`/desktop/system/${glyph.file}.webp`}
        alt={item.name}
        draggable={false}
        style={{ width: glyph.w, height: glyph.h, maxWidth: 'none' }}
      />
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: the item's own picture at its exact size
    <img
      src={`/desktop/thaw/items/${id}.webp`}
      alt={item.name}
      draggable={false}
      style={{ width: item.w, height: item.h, maxWidth: 'none' }}
    />
  );
}

/** The time, filled in after load because the server cannot know the visitor's clock. */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="whitespace-nowrap tabular-nums">
      {now?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  );
}
