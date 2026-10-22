'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';
import { columns, drawPose, rows } from './conure-poses';

// The two apps' icons, a pixel at a time: Thaw's pale cube on orange, its top face lit
// and its two sides in shade, and Floe's chunk of ice on blue with a crack across it.
const icons = {
  Thaw: [
    '.oooooooooooo.',
    'oooooooooooooo',
    'ooooooyyoooooo',
    'ooooyyaayyoooo',
    'ooyyaaaaaayyoo',
    'ooyyaaaaaayyoo',
    'ooyqyyaayypyoo',
    'ooyqqqyypppyoo',
    'ooyqqqyypppyoo',
    'ooyqqqyypppyoo',
    'ooyqqqyypppyoo',
    'oooyyqyypyyooo',
    'oooooyyyyooooo',
    '.oooooooooooo.',
  ],
  Floe: [
    '.bbbbbbbbbbbb.',
    'bbbbbbbbbbbbbb',
    'bbbbbwwwwwbbbb',
    'bbbwwwwwwiwbbb',
    'bbwwwwwwiwwwbb',
    'bbwwwwwiwwwwcb',
    'bbwwwwiwwwwwcb',
    'bbwwwwwiiiiicb',
    'bbcwwwwwwwwccb',
    'bbbcwwwwwwccbb',
    'bbbbccwwwccbbb',
    'bbbbbbcccbbbbb',
    'bbbbbbbbbbbbbb',
    '.bbbbbbbbbbbb.',
  ],
};
const colours: Record<string, string> = {
  o: '#e8922e',
  y: '#fde6a6',
  a: '#f5bd5c',
  q: '#c4641a',
  p: '#d8782a',
  b: '#2a7fd4',
  w: '#eef8ff',
  i: '#9fd4f2',
  c: '#5cc6ef',
};
type App = keyof typeof icons;

// A picture drawn once from rows of letters, each letter a colour and a dot nothing.
function picture(lines: string[], palette: Record<string, string>) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...lines.map((line) => line.length));
  canvas.height = lines.length;
  const context = canvas.getContext('2d');
  lines.forEach((line, row) => {
    [...line].forEach((mark, column) => {
      if (!context || mark === '.') return;
      context.fillStyle = palette[mark];
      context.fillRect(column, row, 1, 1);
    });
  });
  return canvas.toDataURL();
}

// The range: a mesa and a low sun far off, saguaros nearer, and in front of each place a
// crate or a barrel for the icons to come up from behind. G is a saguaro's green and g the
// ridges down it; m the mesa and n its shadowed side; s the sun and S its middle; k dark
// wood and w light, l where a barrel catches the light, and h its iron hoops.
const scenery = {
  saguaro: [
    '....GG....',
    '...GGGG...',
    '...GgGG...',
    'G..GgGG...',
    'G..GgGG..G',
    'G..GgGG..G',
    'GG.GgGG..G',
    '.GGGgGG.GG',
    '...GgGGGG.',
    '...GgGG...',
    '...GgGG...',
    '...GgGG...',
    '...GgGG...',
    '...GgGG...',
    '...GgGG...',
  ],
  mesa: [
    '........mmmmmmmmmmmmn..........................',
    '.......mmmmmmmmmmmmmnn.........................',
    '......mmmmmmmmmmmmmmnnn..........mmmmmmn.......',
    '.....mmmmmmmmmmmmmmmnnnn........mmmmmmmnn......',
    '....mmmmmmmmmmmmmmmmnnnnn......mmmmmmmmnnn.....',
    '...mmmmmmmmmmmmmmmmmnnnnnnmmmmmmmmmmmmmnnnn....',
    '..mmmmmmmmmmmmmmmmmmnnnnnnnmmmmmmmmmmmmnnnnn...',
    '.mmmmmmmmmmmmmmmmmmmnnnnnnnnmmmmmmmmmmmnnnnnn..',
    'mmmmmmmmmmmmmmmmmmmmnnnnnnnnnmmmmmmmmmmnnnnnnn.',
  ],
  sun: [
    '...sss...',
    '.sssssss.',
    '.ssSSSss.',
    'ssSSSSSss',
    'ssSSSSSss',
    'ssSSSSSss',
    '.ssSSSss.',
    '.sssssss.',
    '...sss...',
  ],
  crate: [
    'kkkkkkkkkkkk',
    'kwwwwwwwwwwk',
    'kwkwwwwwwkwk',
    'kwwkwwwwkwwk',
    'kwwwkwwkwwwk',
    'kwwwwkkwwwwk',
    'kwwwkwwkwwwk',
    'kwwkwwwwkwwk',
    'kwkwwwwwwkwk',
    'kkkkkkkkkkkk',
  ],
  barrel: [
    '..kkkkkk..',
    '.kwwwwwwk.',
    'hhhhhhhhhh',
    'kwlwwwwwwk',
    'kwlwwwwwwk',
    'kwlwwwwwwk',
    'kwlwwwwwwk',
    'hhhhhhhhhh',
    '.kwwwwwwk.',
    '..kkkkkk..',
  ],
};
const sceneryColours = {
  G: '#3f7d3a',
  g: '#5f9e4e',
  m: '#b8794a',
  n: '#9a6038',
  s: '#f0a040',
  S: '#f7c56a',
  k: '#5e3d22',
  w: '#a8743f',
  l: '#c48a52',
  h: '#6b6f76',
};
// Where the saguaros stand, as shares of the stage's width, and how tall each is drawn.
const saguaros = [
  { at: 0.2, size: 1 },
  { at: 0.33, size: 0.7 },
  { at: 0.97, size: 1.2 },
];

