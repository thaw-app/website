'use client';

import { useEffect, useRef } from 'react';
import { FULL, RATIO, type SheetDesign } from '@/lib/papel-designs';

// Papel picado, on a string: sheets of papel de china, which weigh nothing and have no spring.
// They hang limp and gathered, the air pushes them around in patches, every bend stays as a
// wrinkle, and pulled too hard they rip. All of this is fetched only when it is about to hang
// (papel-lazy.tsx).

const TICK = 1 / 60;
const FOLD_COLS = new Set([7, 13, 20]);
const FOLD_ROWS = new Set([7, 14]);

const VERTEX = `#version 300 es
in vec3 a; in vec3 n; in vec2 t; uniform vec2 res; uniform vec2 shift; uniform float lean;
out vec2 uv; out vec3 nor; out vec3 world;
void main() {
  float k = 1500. / (1500. - a.z);
  vec2 c = res * .5, q = c + (a.xy - c) * k + shift + vec2(a.z, a.z) * lean;
  gl_Position = vec4(q.x / res.x * 2. - 1., 1. - q.y / res.y * 2., 0., 1.);
  uv = t; nor = n; world = a;
}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv; in vec3 nor; in vec3 world; uniform sampler2D art; uniform float shadow; out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float crumple(vec2 p) { return noise(p) * .55 + abs(noise(p * 2.3 + 7.) - .5) * .7 + abs(noise(p * 5.1 + 3.) - .5) * .4; }
void main() {
  vec4 c = texture(art, uv);
  if (c.a < .01) discard;
  if (shadow > 0.) { o = vec4(0., 0., 0., c.a * shadow); return; }
  // Crumpled paper is flat facets meeting at creases, so the facets show, not a smooth curve.
  vec3 curve = normalize(nor), facet = normalize(cross(dFdx(world), dFdy(world)));
  if (facet.z < 0.) facet = -facet;
  float back = curve.z < 0. ? .86 : 1.; if (curve.z < 0.) curve = -curve;
  vec3 m = normalize(mix(curve, facet, .62));
  vec2 p = uv * vec2(27., 21.), e = vec2(.03, 0.);
  m.xy += vec2(crumple(p + e.xy) - crumple(p - e.xy), crumple(p + e.yx) - crumple(p - e.yx)) * .9;
  m = normalize(m);
  float lit = max(dot(m, normalize(vec3(-.42, -.58, .7))), 0.);
  // Thin enough to see through: where it doubles over, the colour deepens.
  o = vec4(c.rgb * (.6 + .58 * lit) * back, c.a) * .9;
}`;

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  flip: number;
  rate: number;
  size: number;
  life: number;
  colour: string;
}
interface Held {
  flag: Flag;
  r: number;
  c: number;
  x: number;
  y: number;
  z: number;
  strain: number;
  group: { k: number; x: number; y: number; z: number }[];
}
type Flag = ReturnType<typeof makeFlag>;

/** Halfway down a dye, for the scraps that tear off. */
const mix = ([a, b]: [string, string]) =>
  `rgb(${[1, 3, 5].map((i) => (Number.parseInt(a.slice(i, i + 2), 16) + Number.parseInt(b.slice(i, i + 2), 16)) >> 1).join(',')})`;

/** How a grid's points are linked. Every sheet on that grid has the same, so it is worked out once. */
const topologies = new Map<number, ReturnType<typeof buildTopology>>();
function buildTopology({ COLS, ROWS }: typeof FULL) {
  const at = (r: number, c: number) => r * COLS + c;
  const pairs: [number, number, number][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) pairs.push([at(r, c), at(r, c + 1), 0]);
      if (r < ROWS - 1) pairs.push([at(r, c), at(r + 1, c), 0]);
      if (c < COLS - 1 && r < ROWS - 1) {
        pairs.push([at(r, c + 1), at(r + 1, c), 0], [at(r, c), at(r + 1, c + 1), 1]);
      }
      if (c < COLS - 2) pairs.push([at(r, c), at(r, c + 2), 2]);
      if (r < ROWS - 2) pairs.push([at(r, c), at(r + 2, c), 2]);
    }
  }
  // Solved from the string downward, so the weight of the sheet is carried up it.
  pairs.sort((x, y) => Math.min(x[0], x[1]) - Math.min(y[0], y[1]));
  const count = pairs.length;
  const nodes = COLS * ROWS;
  const edges = new Map<number, number>();
  const edgeKey = (a: number, b: number) => Math.min(a, b) * nodes + Math.max(a, b);
  const neighbours: number[][] = Array.from({ length: nodes }, () => []);
  pairs.forEach(([a, b, kind], l) => {
    if (kind !== 0) return;
    edges.set(edgeKey(a, b), l);
    neighbours[a].push(l);
    neighbours[b].push(l);
  });
  const edge = (a: number, b: number) => edges.get(edgeKey(a, b)) ?? 0;
  const triangles: number[][] = [];
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const a = at(r, c);
      const b = at(r, c + 1);
      const d = at(r + 1, c);
      const e = at(r + 1, c + 1);
      triangles.push(
        [a, b, d, edge(a, b), edge(b, d), edge(d, a)],
        [b, e, d, edge(b, e), edge(e, d), edge(d, b)],
      );
    }
  }
  return {
    count,
    triangles,
    neighbours,
    la: Int32Array.from(pairs, (pair) => pair[0] * 3),
    lb: Int32Array.from(pairs, (pair) => pair[1] * 3),
    kind: Uint8Array.from(pairs, (pair) => pair[2]),
  };
}
function topologyOf(grid: typeof FULL) {
  let made = topologies.get(grid.COLS);
  if (!made) {
    made = buildTopology(grid);
    topologies.set(grid.COLS, made);
  }
  return made;
}

