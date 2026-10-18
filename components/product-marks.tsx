import { AudioLines, Cloud, Layers, Link2 } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import type { ReactNode } from 'react';
import droppyGlyph from '@/assets/droppy-glyph.png';
import floeGlyph from '@/assets/floe-glyph.png';
import nixMark from '@/assets/nix-mark.png';
import omniwmMark from '@/assets/omniwm-mark.png';
import { aiMarks, appleIntelligenceMark } from '@/lib/ai-marks';
import { ClaudeMark } from './claude-mark';
import { ThawMark } from './thaw-mark';

// Every mark is drawn in one colour, black on a light page and white on a dark one, so a
// row of them reads as a set. `glyph` is artwork that is already white; `flat` is coloured
// artwork reduced to its outline.
const marks: Record<
  string,
  | { src: StaticImageData; glyph?: boolean; flat?: boolean }
  | { icon: ReactNode }
  // One path in the text's colour, on a 24 by 24 square unless it names its own.
  | { path: string; box?: string }
> = {
  droppy: { src: droppyGlyph, glyph: true },
  // Raycast's mark from Simple Icons (simpleicons.org, CC0), as a path so it stays sharp.
  raycast: {
    path: 'M6.004 15.492v2.504L0 11.992l1.258-1.249Zm2.504 2.504H6.004L12.008 24l1.253-1.253zm14.24-4.747L24 11.997 12.003 0 10.75 1.251 15.491 6h-2.865L9.317 2.692 8.065 3.944l2.06 2.06H8.691v9.31H18v-1.432l2.06 2.06 1.252-1.252-3.312-3.32V8.506ZM6.63 5.372 5.38 6.625l1.342 1.343 1.251-1.253Zm10.655 10.655-1.247 1.251 1.342 1.343 1.253-1.251zM3.944 8.059 2.692 9.31l3.312 3.314v-2.506zm9.936 9.937h-2.504l3.314 3.312 1.25-1.252z',
  },
  // Floe's menu bar item: the floe of its app icon in one colour, drawn from the same
  // points as Sources/Floe/App/MenuBarGlyph.swift in thaw-app/Floe.
  floe: { src: floeGlyph, glyph: true },
  // Thaw's cube in one colour, like the rest of the row (thaw-mark.tsx).
  thaw: { icon: <ThawMark className="size-[1.125em]" /> },
  // OmniWM's own one-colour mark, unchanged: assets/brand/source/omniwm-mark-monochrome.svg
  // in github.com/OmniNull/OmniWM.
  omniwm: { src: omniwmMark, flat: true },
  // The Nix snowflake, by Simon Frankau and Tim Cuthbertson, under CC BY 4.0
  // (github.com/NixOS/nixos-artwork). Credited on the Built with page.
  nix: { src: nixMark, flat: true },
  // A plain cloud, not Apple's iCloud mark, which is Apple's to use.
  icloud: { icon: <Cloud className="size-[1.125em]" strokeWidth={1.75} /> },
  // Plain signs for Apple's Shortcuts and Siri, whose own marks are Apple's, and for a link.
  shortcuts: { icon: <Layers className="size-[1.125em]" strokeWidth={1.75} /> },
  siri: { icon: <AudioLines className="size-[1.125em]" strokeWidth={1.75} /> },
  link: { icon: <Link2 className="size-[1.125em]" strokeWidth={1.75} /> },
  // What can answer Floe's Ask AI (lib/ai-marks.ts).
  claude: { icon: <ClaudeMark className="size-[1.125em]" /> },
  openai: { path: aiMarks.openai },
  opencode: { path: aiMarks.opencode },
  pi: { path: aiMarks.pi },
  ollama: { path: aiMarks.ollama },
  lmstudio: { path: aiMarks.lmstudio },
  openrouter: { path: aiMarks.openrouter },
  zai: { path: aiMarks.zai },
  // Apple's own mark, at the owner's request: the signs above for iCloud, Shortcuts and Siri
  // stay plain.
  'apple-intelligence': appleIntelligenceMark,
};

/** One icon by name, the height of the text it is set in; nothing for a name it does not know. */
export function Mark({ name }: { name: string }) {
  const mark = marks[name];
  if (!mark) return null;
  if ('icon' in mark) return <span className="inline-flex">{mark.icon}</span>;
  if ('path' in mark)
    return (
      <svg
        viewBox={mark.box ?? '0 0 24 24'}
        fill="currentColor"
        aria-hidden
        className="size-[1.125em]"
      >
        <path d={mark.path} />
      </svg>
    );
  return (
    <Image
      src={mark.src}
      alt=""
      width={24}
      className={`h-[1.125em] w-auto shrink-0 object-contain ${
        mark.glyph ? 'invert dark:invert-0' : mark.flat ? 'brightness-0 dark:invert' : ''
      }`}
    />
  );
}

/**
 * The icons of what a line is about: `<Marks of="droppy floe" />`. In a roadmap card they
 * sit in its lower right corner, the way a task shows who it is assigned to; elsewhere
 * they follow the words. They only decorate, since the line already names them.
 */
export function Marks({ of }: { of: string }) {
  return (
    <span
      aria-hidden
      className="marks ms-2 inline-flex items-center gap-1.5 align-[-0.15em] text-base text-fd-foreground"
    >
      {of.split(' ').map((name) => (
        <Mark key={name} name={name} />
      ))}
    </span>
  );
}
