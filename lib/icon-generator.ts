// What /generate draws, as one SVG, and the files made from it, all in the visitor's browser.
// The JSON holds the app icon's layers (Thaw/Resources/AppIcon.icon, display-p3 read as sRGB) and
// the papel cube cut in public/papel-picado/cube.svg.
import data from './icon-generator.json';

interface Layer {
  name: string;
  group: string;
  svg: string;
  opacity: number;
  fill: [string, string];
  shadow: number;
}
const layers = data.layers as Layer[];
const tile = data.tile as Record<'light' | 'dark', [string, string]>;
const papelCube = data.papel as Record<'fine' | 'bold', string>;

/** The dyes the site's papel picado is cut from (lib/papel-designs.ts), and one of your own. */
export const dyes = {
  amber: { label: 'Amber', colours: ['#FFC233', '#D16B06'] },
  rosa: { label: 'Rosa mexicano', colours: ['#F0288E', '#C4006A'] },
  green: { label: 'Green', colours: ['#2CB463', '#0E7A3C'] },
  purple: { label: 'Purple', colours: ['#9247D8', '#5E1FA3'] },
  red: { label: 'Red', colours: ['#E8313F', '#B3121F'] },
  turquoise: { label: 'Turquoise', colours: ['#14B8AC', '#067D75'] },
  lime: { label: 'Lime', colours: ['#9CCB24', '#5F8F0C'] },
  blue: { label: 'Blue', colours: ['#1A7FD0', '#0B3F8C'] },
  custom: { label: 'Your own', colours: null },
} as const;
export type Dye = keyof typeof dyes;

/** The colours an aura is blended from, the first two as its ground. */
export const auras = {
  sunset: { label: 'Sunset', colours: ['#FF8A4C', '#FFB057', '#F2789F', '#7FA6D6', '#DCDFE6'] },
  thaw: { label: 'Thaw', colours: ['#FF9933', '#D16B06', '#FFC233', '#FFE7A8', '#F2789F'] },
  sea: { label: 'Sea', colours: ['#2B6FE0', '#48C6D9', '#9B7BF0', '#E4F1FF', '#1A3F9C'] },
  dusk: { label: 'Dusk', colours: ['#4A2A86', '#F2789F', '#FF9E5E', '#2E3B8F', '#C9A7F5'] },
  moss: { label: 'Moss', colours: ['#1F7A55', '#9CCB24', '#F4D35E', '#0E3B4A', '#BFE3C0'] },
} as const;
export type Aura = keyof typeof auras;

export interface Settings {
  style: 'plain' | 'aura' | 'sketch' | 'blueprint' | 'ink' | 'papel';
  aura: Aura;
  /** How many blobs of colour, so how much is going on behind the cube. */
  blobs: number;
  softness: number;
  outline: boolean;
  /** Light or dark paper for the sketch, a white or a black tile for ink. */
  tone: 'light' | 'dark';
  blue: string;
  grid: boolean;
  hatch: boolean;
  grain: boolean;
  shape: 'squircle' | 'rounded' | 'circle' | 'square';
  radius: number;
  margin: number;
  tileShadow: boolean;
  bg: 'light' | 'dark' | 'gradient' | 'solid' | 'none';
  bg1: string;
  bg2: string;
  bgAngle: number;
  sheen: boolean;
  mark: 'layers' | 'flat' | 'cutout';
  markColour: string;
  faces: boolean;
  layerShadow: boolean;
  size: number;
  shift: number;
  dye: Dye;
  dye1: string;
  dye2: string;
  backing: 'dark' | 'custom' | 'none';
  backingColour: string;
  detail: 'fine' | 'bold';
  clear: 'shape' | 'circle' | 'rounded';
  window: number;
  fit: number;
  ties: number;
  ring: boolean;
  border: boolean;
  corners: boolean;
  foot: boolean;
  crumple: number;
  lift: boolean;
  seed: number;
}