// The ground: a strip of dirt drawn once, in browns with a stone here and there, and
// repeated along the floor.
function dirt() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 8;
  const context = canvas.getContext('2d');
  const browns = ['#7a5230', '#7a5230', '#6b4728', '#5e3d22', '#8a5e38'];
  // The same dirt each time: a fixed run of numbers, not Math.random.
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 16; column++) {
      if (!context) break;
      context.fillStyle =
        row === 0 ? '#946840' : next() < 0.06 ? '#a88a6a' : browns[Math.floor(next() * 5)];
      context.fillRect(column, row, 1, 1);
    }
  }
  return canvas.toDataURL();
}

// The conure's revolver, in its own pixels on the standing pose: the barrel pointing
// right at chest height, the hammer above it and the grip below. When it fires the gun
// kicks up a pixel and a flash comes out of the muzzle.
function shooter(context: CanvasRenderingContext2D, firing: boolean) {
  drawPose(context, 'perched');
  const kick = firing ? 1 : 0;
  const put = (column: number, row: number, colour: string) => {
    context.fillStyle = colour;
    context.fillRect(column, row + 2 - kick, 1, 1);
  };
  for (let column = 15; column <= 19; column++) put(column, 7, '#8f949c');
  put(15, 6, '#4a4e55');
  put(15, 8, '#6b4423');
  put(14, 9, '#6b4423');
  if (firing) {
    put(20, 7, '#ffd34d');
    put(21, 7, '#ff8a2a');
    put(20, 6, '#ff8a2a');
    put(20, 8, '#ff8a2a');
  }
}

// Where the icons come up out of the dirt, as shares of the stage's width: the right of
// it, across from the conure on the left.
const slots = [0.46, 0.57, 0.68, 0.79, 0.9];
// A round lasts this many seconds. An icon stays up for `up` seconds and a new one comes
// every `every`, both getting shorter as the round goes on.
const round = 30;
const up = { from: 1.3, to: 0.75 };
const every = { from: 0.9, to: 0.45 };
const best = 'conure-shootout-best';

// A picture's place on the page: its own pixels, each the game's pixel across.
function size(url: string, lines: string[], scale = 1) {
  return {
    backgroundImage: `url(${url})`,
    width: `calc(${lines[0].length * scale} * var(--dot))`,
    height: `calc(${lines.length * scale} * var(--dot))`,
  };
}

type Target = { id: number; slot: number; app: App; until: number; hit?: boolean };

/**
 * A shooting gallery over the footer, for whoever clicks a conure in a hat three times:
 * the wordmark goes dim behind a desert, the conure stands on a floor of dirt at the left
 * with a revolver, and for thirty seconds Thaw and Floe icons come up from behind crates
 * and barrels at the right. Each one hit is a point: clicked or tapped, or with the
 * keyboard, where the arrows aim, Space fires and a number fires at its place. Escape
 * stops it.
 */
