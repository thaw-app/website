'use client';

import { MeshGradient } from '@paper-design/shaders-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';

// Lightest to darkest, the classic ramp for pictures in type.
const ramp = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
/** A cell is twice as tall as it is wide, as a character is. */
const cellShape = 2;
/** Frames a second. Type that changes too smoothly stops looking like type. */
const rate = 16;
/** How far across an h the middle of its upright is. The SVG knows the letter's box, not its shape. */
const stemOfH = 0.2;

// The words' own picture: a box this wide and tall, the line they sit on this far down it,
// the size and weight of the type, and how far above the line its capitals stand as a
// share of that size. The conure's perches are worked out from the same numbers.
const box = { width: 1000, height: 200 };
const baseline = 162;
const type = { size: 168, weight: 600, capHeight: 0.72 };
const wordStyle = {
  fontSize: type.size,
  fontWeight: type.weight,
  letterSpacing: '0.01em',
  wordSpacing: '0.12em',
};

// Where the opening in the ampersand's lower bowl is, per typeface: it depends on the
// letter's shape and not on the window, so it is found once and kept.
const bowls = new Map<string, { across: number; floor: number } | null>();

/**
 * The middle of the floor of the ampersand's lower bowl, in the words' own units from the
 * letter's left edge and the top of the box. The glyph is drawn on its own and read a
 * pixel at a time, since nothing else says where a letter's ink is. Everything not ink is
 * flooded from the edges of the picture; what the flood cannot reach is enclosed by the
 * letter, and the largest such space is the lower bowl's.
 */
function bowlOf(fontFamily: string, signWidth: number) {
  const key = `${fontFamily} ${Math.ceil(signWidth)}`;
  const known = bowls.get(key);
  if (known !== undefined) return known;
  const margin = 20;
  const probe = document.createElement('canvas');
  probe.width = Math.ceil(signWidth) + margin * 2;
  probe.height = box.height;
  const ink = probe.getContext('2d', { willReadFrequently: true });
  if (!ink) return null;
  ink.font = `${type.weight} ${type.size}px ${fontFamily}`;
  ink.fillText('&', margin, baseline);
  const { width: wide, height: tall } = probe;
  const pixels = ink.getImageData(0, 0, wide, tall).data;
  const inked = (index: number) => pixels[index * 4 + 3] > 128;
  const seen = new Uint8Array(wide * tall);
  const flood = (from: number) => {
    const reached = [from];
    seen[from] = 1;
    for (let next = 0; next < reached.length; next++) {
      const here = reached[next];
      const x = here % wide;
      for (const to of [
        here - wide,
        here + wide,
        x > 0 ? here - 1 : -1,
        x < wide - 1 ? here + 1 : -1,
      ]) {
        if (to < 0 || to >= wide * tall || seen[to] || inked(to)) continue;
        seen[to] = 1;
        reached.push(to);
      }
    }
    return reached;
  };
  for (let x = 0; x < wide; x++) {
    for (const edge of [x, (tall - 1) * wide + x]) if (!seen[edge] && !inked(edge)) flood(edge);
  }
  for (let y = 0; y < tall; y++) {
    for (const edge of [y * wide, y * wide + wide - 1])
      if (!seen[edge] && !inked(edge)) flood(edge);
  }
  let bowl: number[] = [];
  for (let index = 0; index < wide * tall; index++) {
    if (seen[index] || inked(index)) continue;
    const space = flood(index);
    if (space.length > bowl.length) bowl = space;
  }
  let found: { across: number; floor: number } | null = null;
  if (bowl.length > 0) {
    const xs = bowl.map((index) => index % wide);
    const middle = (Math.min(...xs) + Math.max(...xs)) / 2;
    // The floor under the middle of the opening, not its lowest point anywhere.
    const floor = Math.max(
      ...bowl
        .filter((index) => Math.abs((index % wide) - middle) < 2)
        .map((index) => Math.floor(index / wide)),
    );
    found = { across: middle - margin, floor: floor + 1 };
  }
  bowls.set(key, found);
  return found;
}

/**
 * The names as type, with what the conure has eaten cut out of them. Drawn twice, once
 * whole and once as the ampersand alone, and the two only line up while they are the same.
 */
function Words({ children }: { children: ReactNode }) {
  return (
    <text
      mask="url(#footer-bites)"
      x={box.width / 2}
      y={baseline}
      textAnchor="middle"
      className="font-display"
      style={wordStyle}
    >
      {children}
    </text>
  );
}