export const defaults: Settings = {
  style: 'plain',
  aura: 'sunset',
  blobs: 5,
  softness: 90,
  outline: false,
  tone: 'light',
  blue: '#1F6BF0',
  grid: true,
  hatch: true,
  grain: true,
  shape: 'squircle',
  radius: 22,
  margin: 100,
  tileShadow: true,
  bg: 'light',
  bg1: '#2B2B2B',
  bg2: '#0A0A0A',
  bgAngle: 180,
  sheen: true,
  mark: 'layers',
  markColour: '#FFF6DB',
  faces: true,
  layerShadow: true,
  size: 100,
  shift: 0,
  dye: 'amber',
  dye1: '#FFC233',
  dye2: '#D16B06',
  backing: 'dark',
  backingColour: '#101010',
  detail: 'fine',
  clear: 'shape',
  window: 178,
  fit: 88,
  ties: 12,
  ring: true,
  border: true,
  corners: true,
  foot: true,
  crumple: 3.2,
  lift: true,
  seed: 9,
};

const app: Partial<Settings> = {
  style: 'plain',
  shape: 'squircle',
  margin: 100,
  tileShadow: true,
  bg: 'light',
  sheen: true,
  mark: 'layers',
  faces: true,
  layerShadow: true,
  size: 100,
  shift: 0,
};

/** Where to start, each a whole set of settings, with what it is for. */
export const presets = {
  app: { label: 'Original', settings: app },
  dark: { label: 'Original, dark', settings: { ...app, bg: 'dark' } },
  aura: { label: 'Aura', settings: { ...app, style: 'aura', grain: false } },
  sketch: { label: 'Sketch', settings: { ...app, style: 'sketch' } },
  blueprint: { label: 'Blueprint', settings: { ...app, style: 'blueprint' } },
  ink: { label: 'Ink', settings: { ...app, style: 'ink', layerShadow: false } },
  papel: {
    label: 'Papel picado',
    settings: { ...app, style: 'papel', dye: 'amber', backing: 'dark', clear: 'shape' },
  },
} satisfies Record<string, { label: string; settings: Partial<Settings> }>;
export type Preset = keyof typeof presets;

/** What a preset sets, on top of the defaults, so one never keeps what another left. */
export const fromPreset = (preset: Preset): Settings => ({
  ...defaults,
  ...presets[preset].settings,
});

const N = 1024;
const r1 = (n: number) => Math.round(n * 10) / 10;

function squircle(x: number, y: number, size: number) {
  // Apple's tile has continuous corners; a superellipse is a close match.
  const n = 5;
  const c = x + size / 2;
  const m = y + size / 2;
  const h = size / 2;
  const points: string[] = [];
  for (let i = 0; i < 256; i++) {
    const t = (i / 256) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    points.push(
      `${r1(c + h * Math.sign(ct) * Math.abs(ct) ** (2 / n))} ${r1(m + h * Math.sign(st) * Math.abs(st) ** (2 / n))}`,
    );
  }
  return `M${points.join('L')}Z`;
}
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
function tilePath(s: Settings) {
  const m = s.margin;
  const size = N - 2 * m;
  if (s.shape === 'squircle') return squircle(m, m, size);
  if (s.shape === 'circle') return roundedRect(m, m, size, size, size / 2);
  if (s.shape === 'rounded') return roundedRect(m, m, size, size, (size * s.radius) / 100);
  return roundedRect(m, m, size, size, 0);
}
// How round the shape's corners are, as a share of its side, for the papel cuts to follow.
const roundness = (s: Settings) =>
  ({ squircle: 0.23, circle: 0.5, rounded: s.radius / 100, square: 0 })[s.shape];