// Where the paper is, read once from each picture however many sheets use it.
const coverages = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();
function coverageOf(art: HTMLCanvasElement) {
  let data = coverages.get(art);
  if (!data) {
    data = (art.getContext('2d') as CanvasRenderingContext2D).getImageData(
      0,
      0,
      art.width,
      art.height,
    ).data;
    coverages.set(art, data);
  }
  return data;
}

/** One sheet: its points, and the links between them that can stretch, crease and tear. */
function makeFlag(
  design: SheetDesign,
  art: HTMLCanvasElement,
  x0: number,
  top: number,
  w: number,
  h: number,
  index: number,
  { COLS, ROWS }: typeof FULL,
) {
  const at = (r: number, c: number) => r * COLS + c;
  const nodes = COLS * ROWS;
  const dx = w / (COLS - 1);
  const dy = h / (ROWS - 1);
  const p = new Float32Array(nodes * 3);
  const o = new Float32Array(nodes * 3);
  const uv = new Float32Array(nodes * 2);
  const free = new Float32Array(nodes).fill(1);
  const phase = new Float32Array(nodes);
  const push = new Float32Array(nodes);
  let seed = design.seed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  // Crumpled from being carried: big soft dents and small sharp ones.
  const dents = Array.from({ length: 16 }, () => ({
    u: rand() + 0.5,
    v: rand() + 0.5,
    r: 0.05 + (rand() + 0.5) * 0.16,
    z: rand() * 13,
  }));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = at(r, c);
      const i = k * 3;
      // The grid is uneven, so a rip wanders and never runs along a straight line.
      const jx = c && c < COLS - 1 && r < ROWS - 1 ? rand() * dx * 0.5 : 0;
      const jy = r && r < ROWS - 1 ? rand() * dy * 0.5 : 0;
      const x = (c - (COLS - 1) / 2) * dx + jx;
      const y = r * dy + jy;
      uv[k * 2] = (x + w / 2) / w;
      uv[k * 2 + 1] = y / h;
      let z = (FOLD_COLS.has(c) ? 2.4 : 0) + (FOLD_ROWS.has(r) ? -2 : 0) + rand() * 2.2;
      for (const d of dents)
        z += d.z * Math.exp(-((uv[k * 2] - d.u) ** 2 + (uv[k * 2 + 1] - d.v) ** 2) / (d.r * d.r));
      p[i] = x0 + x;
      p[i + 1] = top + y;
      p[i + 2] = z * Math.min(1, r / 4);
      phase[k] = rand() * 12;
    }
  }
  const coverage = coverageOf(art);
  const paper = (u: number, v: number) => {
    const px = Math.min(art.width - 1, Math.max(0, (u * art.width) | 0));
    const py = Math.min(art.height - 1, Math.max(0, (v * art.height) | 0));
    return coverage[(py * art.width + px) * 4 + 3] / 255;
  };
  const { la, lb, kind, count, triangles, neighbours } = topologyOf({ COLS, ROWS });
  const lr = new Float32Array(count);
  const lf = new Float32Array(count);
  const lk = new Float32Array(count);
  const limit = new Float32Array(count);
  for (let l = 0; l < count; l++) {
    const i = la[l];
    const j = lb[l];
    const rest = Math.hypot(p[i] - p[j], p[i + 1] - p[j + 1], p[i + 2] - p[j + 2]);
    lf[l] = rest;
    // Almost nothing resists bending. Where there is little paper there is little strength.
    if (kind[l] === 2) {
      lr[l] = rest * (1 - (rand() + 0.5) * 0.035);
      lk[l] = 0.022;
      limit[l] = 1.34;
      continue;
    }
    const a = i / 3;
    const b = j / 3;
    let cover = 0;
    for (let t = 0; t <= 4; t++) {
      cover +=
        paper(
          uv[a * 2] + ((uv[b * 2] - uv[a * 2]) * t) / 4,
          uv[a * 2 + 1] + ((uv[b * 2 + 1] - uv[a * 2 + 1]) * t) / 4,
        ) / 5;
    }
    lr[l] = rest;
    lk[l] = 1;
    limit[l] = 1.16 + 0.16 * cover + (rand() + 0.5) * 0.05;
  }
  // Gathered onto the string: the sheet is a little wider than the length it is glued along.
  for (let c = 0; c < COLS; c++) {
    const i = at(0, c) * 3;
    p[i] = x0 + (p[i] - x0) * 0.955;
    p[i + 2] = 0;
    free[at(0, c)] = 0;
  }
  o.set(p);
  return {
    COLS,
    ROWS,
    colour: mix(design.dye),
    index,
    x0,
    w,
    h,
    dx,
    dy,
    p,
    o,
    uv,
    free,
    phase,
    push,
    count,
    la,
    lb,
    kind,
    triangles,
    neighbours,
    lr,
    lf,
    lk,
    limit,
    hurt: new Float32Array(count),
    broken: new Uint8Array(count),
    anchor: new Int32Array(nodes),
    reach: new Float32Array(nodes),
    mesh: new Float32Array(nodes * 6),
    dirty: true,
    indexCount: 0,
    vao: null as WebGLVertexArrayObject | null,
    buffer: null as WebGLBuffer | null,
    texture: null as WebGLTexture | null,
  };
}