// Soft lights that wander slowly round their own spots. Where several overlap the type
// is dense; between them it thins. Positions are fractions of the band; the lights keep
// to the middle of it, behind the words, and roam sideways.
const lights = [
  { x: 0.12, y: 0.58, rx: 0.1, ry: 0.16, phase: 0.0, speed: 0.21, spread: 0.13, weight: 0.42 },
  { x: 0.29, y: 0.66, rx: 0.14, ry: 0.12, phase: 1.7, speed: 0.17, spread: 0.16, weight: 0.48 },
  { x: 0.45, y: 0.55, rx: 0.17, ry: 0.18, phase: 3.1, speed: 0.13, spread: 0.15, weight: 0.45 },
  { x: 0.58, y: 0.68, rx: 0.17, ry: 0.12, phase: 4.4, speed: 0.15, spread: 0.16, weight: 0.48 },
  { x: 0.76, y: 0.57, rx: 0.13, ry: 0.16, phase: 5.6, speed: 0.19, spread: 0.15, weight: 0.42 },
  { x: 0.91, y: 0.7, rx: 0.08, ry: 0.1, phase: 2.3, speed: 0.19, spread: 0.12, weight: 0.36 },
];

// The colour under the type: Thaw's oranges and Floe's blues, blended by a mesh gradient
// that keeps moving, so no line ever divides the two.
const colours = ['#1560e8', '#6aa5ff', '#0b3aa8', '#f08a2c', '#ffd27a', '#c2560f'];

/**
 * "thaw & floe" at the foot of the page. A field of characters drifts across
 * the band, lit from behind by a gradient of Thaw's oranges and Floe's blues, and the two names are set over it in the
 * site's own type, in the colour of the page: they read as clean shapes cut
 * out of the moving type. With reduced motion the field is one still frame.
 */