function fillOf(s: Settings): [string, string] | null {
  if (s.bg === 'light' || s.bg === 'dark') return tile[s.bg];
  if (s.bg === 'gradient') return [s.bg1, s.bg2];
  if (s.bg === 'solid') return [s.bg1, s.bg1];
  return null;
}
function mix(hex: string, to: string, k: number) {
  const rgb = (h: string) => {
    const n = Number.parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [a, b] = [rgb(hex), rgb(to)];
  return `#${a
    .map((c, i) =>
      Math.round(c + (b[i] - c) * k)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}
function darker(hex: string, k: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c * k)).join(',')})`;
}
function angleStops(angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  const x = Math.cos(a) / 2;
  const y = Math.sin(a) / 2;
  return `x1="${r1(0.5 - x)}" y1="${r1(0.5 - y)}" x2="${r1(0.5 + x)}" y2="${r1(0.5 + y)}"`;
}

const placement = (s: Settings) => {
  const t = ((N - 2 * s.margin) / N) * (s.size / 100);
  return `translate(${N / 2} ${N / 2 + s.shift}) scale(${r1(t * 1000) / 1000}) translate(${-N / 2} ${-N / 2})`;
};

// The cube, in its own 1024 frame, scaled into the tile.
function cube(
  s: Settings,
  fill: [string, string] | null,
  colour = '#fff',
  tones: (layer: Layer) => [string, string] = (layer) => layer.fill,
  alpha: (layer: Layer) => number = (layer) => layer.opacity,
) {
  const place = placement(s);
  let defs = '';
  let body = '';
  const tint = fill ? darker(fill[1], 0.4) : '#000';
  const groups: { name: string; shadow: number; body: string }[] = [];
  for (const layer of layers) {
    if (layer.group === 'Faces' && (!s.faces || s.mark !== 'layers')) continue;
    let group = groups.at(-1);
    if (!group || group.name !== layer.group) {
      group = { name: layer.group, shadow: layer.shadow, body: '' };
      groups.push(group);
    }
    if (s.mark === 'layers') {
      const id = `f-${layer.name}`;
      defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="181" x2="0" y2="841"><stop offset="0" stop-color="${tones(layer)[0]}"/><stop offset="1" stop-color="${tones(layer)[1]}"/></linearGradient>`;
      group.body += `<g fill="url(#${id})" opacity="${alpha(layer)}">${layer.svg}</g>`;
    } else {
      group.body += `<g fill="${colour}">${layer.svg}</g>`;
    }
  }
  for (const group of groups) {
    if (s.mark === 'layers' && s.layerShadow && group.shadow) {
      const id = `sh-${group.name.replace(/\W/g, '')}`;
      // The whole frame, not a share of the layer's own box: a thin layer like the top innards
      // would otherwise have its shadow cut off in a straight line.
      defs += `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${N}" height="${N}"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="${tint}" flood-opacity="${Math.min(1, group.shadow * 1.6)}"/></filter>`;
      body += `<g filter="url(#${id})">${group.body}</g>`;
    } else body += `<g>${group.body}</g>`;
  }
  return { defs, body: `<g transform="${place}">${body}</g>` };
}

function plain(s: Settings) {
  const fill = fillOf(s);
  const shape = tilePath(s);
  let defs = `<clipPath id="tile"><path d="${shape}"/></clipPath>`;
  const drawn = cube(s, fill);
  defs += drawn.defs;
  let ground = '';
  if (fill) {
    const along =
      s.bg === 'light' || s.bg === 'dark' ? 'x1="0" y1="0" x2="0" y2="1"' : angleStops(s.bgAngle);
    defs += `<linearGradient id="bg" ${along}><stop offset="0" stop-color="${fill[0]}"/><stop offset="1" stop-color="${fill[1]}"/></linearGradient>`;
    ground = `<path d="${shape}" fill="url(#bg)"/>`;
  }
  let sheen = '';
  if (fill && s.sheen) {
    // Lighter at the top and a thin bright rim, as the light falls on the glass of the app icon.
    defs += `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    sheen = `<path d="${shape}" fill="url(#sheen)"/><path d="${shape}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="5" clip-path="url(#tile)"/>`;
  }
  if (s.mark === 'cutout') {
    const hole = cube(s, fill, '#000');
    defs += `<mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="${N}" height="${N}"><rect width="${N}" height="${N}" fill="#fff"/>${hole.body}</mask>`;
    return {
      defs,
      out: `<g mask="url(#cut)">${ground || `<path d="${shape}" fill="${s.markColour}"/>`}${sheen}</g>`,
    };
  }
  const mark = s.mark === 'flat' ? cube(s, fill, s.markColour).body : drawn.body;
  // Without a fill there is no tile to keep the cube inside.
  return { defs, out: fill ? `${ground}<g clip-path="url(#tile)">${mark}</g>${sheen}` : mark };
}

// Lines across the tile, `cells` to a side, as on squared paper.
function gridPattern(id: string, s: Settings, cells: number, colour: string, width: number) {
  const cell = r1((N - 2 * s.margin) / cells);
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" x="${s.margin}" y="${s.margin}" width="${cell}" height="${cell}"><path d="M0 0H${cell}M0 0V${cell}" fill="none" stroke="${colour}" stroke-width="${width}"/></pattern>`;
}

// The same numbers for the same seed, so a shuffle can be kept and made again.
function random(seed: number) {
  let a = seed * 2654435761;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Blobs of colour blurred into one another, and the cube in white over them.
function aura(s: Settings) {
  const shape = tilePath(s);
  const size = N - 2 * s.margin;
  const colours = auras[s.aura].colours;
  const next = random(s.seed);
  let defs = `<clipPath id="tile"><path d="${shape}"/></clipPath><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colours[0]}"/><stop offset="1" stop-color="${colours[1]}"/></linearGradient><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${r1((s.softness * size) / 824)}"/></filter>`;
  let blobs = '';
  for (let i = 0; i < s.blobs; i++) {
    const x = s.margin + size * (0.05 + 0.9 * next());
    const y = s.margin + size * (0.05 + 0.9 * next());
    const rx = size * (0.16 + 0.22 * next());
    const ry = rx * (0.6 + 0.6 * next());
    const turn = Math.round(next() * 180);
    blobs += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" transform="rotate(${turn} ${r1(x)} ${r1(y)})" fill="${colours[(i % (colours.length - 1)) + 1]}" opacity="${r1(0.7 + 0.3 * next())}"/>`;
  }
  let mark: string;
  if (s.outline) {
    // Only the frame and the innards, traced in a round white line.
    let lines = '';
    for (const layer of layers)
      if (layer.group !== 'Faces' || s.faces)
        lines += `<g fill="none" stroke="#fff" stroke-width="13" stroke-linejoin="round" stroke-linecap="round" opacity="${layer.group === 'Faces' ? 0.5 : 0.95}">${layer.svg}</g>`;
    mark = `<g transform="${placement(s)}">${lines}</g>`;
  } else {
    const drawn = cube(
      { ...s, mark: 'layers' },
      [colours[3], colours[1]],
      '#fff',
      () => ['#FFFFFF', '#FFFFFF'],
      (layer) => (layer.group === 'Faces' ? layer.opacity * 0.6 : 0.94),
    );
    defs += drawn.defs;
    mark = drawn.body;
  }
  let ground = `<path d="${shape}" fill="url(#bg)"/><g filter="url(#blur)">${blobs}</g>`;
  if (s.grain) {
    defs += `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .14 0 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    ground += `<path d="${shape}" filter="url(#grain)"/>`;
  }
  return { defs, out: `<g clip-path="url(#tile)">${ground}${mark}</g>` };
}

// Pencil on squared paper, or chalk on a blackboard: the cube's outlines, its faces hatched.
function sketch(s: Settings) {
  const dark = s.tone === 'dark';
  const shape = tilePath(s);
  const line = dark ? '#EEEDE6' : '#1C1C1C';
  const paper = dark ? ['#262626', '#121212'] : ['#FCFCFA', '#EEEEEA'];
  let defs = `<clipPath id="tile"><path d="${shape}"/></clipPath><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paper[0]}"/><stop offset="1" stop-color="${paper[1]}"/></linearGradient>`;
  defs += gridPattern('grid', s, 6, dark ? 'rgba(255,255,255,.16)' : '#B9CFEA', 3);
  // Each face hatched its own way, so the three read as sides of a box.
  const angles: Record<string, number> = { 'face-left': 55, 'face-right': -55, 'face-top': 0 };
  for (const [name, angle] of Object.entries(angles))
    defs += `<pattern id="h-${name}" patternUnits="userSpaceOnUse" width="19" height="19" patternTransform="rotate(${angle})"><path d="M0 9.5H19" stroke="${line}" stroke-width="3.4"/></pattern>`;
  // A slight wobble, as a hand draws, and for chalk, gaps where it skipped over the board.
  defs += `<filter id="hand" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="1" seed="${s.seed}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>${
    dark && s.grain
      ? `<feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="4" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.75" result="a"/><feComposite in="d" in2="a" operator="in"/>`
      : ''
  }</filter>`;
  if (s.grain)
    defs += `<filter id="tooth" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 ${dark ? 0.16 : 0.1} 0"/></filter>`;
  let drawn = '';
  for (const layer of layers) {
    const face = layer.group === 'Faces';
    if (face && !s.faces) continue;
    const fill = face && s.hatch ? `url(#h-${layer.name})` : face ? 'none' : 'url(#bg)';
    drawn += `<g fill="${fill}" stroke="${line}" stroke-width="${dark ? 6 : 5.5}" stroke-linejoin="round" stroke-linecap="round">${layer.svg}</g>`;
  }
  const ground = `<path d="${shape}" fill="url(#bg)"/>${s.grid ? `<path d="${shape}" fill="url(#grid)"/>` : ''}${s.grain ? `<rect width="${N}" height="${N}" filter="url(#tooth)"/>` : ''}`;
  return {
    defs,
    out: `<g clip-path="url(#tile)">${ground}<g filter="url(#hand)"><g transform="${placement(s)}">${drawn}</g></g></g>`,
  };
}

// The cube in pale glass on blue, over the lines an icon is drawn to.
function blueprint(s: Settings) {
  const shape = tilePath(s);
  const size = N - 2 * s.margin;
  const c = N / 2;
  let defs = `<clipPath id="tile"><path d="${shape}"/></clipPath><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(s.blue, '#ffffff', 0.12)}"/><stop offset="1" stop-color="${mix(s.blue, '#000000', 0.08)}"/></linearGradient>`;
  defs += gridPattern('grid', s, 16, 'rgba(255,255,255,.13)', 2.5);
  const guides = [0.5, 0.39, 0.2]
    .map((k) => `<circle cx="${c}" cy="${c}" r="${r1(size * k)}"/>`)
    .join('');
  const lines = `<path d="M${s.margin} ${s.margin}L${N - s.margin} ${N - s.margin}M${N - s.margin} ${s.margin}L${s.margin} ${N - s.margin}M${c} ${s.margin}V${N - s.margin}M${s.margin} ${c}H${N - s.margin}"/>`;
  const template = s.grid
    ? `<path d="${shape}" fill="url(#grid)"/><g fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2.5">${guides}${lines}</g>`
    : '';
  const glass = (layer: Layer): [string, string] =>
    layer.group === 'Faces'
      ? ['#FFFFFF', mix(s.blue, '#ffffff', 0.75)]
      : ['#FFFFFF', mix(s.blue, '#ffffff', 0.7)];
  const drawn = cube({ ...s, mark: 'layers' }, [s.blue, s.blue], '#fff', glass);
  defs += drawn.defs;
  return {
    defs,
    out: `<g clip-path="url(#tile)"><path d="${shape}" fill="url(#bg)"/>${template}${drawn.body}</g>`,
  };
}

// One dark ink on a white tile, or white on black, with a little grain.
function ink(s: Settings) {
  const dark = s.tone === 'dark';
  const shape = tilePath(s);
  const tile = dark ? ['#1C1C1C', '#080808'] : ['#FFFFFF', '#F2F2F2'];
  const tones = (layer: Layer): [string, string] =>
    dark
      ? layer.group === 'Faces'
        ? ['#DADADA', '#9A9A9A']
        : ['#FFFFFF', '#C4C4C4']
      : layer.group === 'Faces'
        ? ['#6A6A6A', '#3A3A3A']
        : ['#3C3C3C', '#0C0C0C'];
  let defs = `<clipPath id="tile"><path d="${shape}"/></clipPath><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tile[0]}"/><stop offset="1" stop-color="${tile[1]}"/></linearGradient>`;
  // The faces nearly as dark as the frame, so the cube reads as one solid shape.
  const drawn = cube(
    { ...s, mark: 'layers' },
    dark ? ['#000000', '#000000'] : ['#ffffff', '#5a5a5a'],
    '#000',
    tones,
    (layer) => (layer.group === 'Faces' ? Math.min(1, layer.opacity + (dark ? 0.3 : 0.35)) : 1),
  );
  defs += drawn.defs;
  const body = drawn.body;
  if (s.grain) {
    // Fine speckle over the ink and the tile, as on printed card; it also hides the gradient's steps.
    defs += `<filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  ${dark ? 0.16 : 0.08} 0 0 0 0"/><feComposite in2="SourceAlpha" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>`;
  }
  const drawnInk = `<path d="${shape}" fill="url(#bg)"/>${body}`;
  return {
    defs,
    out: `<g clip-path="url(#tile)">${s.grain ? `<g filter="url(#grain)">${drawnInk}</g>` : drawnInk}</g>`,
  };
}

// Papel picado: the shapes the cuts are made of, in a sheet 600 across.
const P = 600;
const INSET = 30;
function petal(cx: number, cy: number, angle: number, ra: number, rb: number, w: number) {
  const a = (angle * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const p = (r: number, t: number) => `${r1(cx + r * c - t * s)} ${r1(cy + r * s + t * c)}`;
  const m = ra + (rb - ra) * 0.62;
  return `M${p(ra, 0)}Q${p(m, w / 2)} ${p(rb, 0)}Q${p(m, -w / 2)} ${p(ra, 0)}Z`;
}
const diamond = (x: number, y: number, rx: number, ry = rx) =>
  `M${r1(x)} ${r1(y - ry)}L${r1(x + rx)} ${r1(y)}L${r1(x)} ${r1(y + ry)}L${r1(x - rx)} ${r1(y)}Z`;
const dot = (x: number, y: number, r: number) =>
  `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const rosette = (x: number, y: number, r: number, n = 8) =>
  Array.from({ length: n }, (_, i) => petal(x, y, (i * 360) / n, r * 0.34, r, r * 0.5)).join('') +
  dot(x, y, r * 0.16);
function scalloped(cx: number, cy: number, r: number, n: number) {
  const points = Array.from({ length: n }, (_, i) => [
    cx + r * Math.cos((2 * Math.PI * i) / n),
    cy + r * Math.sin((2 * Math.PI * i) / n),
  ]);
  const arc = r1(r * Math.sin(Math.PI / n) * 1.05);
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (const [x, y] of [...points.slice(1), points[0]])
    d += `A${arc} ${arc} 0 0 1 ${r1(x)} ${r1(y)}`;
  return `${d}Z`;
}
// How far a point lies inside the rounded square, so a cut is only made where paper surrounds it.
function depth(x: number, y: number, round: number) {
  const qx = Math.abs(x - P / 2) - (P / 2 - round);
  const qy = Math.abs(y - P / 2) - (P / 2 - round);
  return round - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0));
}
// Points spaced evenly along the rounded square, from the top middle so both sides match.
function along(inset: number, round: number, step: number) {
  const w = P - 2 * inset;
  const r = Math.max(0, Math.min(round - inset, w / 2));
  const straight = w - 2 * r;
  const side = straight + (Math.PI * r) / 2;
  const total = 4 * side;
  const n = Math.max(4, 4 * Math.round(total / step / 4));
  const points: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let t = ((i * total) / n + straight / 2) % total;
    const k = Math.floor(t / side);
    t -= k * side;
    let x: number;
    let y: number;
    if (t <= straight) {
      x = inset + r + t;
      y = inset;
    } else {
      const a = -Math.PI / 2 + ((t - straight) / ((Math.PI * r) / 2)) * (Math.PI / 2);
      x = inset + w - r + r * Math.cos(a);
      y = inset + r + r * Math.sin(a);
    }
    for (let j = 0; j < k; j++) [x, y] = [P - y, x];
    points.push([x, y]);
  }
  return points;
}

// The papel cube's own bounds, measured once in the page, so it can be fitted to the window.
const boxes: Partial<Record<Settings['detail'], { x: number; y: number; w: number; h: number }>> =
  {};
function cubeBox(detail: Settings['detail']) {
  const known = boxes[detail];
  if (known) return known;
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  probe.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  probe.innerHTML = `<g>${papelCube[detail]}</g>`;
  document.body.append(probe);
  const b = (probe.firstChild as SVGGElement).getBBox();
  probe.remove();
  const box = { x: b.x - 4, y: b.y - 4, w: b.width + 8, h: b.height + 8 };
  boxes[detail] = box;
  return box;
}

function papel(s: Settings) {
  const own = roundness(s) * P;
  const round =
    s.clear === 'circle' ? P / 2 : s.clear === 'rounded' ? Math.max(own, 0.22 * P) : own;
  const cx = P / 2;
  const cy = s.foot ? 294 : P / 2;
  const R = s.window;
  const keep = (x: number, y: number, size: number) => depth(x, y, round) >= INSET * 0.5 + size;
  const ringOut = s.ring ? R + 79 : R + 12;
  const gap = (x: number, y: number) => Math.hypot(x - cx, y - cy) - ringOut;
  const cuts: string[] = [];
  if (s.ring)
    for (let i = 0; i < 24; i++) {
      const a = ((i * 15 + 7.5) * Math.PI) / 180;
      const b = (i * 15 * Math.PI) / 180;
      if (keep(cx + (R + 66) * Math.cos(a), cy + (R + 66) * Math.sin(a), 4))
        cuts.push(petal(cx, cy, i * 15 + 7.5, R + 27, R + 66, 34));
      const x = cx + (R + 74) * Math.cos(b);
      const y = cy + (R + 74) * Math.sin(b);
      if (keep(x, y, 6)) cuts.push(dot(x, y, 4.5));
    }
  if (s.border)
    for (const [x, y] of along(INSET, round, 42))
      if (gap(x, y) > 12) cuts.push(diamond(x, y, 10, 11));
  if (s.corners)
    for (const [sx, sy] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      // The biggest flower that fits each corner, between the edge and the ring.
      let best: { x: number; y: number; size: number } | null = null;
      for (let c = 50; c < 200; c += 2) {
        const x = sx > 0 ? c : P - c;
        const y = sy > 0 ? c : P - c;
        const room = Math.min(
          depth(x, y, round) - INSET * 0.5 - (s.border ? 30 : 14),
          gap(x, y) - 3,
          s.foot && sy < 0 ? 530 - y : Number.POSITIVE_INFINITY,
        );
        const size = Math.min(36, room);
        if (!best || size > best.size) best = { x, y, size };
      }
      if (best && best.size >= 16) cuts.push(rosette(best.x, best.y, best.size));
    }
  if (s.foot) {
    for (let x = 132; x <= 468; x += 48)
      if (keep(x, 552, 22) && keep(x, 584, 8)) cuts.push(petal(x, 552, 90, 0, 32, 17));
    for (let x = 156; x <= 444; x += 48) if (keep(x, 572, 10)) cuts.push(dot(x, 572, 4));
  }
  const ties = Array.from({ length: s.ties }, (_, i) => {
    const a = ((((i + 0.5) * 360) / s.ties) * Math.PI) / 180;
    return `<path d="M${cx} ${cy}L${r1(cx + (R + 20) * Math.cos(a))} ${r1(cy + (R + 20) * Math.sin(a))}" stroke="#fff" stroke-width="9"/>`;
  }).join('');
  const b = cubeBox(s.detail);
  const k = (2 * R * (s.fit / 100)) / Math.max(b.w, b.h);
  const figure = `<g transform="translate(${r1(cx - (b.x + b.w / 2) * k)} ${r1(cy - (b.y + b.h / 2) * k)}) scale(${k})">${papelCube[s.detail]}</g>`;
  const sheetCuts = `<rect width="${P}" height="${P}" fill="#fff"/><path d="${cuts.join('')}" fill="#000"/><path d="${scalloped(cx, cy, R, 20)}" fill="#000"/>${ties}${figure}`;

  // The sheet is cut in 600 units and laid over the tile.
  const m = s.margin;
  const scale = (N - 2 * m) / P;
  const shape = tilePath(s);
  const [d1, d2] = dyes[s.dye].colours ?? [s.dye1, s.dye2];
  const defs = `<clipPath id="tile"><path d="${shape}"/></clipPath><linearGradient id="dye" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${P}"><stop offset="0" stop-color="${d1}"/><stop offset="1" stop-color="${d2}"/></linearGradient><mask id="cuts" maskUnits="userSpaceOnUse" x="0" y="0" width="${P}" height="${P}"><rect width="${P}" height="${P}" fill="#000"/>${sheetCuts}</mask><filter id="paper" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="5" seed="${s.seed}" result="n"/><feDiffuseLighting in="n" surfaceScale="${s.crumple}" diffuseConstant="1.12" lighting-color="#fff" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="SourceGraphic" in2="l" operator="arithmetic" k1="1.08" k2="0" k3="0" k4="0"/></filter><filter id="paper-lift" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="1.5" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".55"/></filter>`;
  const backing =
    s.backing === 'none'
      ? ''
      : `<path d="${shape}" fill="${s.backing === 'dark' ? '#1B0E05' : s.backingColour}"/>`;
  let sheet = `<g mask="url(#cuts)"><rect x="-20" y="-20" width="${P + 40}" height="${P + 40}" fill="url(#dye)" filter="url(#paper)"/></g>`;
  if (s.lift) sheet = `<g filter="url(#paper-lift)">${sheet}</g>`;
  const out = `${backing}<g clip-path="url(#tile)"><g transform="translate(${m} ${m}) scale(${r1(scale * 10000) / 10000})">${sheet}</g></g>`;
  return { defs, out };
}

/** The icon as one SVG, 1024 square. */
export function compose(s: Settings) {
  const { defs, out } = { plain, aura, sketch, blueprint, ink, papel }[s.style](s);
  let shadow = '';
  let drawn = out;
  if (s.tileShadow && s.margin > 0) {
    // About as far down and as soft as the shadow macOS's own icon template draws.
    shadow = `<filter id="drop" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter>`;
    drawn = `<g filter="url(#drop)">${out}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}"><defs>${defs}${shadow}</defs>${drawn}</svg>`;
}

export const svgUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export async function rasterise(svg: string, n: number) {
  const img = new Image();
  img.src = svgUrl(svg);
  await img.decode();
  // Drawn large first and then halved step by step, so small sizes stay sharp and even.
  let size = Math.max(n, 1024);
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d')?.drawImage(img, 0, 0, size, size);
  while (size > n) {
    size = Math.max(n, Math.floor(size / 2));
    const next = document.createElement('canvas');
    next.width = next.height = size;
    const ctx = next.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, size, size);
    }
    canvas = next;
  }
  return canvas;
}

export const png = (canvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((done, fail) =>
    canvas.toBlob((blob) => {
      if (!blob) return fail(new Error('The browser could not make a PNG.'));
      blob.arrayBuffer().then((buffer) => done(new Uint8Array(buffer)), fail);
    }, 'image/png'),
  );

// A zip with nothing compressed, which is all a set of PNGs needs.
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export function zip(files: { name: string; data: Uint8Array }[]) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const { name, data } of files) {
    const n = encoder.encode(name);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(12, 0x21, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true);
    head.setUint32(22, data.length, true);
    head.setUint16(26, n.length, true);
    parts.push(new Uint8Array(head.buffer), n, data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(14, 0x21, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, n.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), n);
    offset += 30 + n.length + data.length;
  }
  const size = central.reduce((total, part) => total + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
    type: 'application/zip',
  });
}