// Which part of the string each point still hangs from, along what is left of the paper.
// Whatever nothing leads back to has come away, and is free to fall.
function tether(flag: Flag) {
  const { anchor, reach, neighbours, broken, la, lb, lf, COLS } = flag;
  anchor.fill(-1);
  reach.fill(Number.POSITIVE_INFINITY);
  let front: number[] = [];
  for (let c = 0; c < COLS; c++) {
    anchor[c] = c;
    reach[c] = 0;
    front.push(c);
  }
  while (front.length) {
    const after: number[] = [];
    for (const k of front) {
      for (const l of neighbours[k]) {
        if (broken[l]) continue;
        const other = la[l] / 3 === k ? lb[l] / 3 : la[l] / 3;
        const d = reach[k] + lf[l];
        if (d < reach[other]) {
          reach[other] = d;
          anchor[other] = anchor[k];
          after.push(other);
        }
      }
    }
    front = after;
  }
}

export interface HangOptions {
  sag: number;
  below: number;
  grid?: typeof FULL;
  ratio?: number;
  /** The sheet's height, where the box does not decide it. */
  sheet?: number;
  /** Tied up every so many flags, from the left edge, and falling between the ties. */
  tile?: number;
}

function hang(
  root: HTMLElement,
  sheets: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  shown: { design: SheetDesign; art: HTMLCanvasElement }[],
  { sag: sagMost, below, grid = FULL, ratio = RATIO, sheet, tile }: HangOptions,
  onReady: () => void,
) {
  const gl = sheets.getContext('webgl2', {
    premultipliedAlpha: true,
    alpha: true,
    antialias: true,
  });
  const ink = overlay.getContext('2d');
  if (!gl || !ink) return null;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const box = root.getBoundingClientRect();
  const width = box.width;
  const height = box.height + below;
  const scale = Math.min(devicePixelRatio || 1, 2);
  for (const c of [sheets, overlay]) {
    c.width = width * scale;
    c.height = height * scale;
    c.style.height = `${height}px`;
  }
  const { COLS, ROWS } = grid;
  const at = (r: number, c: number) => r * COLS + c;
  const hangFrom = tile ? 3 : 6;
  const sag = tile ? sagMost : Math.min(sagMost, width * 0.03);
  const h = sheet ?? box.height - hangFrom - sag - 2;
  const w = h * ratio;
  const pitch = w * (tile ? 1.05 : 1.015);
  const ROPE = Math.max(48, Math.round(width / 16));
  const span = tile ? tile * pitch : width;
  // A tied string falls and rises either side of a swag in the middle of the window.
  const firstTie = tile ? (width - span) / 2 : 0;
  const restY = (x: number) => {
    const along = (((x - firstTie) % span) + span) % span;
    return hangFrom + sag * (1 - ((along / span) * 2 - 1) ** 2);
  };
  // Where a tied string cannot move from, so a wave stops at a tie.
  const ties: number[] = [];
  if (tile) {
    for (let x = firstTie % span; x <= width; x += span) ties.push(Math.round((x / width) * ROPE));
  }
  // A small sheet is pushed around in proportion.
  const force = w / 230;
  const rope = new Float32Array(ROPE + 1);
  const ropeSpeed = new Float32Array(ROPE + 1);
  const ropeAt = (x: number) => {
    const place = Math.max(0, Math.min(ROPE, (x / width) * ROPE));
    const i = Math.min(ROPE - 1, place | 0);
    const t = place - i;
    return restY(x) + rope[i] * (1 - t) + rope[i + 1] * t;
  };
  const flags = shown.map(({ design, art }, i) => {
    const x0 = width / 2 + (i - (shown.length - 1) / 2) * pitch;
    return makeFlag(design, art, x0, restY(x0), w, h, i, grid);
  });

  let held: Held | null = null;
  // How strong the air is just now, from 0 to 1. It only blows in gusts, and between them the
  // sheets hang still and nothing runs at all, which is what spares a battery.
  let breeze = 0;
  let gustFrom = 0;
  let gustUntil = 0;
  let gustTimer = 0;
  // A machine that can't keep up loses the breeze, and still answers a finger.
  let slow = false;
  let frames = 0;
  let pace = 0;
  const pointer = { x: 0, y: 0, downX: 0, downY: 0, downAt: 0, moved: false };
  let bits: Bit[] = [];
  let lastBits = 0;

  function tear(flag: Flag, l: number, x: number, y: number) {
    flag.broken[l] = 1;
    flag.dirty = true;
    const now = performance.now();
    if (!still.matches && now - lastBits > 110) {
      lastBits = now;
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * 6.28;
        bits.push({
          x,
          y,
          vx: Math.cos(a) * 60,
          vy: -20 - Math.random() * 40,
          r: a,
          vr: (Math.random() - 0.5) * 8,
          flip: a,
          rate: 4 + Math.random() * 6,
          size: 2 + Math.random() * 3,
          life: 1,
          colour: flag.colour,
        });
      }
    }
  }
  function stepFlag(flag: Flag, time: number) {
    const {
      p,
      o,
      free,
      phase,
      push,
      la,
      lb,
      lr,
      lf,
      lk,
      kind,
      limit,
      hurt,
      broken,
      count,
      anchor,
      reach,
      index,
    } = flag;
    const reduced = still.matches;
    // So light that the air stops it almost at once, and it comes down slowly.
    const dragXY = 1 - (reduced ? 16 : 7) * TICK;
    const dragZ = 1 - (reduced ? 22 : 13) * TICK;
    const gravity = 430 * TICK * TICK;
    // The air arrives in patches and lets go again. No wave ever runs through the whole sheet.
    const burst =
      reduced || !breeze
        ? 0
        : breeze *
          Math.max(0, Math.sin(time * 0.61 + index * 2.4) + 0.5 * Math.sin(time * 1.37 + index)) **
            2;
    const leanU = 0.5 + 0.5 * Math.sin(time * 0.29 + index * 1.3);
    for (let r = 0, i = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++, i += 3) {
        const k = i / 3;
        if (!free[k]) {
          o[i] = p[i];
          o[i + 1] = p[i + 1];
          o[i + 2] = p[i + 2];
          continue;
        }
        const s = r / (ROWS - 1);
        const u = c / (COLS - 1);
        let air = 0;
        let side = 0;
        if (!reduced) {
          const patch = Math.exp(-(((u - leanU) / 0.34) ** 2)) * s * s;
          air =
            burst *
            (420 * patch * Math.sin(time * 1.9 + index) +
              1500 * s * Math.sin(time * 9.7 + u * 21 + s * 17 + phase[k] * 0.4) +
              900 * s * Math.sin(time * 15.3 - u * 37 + s * 29 + phase[k]));
          side = burst * 170 * s * Math.sin(time * 5.1 + s * 9 + phase[k] * 0.3);
        }
        const vx = (p[i] - o[i]) * dragXY + side * TICK * TICK;
        const vy = (p[i + 1] - o[i + 1]) * dragXY;
        const vz = (p[i + 2] - o[i + 2]) * dragZ + (air * force + push[k]) * TICK * TICK;
        push[k] = 0;
        o[i] = p[i];
        o[i + 1] = p[i + 1];
        o[i + 2] = p[i + 2];
        p[i] += vx;
        p[i + 1] += vy + gravity;
        p[i + 2] += vz;
      }
    }
    for (let c = 0; c < COLS; c++) p[at(0, c) * 3 + 1] = ropeAt(p[at(0, c) * 3]);
    const mine = held && held.flag === flag ? held : null;
    if (mine) {
      // A finger moves faster than paper can follow, so it is carried along over a few moments.
      mine.x += (pointer.x - mine.x) * 0.22;
      mine.y += (pointer.y - mine.y) * 0.22;
      mine.z = Math.min(34, mine.z + 1.5);
      for (const m of mine.group) {
        p[m.k * 3] = mine.x + m.x;
        p[m.k * 3 + 1] = mine.y + m.y;
        p[m.k * 3 + 2] = mine.z + m.z;
        free[m.k] = 0;
      }
      let over = 0;
      for (let j = 0; j < COLS; j += 2)
        over = Math.max(
          over,
          Math.hypot(mine.x - p[at(0, j) * 3], mine.y - p[at(0, j) * 3 + 1]) -
            Math.hypot((mine.c - j) * flag.dx, mine.r * flag.dy) * 1.02,
        );
      mine.strain = Math.max(0, Math.min(over, mine.y - p[at(0, mine.c) * 3 + 1]));
    }
    for (let pass = 0; pass < 4; pass++) {
      const judge = pass === 3;
      for (let l = 0; l < count; l++) {
        if (broken[l]) continue;
        const a = la[l];
        const b = lb[l];
        const wa = free[a / 3];
        const wb = free[b / 3];
        const sum = wa + wb;
        if (!sum && !judge) continue;
        const x = p[b] - p[a];
        const y = p[b + 1] - p[a + 1];
        const z = p[b + 2] - p[a + 2];
        const d = Math.sqrt(x * x + y * y + z * z) || 1e-4;
        const rest = lr[l];
        if (judge) {
          // No spring back: a wrinkle stays where it was made.
          if (kind[l] === 2 && d < rest * 0.985 && rest > lf[l] * 0.62)
            lr[l] = rest - (rest * 0.985 - d) * 0.3;
          const over = d / lf[l] - limit[l];
          if (mine && over > 0) {
            hurt[l] += over;
            if (hurt[l] > 0.1) {
              tear(flag, l, p[a], p[a + 1]);
              continue;
            }
          } else hurt[l] *= 0.985;
          if (!sum) continue;
        }
        // Tissue gives way in compression: only stretched links pull back with any force.
        const k = kind[l] === 2 ? lk[l] : d < rest ? lk[l] * 0.25 : lk[l];
        const f = ((d - rest) / d / sum) * k;
        p[a] += x * f * wa;
        p[a + 1] += y * f * wa;
        p[a + 2] += z * f * wa;
        p[b] -= x * f * wb;
        p[b + 1] -= y * f * wb;
        p[b + 2] -= z * f * wb;
      }
    }
    // However weak the sheet, it cannot be longer than it is. A finger can force that, which
    // is what tears it.
    if (flag.dirty) tether(flag);
    const slack = mine ? 1.07 : 1.01;
    for (let k = COLS; k < COLS * ROWS; k++) {
      if (!free[k] || anchor[k] < 0) continue;
      const i = k * 3;
      const a = anchor[k] * 3;
      const x = p[i] - p[a];
      const y = p[i + 1] - p[a + 1];
      const z = p[i + 2] - p[a + 2];
      const most = reach[k] * slack;
      const d2 = x * x + y * y + z * z;
      if (d2 > most * most) {
        const f = most / Math.sqrt(d2);
        p[i] = p[a] + x * f;
        p[i + 1] = p[a + 1] + y * f;
        p[i + 2] = p[a + 2] + z * f;
      }
    }
  }
  function step(time: number) {
    const now = performance.now();
    breeze = Math.max(0, Math.min(1, (now - gustFrom) / 900, (gustUntil - now) / 1400));
    for (const flag of flags) stepFlag(flag, time);
    // The string.
    for (let n = 0; n < 2; n++) {
      const s = TICK / 2;
      for (let i = 1; i < ROPE; i++)
        ropeSpeed[i] +=
          s *
          (2400 * (rope[i - 1] + rope[i + 1] - 2 * rope[i]) -
            (still.matches ? 12 : 5) * ropeSpeed[i]);
      if (held)
        ropeSpeed[Math.max(1, Math.min(ROPE - 1, Math.round((held.flag.x0 / width) * ROPE)))] +=
          s * 420 * Math.min(30, held.strain);
      for (let i = 1; i < ROPE; i++)
        rope[i] = Math.max(-14, Math.min(26, rope[i] + s * ropeSpeed[i]));
      for (const i of ties) {
        if (i > 0 && i < ROPE) {
          rope[i] = 0;
          ropeSpeed[i] = 0;
        }
      }
    }
  }

  // Drawing.
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram();
  const vs = shader(gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!program || !vs || !fs) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's own call, not a React hook
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const u = (name: string) => gl.getUniformLocation(program, name);
  const A = gl.getAttribLocation(program, 'a');
  const N = gl.getAttribLocation(program, 'n');
  const T = gl.getAttribLocation(program, 't');
  const buffers: (WebGLBuffer | null)[] = [];
  const buffer = () => {
    const made = gl.createBuffer();
    buffers.push(made);
    return made;
  };
  flags.forEach((flag, i) => {
    flag.vao = gl.createVertexArray();
    gl.bindVertexArray(flag.vao);
    flag.buffer = buffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, flag.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flag.mesh, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(A);
    gl.vertexAttribPointer(A, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(N);
    gl.vertexAttribPointer(N, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer());
    gl.bufferData(gl.ARRAY_BUFFER, flag.uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(T);
    gl.vertexAttribPointer(T, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer());
    flag.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, flag.texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, shown[i].art);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  });
  gl.bindVertexArray(null);

  function refresh(flag: Flag) {
    if (!gl) return;
    const { p, mesh } = flag;
    gl.bindVertexArray(flag.vao);
    if (flag.dirty) {
      // What has torn is no longer there to draw.
      const kept: number[] = [];
      for (const [a, b, c, e1, e2, e3] of flag.triangles)
        if (!flag.broken[e1] && !flag.broken[e2] && !flag.broken[e3]) kept.push(a, b, c);
      flag.indexCount = kept.length;
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(kept), gl.DYNAMIC_DRAW);
      flag.dirty = false;
    }
    for (let r = 0, k = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++, k++) {
        const l = at(r, Math.max(0, c - 1)) * 3;
        const e = at(r, Math.min(COLS - 1, c + 1)) * 3;
        const n = at(Math.max(0, r - 1), c) * 3;
        const d = at(Math.min(ROWS - 1, r + 1), c) * 3;
        const ax = p[e] - p[l];
        const ay = p[e + 1] - p[l + 1];
        const az = p[e + 2] - p[l + 2];
        const bx = p[d] - p[n];
        const by = p[d + 1] - p[n + 1];
        const bz = p[d + 2] - p[n + 2];
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const len = Math.hypot(nx, ny, nz) || 1;
        const m = k * 6;
        mesh[m] = p[k * 3];
        mesh[m + 1] = p[k * 3 + 1];
        mesh[m + 2] = p[k * 3 + 2];
        mesh[m + 3] = nx / len;
        mesh[m + 4] = ny / len;
        mesh[m + 5] = nz / len;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, flag.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh);
  }
  const drawAll = (order: Flag[]) => {
    if (!gl) return;
    for (const flag of order) {
      gl.bindVertexArray(flag.vao);
      gl.bindTexture(gl.TEXTURE_2D, flag.texture);
      gl.drawElements(gl.TRIANGLES, flag.indexCount, gl.UNSIGNED_SHORT, 0);
    }
  };
  function draw() {
    if (!gl || !ink) return;
    flags.forEach(refresh);
    gl.viewport(0, 0, sheets.width, sheets.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u('res'), width, height);
    // What is being held comes in front of its neighbours.
    const order = [...flags].sort((a, b) => Number(a === held?.flag) - Number(b === held?.flag));
    if (!document.documentElement.classList.contains('dark')) {
      // On the wall behind: further from it, a shadow falls further away.
      gl.uniform1f(u('shadow'), 0.07);
      gl.uniform2f(u('shift'), 4, 7);
      gl.uniform1f(u('lean'), 0.28);
      drawAll(order);
    }
    gl.uniform1f(u('shadow'), 0);
    gl.uniform2f(u('shift'), 0, 0);
    gl.uniform1f(u('lean'), 0);
    drawAll(order);
    gl.bindVertexArray(null);

    ink.setTransform(scale, 0, 0, scale, 0, 0);
    ink.clearRect(0, 0, width, height);
    ink.strokeStyle = getComputedStyle(root).color;
    ink.globalAlpha = 0.55;
    ink.lineWidth = 1.25;
    ink.beginPath();
    for (let i = 0; i <= ROPE; i++) {
      const x = (i / ROPE) * width;
      if (i) ink.lineTo(x, ropeAt(x));
      else ink.moveTo(x, ropeAt(x));
    }
    ink.stroke();
    for (const b of bits) {
      ink.save();
      ink.translate(b.x, b.y);
      ink.rotate(b.r);
      ink.scale(1, Math.max(0.15, Math.abs(Math.cos(b.flip))));
      ink.globalAlpha = Math.min(1, b.life * 2.5);
      ink.fillStyle = b.colour;
      ink.beginPath();
      ink.moveTo(0, -b.size);
      ink.lineTo(b.size * 0.7, 0);
      ink.lineTo(0, b.size);
      ink.lineTo(-b.size * 0.7, 0);
      ink.fill();
      ink.restore();
    }
    ink.globalAlpha = 1;
  }

  let frameId = 0;
  let last = 0;
  let clock = 0;
  let spare = 0;
  let awakeUntil = 0;
  let onScreen = true;
  let running = false;
  const frame = (now: number) => {
    const dtReal = now - last;
    const dt = Math.min(0.05, dtReal / 1000 || 0);
    last = now;
    clock += dt;
    spare += dt;
    let steps = 0;
    while (spare >= TICK && steps < 2) {
      step(clock);
      spare -= TICK;
      steps++;
    }
    if (spare > TICK) spare = 0;
    for (const b of bits) {
      // Paper falls slowly and never in a straight line.
      b.vy += 150 * dt;
      b.vx *= 1 - 2.2 * dt;
      b.vy *= 1 - 3.6 * dt;
      b.flip += b.rate * dt;
      b.x += (b.vx + Math.sin(b.flip * 0.5) * 34) * dt;
      b.y += b.vy * (0.7 + 0.3 * Math.cos(b.flip)) * dt;
      b.r += b.vr * dt;
      b.life -= dt * 0.3;
    }
    bits = bits.filter((b) => b.life > 0 && b.y < height);
    draw();
    if (now < gustUntil && !slow) {
      frames++;
      const gap = dtReal;
      if (gap < 200) pace = pace ? pace * 0.95 + gap * 0.05 : gap;
      if (frames > 90 && pace > 30) {
        slow = true;
        gustUntil = 0;
      }
    }
    // Between gusts, and with motion reduced, nothing runs until something asks it to.
    if (
      onScreen &&
      !document.hidden &&
      (held || now < awakeUntil || now < gustUntil || bits.length)
    )
      frameId = requestAnimationFrame(frame);
    else sleep();
  };
  const sleep = () => {
    running = false;
    clearTimeout(gustTimer);
    if (!still.matches && !slow && onScreen && !document.hidden) {
      gustTimer = window.setTimeout(gust, 6000 + Math.random() * 9000);
    }
  };
  const gust = () => {
    if (still.matches || slow) return;
    gustFrom = performance.now();
    gustUntil = gustFrom + 5000 + Math.random() * 3000;
    awakeUntil = gustUntil + 2500;
    wake();
  };
  let ready = false;
  const wake = () => {
    if (!ready) return;
    // Long enough for the paper to come to rest, which it does quickly.
    awakeUntil = Math.max(awakeUntil, performance.now() + 2500);
    clearTimeout(gustTimer);
    if (running || !onScreen || document.hidden) return;
    running = true;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  };

  const place = (e: PointerEvent) => {
    const b = root.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  const flagAt = (x: number, y: number) =>
    flags.find(
      (f) => Math.abs(x - f.x0) < f.w / 2 + 4 && y > ropeAt(f.x0) - 4 && y < ropeAt(f.x0) + f.h + 6,
    );
  const move = (e: PointerEvent) => {
    const [x, y] = place(e);
    const mx = x - pointer.x;
    const my = y - pointer.y;
    const crossed = (ropeAt(x) - y) * (ropeAt(pointer.x) - pointer.y) <= 0;
    pointer.x = x;
    pointer.y = y;
    if (Math.hypot(x - pointer.downX, y - pointer.downY) > 8) pointer.moved = true;
    const flag = flagAt(x, y);
    root.style.cursor = held ? 'grabbing' : flag ? 'grab' : '';
    if (!held) {
      // Brushing past: nothing slides. The paper dents away from the finger and lifts behind it.
      const speed = Math.min(40, Math.hypot(mx, my));
      if (flag && speed > 0.5) {
        const { p, push, w: fw } = flag;
        for (let k = COLS; k < COLS * ROWS; k++) {
          const px = p[k * 3];
          const py = p[k * 3 + 1];
          const along = ((px - x) * mx + (py - y) * my) / speed;
          push[k] +=
            force *
            speed *
            2600 *
            Math.exp(-((px - x) ** 2 + (py - y) ** 2) / (fw * fw * 0.03)) *
            (along > 0 ? -1 : 0.7);
        }
      }
      if (crossed && Math.abs(my) > 0.5) {
        const i = Math.round((x / width) * ROPE);
        for (let k = -2; k <= 2; k++)
          if (i + k > 0 && i + k < ROPE)
            ropeSpeed[i + k] += Math.max(-46, Math.min(46, my * 7)) * (1 - Math.abs(k) / 3);
      }
    }
    wake();
  };
  const grab = (flag: Flag, x: number, y: number, pointerId: number) => {
    const { p } = flag;
    let near = { k: COLS, r: 1, c: 0 };
    let best = Number.POSITIVE_INFINITY;
    for (let r = 1; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = (p[at(r, c) * 3] - x) ** 2 + (p[at(r, c) * 3 + 1] - y) ** 2;
        if (d < best) {
          best = d;
          near = { k: at(r, c), r, c };
        }
      }
    }
    const group: Held['group'] = [];
    for (let r = Math.max(1, near.r - 1); r <= Math.min(ROWS - 1, near.r + 1); r++) {
      for (let c = Math.max(0, near.c - 1); c <= Math.min(COLS - 1, near.c + 1); c++) {
        const k = at(r, c);
        group.push({
          k,
          x: p[k * 3] - p[near.k * 3],
          y: p[k * 3 + 1] - p[near.k * 3 + 1],
          z: p[k * 3 + 2] - p[near.k * 3 + 2],
        });
      }
    }
    held = { flag, r: near.r, c: near.c, x, y, z: p[near.k * 3 + 2], strain: 0, group };
    root.setPointerCapture(pointerId);
    wake();
  };
  // A swipe has to go on scrolling the page, so a finger takes hold of the paper only once it has
  // rested on it for a moment. A mouse has nothing to scroll, and takes hold at once.
  let touched: Flag | undefined;
  let holdTimer = 0;
  const down = (e: PointerEvent) => {
    const [x, y] = place(e);
    pointer.x = pointer.downX = x;
    pointer.y = pointer.downY = y;
    pointer.downAt = performance.now();
    pointer.moved = false;
    touched = flagAt(x, y);
    if (touched && e.pointerType === 'touch') {
      const flag = touched;
      holdTimer = window.setTimeout(() => {
        if (pointer.moved) return;
        navigator.vibrate?.(8);
        grab(flag, pointer.x, pointer.y, e.pointerId);
      }, 220);
    } else if (touched) grab(touched, x, y, e.pointerId);
    wake();
  };
  const up = (e: PointerEvent) => {
    clearTimeout(holdTimer);
    if (held) for (const m of held.group) held.flag.free[m.k] = 1;
    held = null;
    // A flick of the finger: the spot it touched gives way, and hardly anything else notices.
    if (
      touched &&
      e.type === 'pointerup' &&
      !pointer.moved &&
      performance.now() - pointer.downAt < 320
    ) {
      const { p, push, w: fw } = touched;
      const strength = still.matches ? 0.5 : 1;
      for (let k = COLS; k < COLS * ROWS; k++) {
        const near = Math.exp(
          -((Math.hypot(p[k * 3] - pointer.x, p[k * 3 + 1] - pointer.y) / (fw * 0.16)) ** 2),
        );
        push[k] -= force * strength * 26000 * near;
      }
    }
    touched = undefined;
    wake();
  };
  // Holding the paper, a finger pulls it and the page stays where it is.
  const noScroll = (e: TouchEvent) => {
    if (held) e.preventDefault();
  };
  const noMenu = (e: Event) => {
    if (touched) e.preventDefault();
  };
  root.addEventListener('pointermove', move);
  root.addEventListener('pointerdown', down);
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
  root.addEventListener('touchmove', noScroll, { passive: false });
  root.addEventListener('contextmenu', noMenu);
  const seen = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) wake();
  });
  seen.observe(root);
  document.addEventListener('visibilitychange', wake);
  still.addEventListener('change', wake);

  // Let it hang under its own weight before anyone sees it, a little at a time, so the page goes
  // on answering meanwhile.
  let settled = 0;
  let settleTimer = 0;
  const settle = () => {
    const from = performance.now();
    while (settled < 150 && performance.now() - from < 6) step(settled++ * TICK);
    if (settled < 150) {
      settleTimer = window.setTimeout(settle, 0);
      return;
    }
    ready = true;
    draw();
    sheets.style.opacity = '1';
    overlay.style.opacity = '1';
    onReady();
    wake();
    gust();
  };
  settle();
  return () => {
    cancelAnimationFrame(frameId);
    clearTimeout(settleTimer);
    clearTimeout(gustTimer);
    clearTimeout(holdTimer);
    onScreen = false; // Nothing may start it again.
    seen.disconnect();
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('pointerup', up);
    root.removeEventListener('pointercancel', up);
    root.removeEventListener('touchmove', noScroll);
    root.removeEventListener('contextmenu', noMenu);
    document.removeEventListener('visibilitychange', wake);
    still.removeEventListener('change', wake);
    // Hanging again, and leaving the page, each give back what the graphics card was holding.
    for (const flag of flags) {
      gl.deleteTexture(flag.texture);
      gl.deleteVertexArray(flag.vao);
    }
    for (const made of buffers) gl.deleteBuffer(made);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
}

