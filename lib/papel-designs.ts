// What hangs on the strings: which designs, in which dyes and in what order. The cuts themselves are
// in public/papel-picado, undyed, and the page dyes them (components/papel-sheet.tsx).

/** A sheet's width over its height. */
export const RATIO = 800 / 620;
export const FULL = { COLS: 27, ROWS: 21 };
export const TALL = { COLS: 21, ROWS: 27 };
export const COARSE = { COLS: 14, ROWS: 11 };

export interface SheetDesign {
  source: string;
  /** The dye, from the top of the sheet to its foot. */
  dye: [string, string];
  seed: number;
}

// Each app's colours are for its own sheet alone, from its icon (AppIcon.icon in each repo), and
// Droppy's from its badge. Everything else takes the colours papel picado is really sold in.
const DYES: Record<string, [string, string]> = {
  amber: ['#FFC233', '#D16B06'],
  blue: ['#1A7FD0', '#0B3F8C'],
  droppy: ['#2B84F0', '#1A5FC0'],
};
const FESTIVE: [string, string][] = [
  ['#F0288E', '#C4006A'], // Rosa mexicano
  ['#2CB463', '#0E7A3C'], // Green
  ['#9247D8', '#5E1FA3'], // Purple
  ['#E8313F', '#B3121F'], // Red
  ['#14B8AC', '#067D75'], // Turquoise
  ['#9CCB24', '#5F8F0C'], // Lime
];

// What fills the places between the three marks, shuffled once a page so the two strings on it
// agree, and used in turn so nothing comes round again until all of them have been.
const picks = [
  'hummingbird',
  'calavera',
  'catrina',
  'conure',
  'sun',
  'butterfly',
  'heart',
  'nopal',
  'flower',
  'star',
  'noviembre',
  'dove',
  'charro',
  'couple',
  'musicians',
];
for (let i = picks.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [picks[i], picks[j]] = [picks[j], picks[i]];
}
// Random, Floe, random, Thaw, random, Droppy, random, and round again.
const PLACES: ([string, [string, string]] | null)[] = [
  null,
  ['floe', DYES.blue],
  null,
  ['cube', DYES.amber],
  null,
  ['droppy', DYES.droppy],
  null,
];
export const pattern = (prefix: string, count: number, start = 0): SheetDesign[] => {
  let next = 0;
  return Array.from({ length: count }, (_, i) => {
    const place = PLACES[(start + i) % PLACES.length];
    const n = next;
    if (!place) next++;
    const [name, dye] = place ?? [picks[n % picks.length], FESTIVE[n % FESTIVE.length]];
    return { source: `/papel-picado/${prefix}${name}.svg`, dye, seed: 5113 + i * 1231 };
  });
};

/** A string of an odd number of flags with a product's own in the middle, the pattern either side. */
export const around = (product: 'thaw' | 'floe', prefix: string, count: number) => {
  const middle = product === 'floe' ? 1 : 3;
  const start = ((middle - (count - 1) / 2) % PLACES.length) + PLACES.length;
  return pattern(prefix, count, start);
};

// Over each product's headline, the first sheet cut, which is taller than the rest.
export const MARKS = {
  thaw: {
    source: '/papel-picado/thaw-sheet.svg',
    dye: DYES.amber,
    seed: 9984,
    ratio: 600 / 760,
    grid: TALL,
    label: 'Thaw’s cube in papel picado, a sheet of cut tissue paper hanging on a string',
  },
  floe: {
    source: '/papel-picado/floe-sheet.svg',
    dye: DYES.blue,
    seed: 4177,
    ratio: 600 / 760,
    grid: TALL,
    label: 'Floe’s ice floe in papel picado, a sheet of cut tissue paper hanging on a string',
  },
};

/** As many flags as fit, with the three marks kept: Floe, Thaw and Droppy on a phone. */
export function fitting(width: number, pitch: number) {
  const all = pattern('', 7);
  // The banner's height follows the window with its scrollbar (vw), and `width` leaves that out,
  // so a sheet that nearly fits still counts.
  const room = Math.floor(width / pitch + 0.08);
  if (room >= 7) return all;
  if (room >= 5) return all.slice(1, 6);
  return [all[1], all[3], all[5]];
}

/** The short string over a product's page: the bolder cuts, tied up every seven flags. */
export const stripOptions = { sag: 10, below: 220, grid: COARSE, sheet: 66, tile: 7 };