export function FooterWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<SVGSVGElement>(null);
  // The gradient holds still for anyone who has asked for less motion.
  const [still, setStill] = useState(false);
  // The moving gradient needs WebGL. Where there is none, a plain one stands in for it.
  const [shader, setShader] = useState(false);
  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const probe = document.createElement('canvas');
    setShader(Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl')));
  }, []);

  // The conure says where it bit, in the window's own pixels; here that becomes a hole
  // in the words, in the words' own units. When it has flown off, the holes close.
  const [bites, setBites] = useState<{ x: number; y: number; r: number }[]>([]);
  useEffect(() => {
    const words = wordsRef.current;
    const stage = words?.parentElement;
    if (!words || !stage) return;
    const onBite = (event: Event) => {
      const matrix = words.getScreenCTM();
      const { x, y, radius } = (event as CustomEvent<{ x: number; y: number; radius: number }>)
        .detail;
      if (!matrix) return;
      const at = new DOMPoint(x, y).matrixTransform(matrix.inverse());
      setBites((before) => [...before, { x: at.x, y: at.y, r: radius / matrix.a }]);
    };
    const onMend = () => setBites([]);
    stage.addEventListener('conure:bite', onBite);
    stage.addEventListener('conure:mend', onMend);
    return () => {
      stage.removeEventListener('conure:bite', onBite);
      stage.removeEventListener('conure:mend', onMend);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const stage = canvas?.parentElement;
    const words = wordsRef.current;
    if (!canvas || !context || !stage || !words) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let columns = 0;
    let rows = 0;
    let cellWidth = 0;
    let visible = true;
    let frame = 0;
    let last = 0;

    function resize() {
      if (!canvas || !context || !stage || !words) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      // About 170 characters across a wide window, and never smaller than can be read as type.
      cellWidth = Math.max(5, width / 170);
      columns = Math.ceil(width / cellWidth);
      rows = Math.ceil(height / (cellWidth * cellShape));
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      // The conure lands on the letters: this is how far down their tops are, and the
      // size of one of its pixels, which follows the size of the words.
      // The tops of the capitals are where the conure's feet go.
      const drawn = words.getBoundingClientRect();
      const top = drawn.top - stage.getBoundingClientRect().top;
      const capitals = (drawn.height * type.capHeight * type.size) / box.height;
      stage.style.setProperty(
        '--perch-y',
        `${top + (drawn.height * baseline) / box.height - capitals}px`,
      );
      stage.style.setProperty('--pixel', `${Math.max(2, drawn.height / 62)}px`);
      // And where across: the middle of the ampersand, which is not the middle of the
      // page, since "thaw" and "floe" are not the same width.
      const text = words.querySelector('text');
      const matrix = text?.getScreenCTM();
      if (text && matrix && text.getNumberOfChars() > 8) {
        const left = stage.getBoundingClientRect().left;
        // A point some way across one character of "thaw & floe", from the stage's left edge.
        const across = (index: number, part: number) => {
          const letter = text.getExtentOfChar(index);
          const point = new DOMPoint(letter.x + letter.width * part, letter.y);
          return `${point.matrixTransform(matrix).x - left}px`;
        };
        stage.style.setProperty('--perch-x', across(5, 0.5));
        // It calls at each name too, on a letter as tall as the ampersand: the h of
        // "thaw", whose upright is at the left of the letter and not in its middle,
        // and the l of "floe", which is nothing but an upright.
        stage.style.setProperty('--perch-thaw', across(1, stemOfH));
        stage.style.setProperty('--perch-floe', across(8, 0.5));
        // And the floor: the line the words stand on, in the gap between the ampersand
        // and "floe", where there is no letter to stand in.
        stage.style.setProperty('--floor-x', across(6, 0.5));
        stage.style.setProperty('--floor-drop', `${capitals}px`);
        // The opening in the ampersand's lower bowl, which the conure looks out of when it
        // has gone behind the letter: the middle of its floor is where the bird's chin goes.
        const sign = text.getExtentOfChar(5);
        const bowl = bowlOf(getComputedStyle(text).fontFamily, sign.width);
        if (bowl && matrix.a > 0) {
          const origin = stage.getBoundingClientRect();
          const spot = new DOMPoint(bowl.across + sign.x, bowl.floor).matrixTransform(matrix);
          stage.style.setProperty('--peek-x', `${spot.x - origin.left}px`);
          stage.style.setProperty('--peek-y', `${spot.y - origin.top}px`);
        }
      }
    }

    function draw(time: number) {
      if (!canvas || !context) return;
      const style = getComputedStyle(canvas);
      // The canvas is a sheet in the colour of the page with the characters cut out of
      // it, so the gradient underneath shows through them and nowhere else.
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = getComputedStyle(document.body).backgroundColor;
      context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = '#000';
      const cellHeight = cellWidth * cellShape;
      context.font = `600 ${cellHeight * 0.72}px ${style.fontFamily}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const seconds = time / 1000;
      const band = columns / (rows * cellShape);
      const at = lights.map((light) => ({
        x: light.x + Math.cos(seconds * light.speed + light.phase) * light.rx,
        y: light.y + Math.sin(seconds * light.speed * 1.3 + light.phase) * light.ry,
        reach: 2 * light.spread * light.spread,
        weight: light.weight,
      }));

      for (let row = 0; row < rows; row++) {
        const y = (row + 0.5) / rows;
        // Solid behind the words, so they always show, and open above them.
        const floor = 0.3 * Math.exp(-(((y - 0.62) / 0.26) ** 2));
        for (let column = 0; column < columns; column++) {
          const x = (column + 0.5) / columns;
          let glow = floor;
          for (const light of at) {
            // Distances are measured in widths, so a light is round, not stretched.
            const dx = x - light.x;
            const dy = (y - light.y) / band;
            glow += light.weight * Math.exp(-(dx * dx + dy * dy) / light.reach);
          }
          const density = Math.min(1, glow) * Math.min(1, x / 0.06, (1 - x) / 0.06);
          if (density < 0.05) continue;
          // How much of the colour a character lets through follows how dense the type is.
          context.globalAlpha = 0.2 + 0.8 * density;
          context.fillText(
            ramp[Math.round(density * (ramp.length - 1))],
            (column + 0.5) * cellWidth,
            (row + 0.5) * cellHeight,
          );
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    }

    function loop(time: number) {
      frame = requestAnimationFrame(loop);
      if (!visible || time - last < 1000 / rate) return;
      last = time;
      draw(time);
    }

    const sized = new ResizeObserver(() => {
      resize();
      draw(still ? 0 : performance.now());
    });
    sized.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(canvas);
    // The colours differ per theme, so a still picture is drawn again when the theme changes.
    const unthemed = onThemeChange(() => draw(still ? 0 : performance.now()));
    // The letters change width when the display face arrives, and nothing resizes then:
    // the words move a little, and the conure has to follow.
    document.fonts?.ready.then(resize);

    resize();
    draw(0);
    if (!still) frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      unthemed();
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(100deg, ${colours[3]}, ${colours[4]} 30%, ${colours[1]} 68%, ${colours[0]})`,
        }}
      />
      {shader && (
        <MeshGradient
          aria-hidden
          className="absolute inset-0 size-full"
          colors={colours}
          distortion={0.85}
          swirl={0.35}
          speed={still ? 0 : 0.3}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="footer-wordmark absolute inset-0 size-full font-mono"
      />
      {/* The names, in the colour of the page, over the type. */}
      <svg
        ref={wordsRef}
        aria-hidden
        viewBox={`0 0 ${box.width} ${box.height}`}
        className="pointer-events-none absolute inset-x-0 bottom-[6%] w-full fill-fd-background"
      >
        {/* What the conure has eaten out of the letters: holes in the words, through which
            the type behind shows again. */}
        <mask
          id="footer-bites"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={box.width}
          height={box.height}
        >
          <rect width={box.width} height={box.height} fill="white" />
          {bites.map((bite) => (
            <circle key={`${bite.x}-${bite.y}`} cx={bite.x} cy={bite.y} r={bite.r} fill="black" />
          ))}
        </mask>
        <Words>thaw &amp; floe</Words>
      </svg>
      {/* The ampersand once more, in front of the conure, for when it goes down behind the
          letter: the same words in the same place with only the ampersand drawn, and the
          same holes in it. Shown only while the bird is behind (see footer-conure.tsx). */}
      <svg
        aria-hidden
        viewBox={`0 0 ${box.width} ${box.height}`}
        className="footer-cover pointer-events-none absolute inset-x-0 bottom-[6%] w-full fill-fd-background"
      >
        <Words>
          <tspan fillOpacity={0}>thaw </tspan>&amp;<tspan fillOpacity={0}> floe</tspan>
        </Words>
      </svg>
      {/* The type fades in from the page above it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-fd-background to-transparent" />
    </>
  );
}