/**
 * A string of paper: draws each sheet at the size it will hang at, dyes it, and hangs them, and
 * again whenever the room it has changes width. `onFail` says it could not hang, where WebGL is
 * missing or the art would not load, and the page is complete without it.
 */
export function Paper({
  designs,
  options,
  onFail,
  onReady,
  onLost,
}: {
  designs: (width: number, pitch: number) => SheetDesign[];
  options: HangOptions;
  onFail?: () => void;
  onReady?: () => void;
  onLost?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetsRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  // Fixed for the life of the page, so it is only ever read once.
  const settings = useRef({ designs, options, onFail, onReady, onLost });

  useEffect(() => {
    const root = rootRef.current;
    const sheets = sheetsRef.current;
    const overlay = overlayRef.current;
    if (!root || !sheets || !overlay) return;
    const {
      designs: choose,
      options: chosen,
      onFail: fail,
      onReady: ready,
      onLost: gave,
    } = settings.current;
    let undo = () => {};
    let latest = 0;

    const raster = (design: SheetDesign, sheetHeight: number, width: number) =>
      new Promise<HTMLCanvasElement>((done, failed) => {
        const image = new Image();
        image.onload = () => {
          const art = document.createElement('canvas');
          art.height = Math.ceil(sheetHeight);
          art.width = Math.ceil(width);
          const paint = art.getContext('2d', { willReadFrequently: true });
          if (!paint) {
            failed(new Error('no canvas'));
            return;
          }
          paint.drawImage(image, 0, 0, art.width, art.height);
          // Dyed down its length, as a sheet dipped in the colour is.
          paint.globalCompositeOperation = 'source-in';
          const dye = paint.createLinearGradient(0, 0, 0, art.height);
          dye.addColorStop(0, design.dye[0]);
          dye.addColorStop(1, design.dye[1]);
          paint.fillStyle = dye;
          paint.fillRect(0, 0, art.width, art.height);
          done(art);
        };
        image.onerror = failed;
        image.src = design.source;
      });

    const hangAll = async () => {
      const turn = ++latest;
      const box = root.getBoundingClientRect();
      const scale = Math.min(devicePixelRatio || 1, 2);
      const ratio = chosen.ratio ?? RATIO;
      // The same sum as in hang(): the box, less the string and the room above and below it.
      let sheetHeight = chosen.sheet ?? box.height - 8 - Math.min(chosen.sag, box.width * 0.03);
      // A tied string fills the window exactly, with a flag in the middle and none cut at the
      // edges: as many as fit at this size, an odd number, a little smaller if need be.
      if (chosen.tile) {
        const across = Math.ceil(box.width / (sheetHeight * ratio * 1.05));
        sheetHeight = box.width / (across % 2 ? across : across + 1) / 1.05 / ratio;
      }
      const list = choose(box.width, sheetHeight * ratio * (chosen.tile ? 1.05 : 1.015));
      // A long string repeats itself: each sheet is only fetched and dyed once.
      const arts = new Map<string, Promise<HTMLCanvasElement>>();
      const keyOf = (design: SheetDesign) => `${design.source} ${design.dye}`;
      for (const design of list) {
        if (!arts.has(keyOf(design))) {
          arts.set(keyOf(design), raster(design, sheetHeight * scale, sheetHeight * scale * ratio));
        }
      }
      try {
        const shown = await Promise.all(
          list.map(async (design) => ({
            design,
            art: await (arts.get(keyOf(design)) as Promise<HTMLCanvasElement>),
          })),
        );
        if (turn !== latest) return;
        undo();
        undo = () => {};
        const hung = hang(
          root,
          sheets,
          overlay,
          shown,
          { ...chosen, sheet: chosen.tile ? sheetHeight : chosen.sheet },
          () => ready?.(),
        );
        if (hung) undo = hung;
        else fail?.();
      } catch {
        if (turn === latest) fail?.();
      }
    };
    // Not before the page has done its own first work.
    let gone = false;
    const begin = () => {
      if (!gone) hangAll();
    };
    // Safari has no idle callback.
    const idle = window.requestIdleCallback?.(begin, { timeout: 1500 });
    const fallback = idle === undefined ? window.setTimeout(begin, 300) : 0;

    // The width only: a phone's address bar coming and going changes the height of the window.
    let width = root.getBoundingClientRect().width;
    let waiting = 0;
    const resized = new ResizeObserver(() => {
      const now = root.getBoundingClientRect().width;
      if (Math.abs(now - width) < 1) return;
      width = now;
      clearTimeout(waiting);
      waiting = window.setTimeout(hangAll, 150);
    });
    resized.observe(root);

    // A phone can take the graphics away from a page in the background, and give them back later.
    const lost = (e: Event) => {
      e.preventDefault();
      latest++;
      undo();
      undo = () => {};
      gave?.();
    };
    const restored = () => hangAll();
    sheets.addEventListener('webglcontextlost', lost);
    sheets.addEventListener('webglcontextrestored', restored);

    return () => {
      gone = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(fallback);
      latest++;
      clearTimeout(waiting);
      resized.disconnect();
      sheets.removeEventListener('webglcontextlost', lost);
      sheets.removeEventListener('webglcontextrestored', restored);
      undo();
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 touch-pan-y select-none text-fd-foreground">
      {/* Taller than the box, for what tears off to fall through, and never in the way. */}
      <canvas
        ref={sheetsRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full opacity-0 transition-opacity duration-300 motion-reduce:transition-none"
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full opacity-0 transition-opacity duration-300 motion-reduce:transition-none"
      />
    </div>
  );
}