export function FooterShootout({ onDone }: { onDone: () => void }) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(round);
  const [over, setOver] = useState<{ score: number; best: number } | null>(null);
  const [game, setGame] = useState(0);
  // Where the sights are, once the keyboard has been used to aim.
  const [aim, setAim] = useState<number | null>(null);
  const [pictures] = useState(() => ({
    Thaw: picture(icons.Thaw, colours),
    Floe: picture(icons.Floe, colours),
  }));
  const [props] = useState(() => ({
    saguaro: picture(scenery.saguaro, sceneryColours),
    mesa: picture(scenery.mesa, sceneryColours),
    sun: picture(scenery.sun, sceneryColours),
    crate: picture(scenery.crate, sceneryColours),
    barrel: picture(scenery.barrel, sceneryColours),
  }));
  const [ground] = useState(dirt);
  const field = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const bird = useRef<HTMLCanvasElement>(null);
  const fired = useRef(0);
  // What the round's clock reads, kept out of React so a frame can read it as it is now.
  const live = useRef({ targets: [] as Target[], score: 0, started: 0 });

  // The keys go to the game, so it takes the focus when it opens, and gives it back to
  // whatever had it when it closes.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    field.current?.focus();
    return () => before?.focus?.();
  }, []);

  // The conure, drawn again when the page changes theme and for the flash of each shot.
  useEffect(() => {
    const context = bird.current?.getContext('2d');
    if (!context) return;
    shooter(context, false);
    const themed = onThemeChange(() => shooter(context, false));
    return () => {
      themed();
      window.clearTimeout(fired.current);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `game` starts a new round
  useEffect(() => {
    const started = performance.now();
    live.current = { targets: [], score: 0, started };
    // Again, pressed, goes away with the result: the keys come back to the game.
    field.current?.focus();
    setTargets([]);
    setScore(0);
    setLeft(round);
    setOver(null);
    let next = 0;
    let id = 0;
    let frame = 0;

    function tick(now: number) {
      const time = (now - started) / 1000;
      const part = Math.min(1, time / round);
      const state = live.current;
      if (time >= round) {
        let record = state.score;
        try {
          record = Math.max(record, Number(localStorage.getItem(best)) || 0);
          localStorage.setItem(best, String(record));
        } catch {}
        state.targets = [];
        setTargets([]);
        setLeft(0);
        setOver({ score: state.score, best: record });
        return;
      }
      frame = requestAnimationFrame(tick);
      let changed = false;
      const kept = state.targets.filter((target) => target.until > time);
      if (kept.length !== state.targets.length) changed = true;
      if (time >= next) {
        const free = slots
          .map((_, slot) => slot)
          .filter((slot) => !kept.some((each) => each.slot === slot));
        if (free.length) {
          kept.push({
            id: id++,
            slot: free[Math.floor(Math.random() * free.length)],
            app: Math.random() < 0.5 ? 'Thaw' : 'Floe',
            until: time + up.from + (up.to - up.from) * part,
          });
          changed = true;
        }
        next = time + every.from + (every.to - every.from) * part;
      }
      if (changed) {
        state.targets = kept;
        setTargets(kept);
      }
      setLeft(Math.ceil(round - time));
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [game]);

  // Every shot fires, hit or miss; one that finds an icon knocks it over.
  function shoot(slot: number) {
    const context = bird.current?.getContext('2d');
    if (context) {
      shooter(context, true);
      window.clearTimeout(fired.current);
      fired.current = window.setTimeout(() => shooter(context, false), 90);
    }
    const state = live.current;
    const target = state.targets.find((each) => each.slot === slot && !each.hit);
    if (!target) return;
    // Knocked over, it stays a moment to be seen falling, and counts once.
    const time = (performance.now() - state.started) / 1000;
    state.targets = state.targets.map((each) =>
      each === target ? { ...each, hit: true, until: Math.min(each.until, time + 0.3) } : each,
    );
    state.score++;
    setScore(state.score);
    setTargets(state.targets);
  }

  // From the keyboard, while the focus is in the game: the arrows move the sights along
  // the five places, Space or Enter fires, and a number fires straight at its place. On
  // Stop, Again or Done, Space and Enter press the button as usual.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') return onDone();
    if (over) return;
    const slot = Number(event.key) - 1;
    if (slot >= 0 && slot < slots.length) {
      setAim(slot);
      return shoot(slot);
    }
    const step = { ArrowLeft: -1, a: -1, ArrowRight: 1, d: 1 }[event.key];
    if (step) {
      event.preventDefault();
      setAim((aimed) => Math.min(slots.length - 1, Math.max(0, (aimed ?? 2) + step)));
    } else if ((event.key === ' ' || event.key === 'Enter') && event.target === field.current) {
      event.preventDefault();
      if (aim !== null) shoot(aim);
      else setAim(2);
    }
  }

  useEffect(() => {
    if (over) again.current?.focus();
  }, [over]);

  return (
    <div
      ref={field}
      role="dialog"
      aria-label="Shooting gallery"
      aria-describedby="shootout-how"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="footer-shootout absolute inset-0 z-[3] outline-none"
    >
      <div
        className="footer-shootout-prop footer-shootout-sun"
        style={size(props.sun, scenery.sun)}
      />
      <div
        className="footer-shootout-prop footer-shootout-mesa"
        style={size(props.mesa, scenery.mesa)}
      />
      {saguaros.map(({ at, size: scale }) => (
        <div
          key={at}
          className="footer-shootout-prop footer-shootout-saguaro"
          style={{ ...size(props.saguaro, scenery.saguaro, scale), left: `${at * 100}%` }}
        />
      ))}
      <div className="footer-shootout-floor" style={{ backgroundImage: `url(${ground})` }} />
      <canvas
        ref={bird}
        width={columns}
        height={rows}
        aria-hidden
        className="footer-shootout-bird"
      />
      <div className="footer-shootout-board flex items-center gap-4 font-mono text-sm">
        <span>
          {score} {score === 1 ? 'hit' : 'hits'}
        </span>
        <span aria-hidden>0:{String(left).padStart(2, '0')}</span>
        <span aria-hidden className="max-sm:hidden opacity-70">
          ← → aim, Space fires
        </span>
        <button type="button" onClick={onDone} className="underline underline-offset-4">
          Stop
        </button>
      </div>
      <p id="shootout-how" className="sr-only">
        Thaw and Floe icons come up from behind crates and barrels in five places for thirty
        seconds. Aim with the left and right arrows and fire with Space, or press a place’s number
        from 1 to 5. Escape stops.
      </p>
      <p className="sr-only" aria-live="polite">
        {over && `Time. ${over.score} ${over.score === 1 ? 'hit' : 'hits'}, best ${over.best}.`}
      </p>
      {aim !== null && !over && (
        <div className="footer-shootout-sights" style={{ left: `${slots[aim] * 100}%` }} />
      )}
      <div className="footer-shootout-fence">
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            aria-label={`${target.app} icon, number ${target.slot + 1}`}
            data-hit={target.hit || undefined}
            className="footer-shootout-target"
            style={{ left: `${slots[target.slot] * 100}%` }}
            // Out of the Tab order and never focused, so the keyboard stays on the game.
            tabIndex={-1}
            onPointerDown={(event) => {
              event.preventDefault();
              shoot(target.slot);
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: a fourteen-pixel picture drawn on the page, with nothing for next/image to do */}
            <img src={pictures[target.app]} alt="" />
          </button>
        ))}
      </div>
      {slots.map((at, slot) => {
        const kind = slot % 2 ? 'barrel' : 'crate';
        return (
          <div
            key={at}
            className="footer-shootout-prop footer-shootout-cover"
            style={{ ...size(props[kind], scenery[kind]), left: `${at * 100}%` }}
          />
        );
      })}
      {over && (
        <div className="footer-shootout-over flex flex-col items-center gap-3 font-mono text-sm">
          <p>
            {over.score} {over.score === 1 ? 'hit' : 'hits'}. Best {over.best}.
          </p>
          <div className="flex gap-4">
            <button
              ref={again}
              type="button"
              onClick={() => setGame((each) => each + 1)}
              className="underline underline-offset-4"
            >
              Again
            </button>
            <button type="button" onClick={onDone} className="underline underline-offset-4">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
