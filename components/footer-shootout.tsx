'use client';

import { type KeyboardEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { onThemeChange } from '@/lib/on-theme-change';
import { columns, drawPose, rows } from './conure-poses';
import {
  coverColours,
  covers,
  paintScene,
  picture,
  tumbleweed,
  tumbleweedColours,
} from './shootout-scene';
import { shootoutSound } from './shootout-sound';

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

// The conure's revolver, in its own pixels on the standing pose: the barrel pointing
// right at chest height, the hammer above it and the grip below. When it fires the gun
// kicks up a pixel and a flash comes out of the muzzle. Reloading, it holds the gun up with
// the cylinder swung out.
function shooter(
  context: CanvasRenderingContext2D,
  firing: boolean,
  pose = 'perched',
  reloading = false,
) {
  drawPose(context, pose);
  const kick = firing ? 1 : 0;
  const put = (column: number, row: number, colour: string) => {
    context.fillStyle = colour;
    context.fillRect(column, row + 2 - kick, 1, 1);
  };
  if (reloading) {
    for (let row = 2; row <= 6; row++) put(17, row, '#8f949c');
    put(18, 5, '#d9a441');
    put(17, 7, '#6b4423');
    put(16, 8, '#6b4423');
    return;
  }
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
// it, across from the conure on the left. A phone has room for three places a finger can
// tell apart, spread across more of the width.
const lanes = {
  wide: [0.46, 0.57, 0.68, 0.79, 0.9],
  narrow: [0.45, 0.66, 0.87],
};
function lanesNow() {
  return window.matchMedia('(max-width: 639px)').matches ? lanes.narrow : lanes.wide;
}
// A round lasts this many seconds. An icon stays up for `up` seconds and a new one comes
// every `every`, both getting shorter as the round goes on.
const round = 30;
const up = { from: 1.3, to: 0.75 };
const every = { from: 0.9, to: 0.45 };
const best = 'conure-shootout-best';
// Six shots to the cylinder, then this many seconds to fill it again. Waiting for a clear
// target is what the cylinder asks of you, and so is this: every fifth hit in a row, with
// no shot wasted between them, counts double.
const cylinder = 6;
const reloading = 0.8;
const run = 5;
const sound = 'conure-shootout-sound';

function bestSoFar() {
  try {
    return Number(localStorage.getItem(best)) || 0;
  } catch {
    return 0;
  }
}

// A picture's place on the page: its own pixels, each the game's pixel across.
function size(url: string, lines: string[]) {
  return {
    backgroundImage: `url(${url})`,
    width: `calc(${lines[0].length} * var(--dot))`,
    height: `calc(${lines.length} * var(--dot))`,
  };
}

// A place across the stage, kept on the game's pixels so nothing lands between two.
const across = (share: number) => `round(${share * 100}%, var(--dot))`;

// What the bird does when it is not shooting, a pose and how many milliseconds it holds
// it: looks up before a round, and after one puts the gun away and tips its hat. A new
// best gets the head-bob it does on "floe".
const acts = {
  ready: [['facing', 0]],
  done: [
    ['perched', 400],
    ['facing', 300],
    ['faceDown', 150],
    ['facing', 150],
    ['faceDown', 150],
    ['facing', 0],
  ],
  record: [
    ['perched', 300],
    ['facing', 300],
    ['faceUp', 160],
    ['faceDown', 160],
    ['faceUp', 160],
    ['faceDown', 160],
    ['faceUp', 160],
    ['faceDown', 160],
    ['facing', 0],
  ],
} satisfies Record<string, [pose: string, lasts: number][]>;

// What a shot leaves in the air, in the game's pixels: the line it flew along, for a
// moment, and whatever it knocked off. Bits of icon for a hit, dirt for a miss, and brass
// for the last shot in the cylinder, whose empties fall at the bird's feet.
const trace = 70;
const shards = { Thaw: ['#e8922e', '#fde6a6', '#f5bd5c'], Floe: ['#2a7fd4', '#eef8ff', '#5cc6ef'] };
const clods = ['#7a5230', '#a88a6a', '#5e3d22'];
const brass = ['#d9a441', '#f2c230'];
type Shard = { x: number; y: number; across: number; down: number; colour: string };

type Target = {
  id: number;
  slot: number;
  app: App;
  until: number;
  hit?: boolean;
  // What it scored, and how many hits in a row it made.
  worth?: number;
  streak?: number;
};
type Phase = 'ready' | 'playing' | 'paused' | 'over';

// The round as it is now, kept out of React so a frame can read it. `time` is seconds of
// play, which is not the same as seconds since it started: a pause stops it. `reload` is
// when the cylinder will be full, if it is empty, and `mood` how the bird is taking it.
function freshRound() {
  return {
    targets: [] as Target[],
    score: 0,
    time: 0,
    next: 0,
    id: 0,
    shots: cylinder,
    reload: 0,
    streak: 0,
    longest: 0,
    hits: 0,
    fired: 0,
    mood: 'perched',
    // The best to beat, and whether this round has beaten it yet.
    toBeat: bestSoFar(),
    beaten: false,
  };
}

// The bird between shots.
function atRest(context: CanvasRenderingContext2D, state: ReturnType<typeof freshRound>) {
  shooter(context, false, state.reload ? 'perched' : state.mood, state.reload > 0);
}

const currentTheme = () =>
  document.documentElement.classList.contains('dark') ? ('dark' as const) : ('light' as const);

/**
 * A shooting gallery over the footer, or over wherever a page's conure is, for whoever gets as far as it with the conure: a
 * desert (see shootout-scene) takes the place of the wordmark, the conure stands on a patch
 * of dirt at the left with a revolver, and for thirty seconds Thaw and Floe icons come up from behind crates and
 * barrels at the right. Each one hit is a point: clicked or tapped, or with the keyboard,
 * where the arrows aim, Space fires and a number fires at its place. The revolver holds
 * six and fills itself when it is empty, a miss breaks a run of hits, and every fifth in
 * a run counts double. It waits to be started, and stops the clock when it is out of
 * sight. Escape closes it.
 */
export function FooterShootout({
  onDone,
  leaving,
  onOpen,
}: {
  onDone: () => void;
  /** Where closing it goes back to, for the button to say. */
  leaving: 'footer' | 'page';
  /** Called once it has noted where the focus was, so what it covers can be put out of reach. */
  onOpen?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(round);
  const [over, setOver] = useState<{
    score: number;
    best: number;
    record: boolean;
    hits: number;
    fired: number;
    longest: number;
  } | null>(null);
  const [shots, setShots] = useState(cylinder);
  const [emptied, setEmptied] = useState(false);
  const [cheering, setCheering] = useState(false);
  const [noisy, setNoisy] = useState(() => {
    try {
      return localStorage.getItem(sound) === 'on';
    } catch {
      return false;
    }
  });
  const [slots, setSlots] = useState(lanesNow);
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [record] = useState(bestSoFar);
  // Where the sights are, once the keyboard has been used to aim.
  const [aim, setAim] = useState<number | null>(null);
  const [pictures] = useState(() => ({
    Thaw: picture(icons.Thaw, colours),
    Floe: picture(icons.Floe, colours),
  }));
  const [theme, setTheme] = useState(currentTheme);
  const sprites = useMemo(
    () => ({
      crate: picture(covers.crate, coverColours[theme]),
      barrel: picture(covers.barrel, coverColours[theme]),
      tumbleweed: picture(tumbleweed, tumbleweedColours[theme]),
    }),
    [theme],
  );
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const field = useRef<HTMLDivElement>(null);
  const opened = useRef(onOpen);
  const fence = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLCanvasElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const bird = useRef<HTMLCanvasElement>(null);
  const air = useRef<HTMLCanvasElement>(null);
  const fired = useRef(0);
  // What the bird is showing, to draw again if the page changes theme.
  const drawn = useRef<() => void>(() => {});
  const cheer = useRef(0);
  const live = useRef(freshRound());
  const [noises] = useState(shootoutSound);
  const flying = useRef({
    line: null as number[] | null,
    until: 0,
    shards: [] as Shard[],
    frame: 0,
  });

  // Whatever had the focus when the game opened gets it back when it closes. On a phone
  // the stage grows to fit the game, so what has been opened is brought fully into view.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    field.current?.scrollIntoView({ block: 'nearest' });
    opened.current?.();
    return () => before?.focus?.();
  }, []);

  // The keys go to the game while it runs, and otherwise to the button it is waiting on.
  // Not scrolled to: a round paused by scrolling away stays where it was left.
  useEffect(() => {
    (phase === 'playing' ? field : primary).current?.focus({ preventScroll: true });
  }, [phase]);

  // The conure, drawn again when the page changes theme.
  useEffect(
    () =>
      onThemeChange(() => {
        drawn.current();
        setTheme(currentTheme());
      }),
    [],
  );

  // The desert, painted again whenever the stage changes size or the page its theme. In
  // whole pixels of the game's: what is left over at the top of the stage is cropped.
  useEffect(() => {
    const canvas = backdrop.current;
    const area = field.current;
    const body = bird.current;
    if (!canvas || !area || !body) return;
    const paint = () => {
      const dot = body.getBoundingClientRect().width / columns;
      if (!dot) return;
      const width = Math.ceil(area.clientWidth / dot);
      const height = Math.ceil(area.clientHeight / dot);
      canvas.style.width = `${width * dot}px`;
      canvas.style.height = `${height * dot}px`;
      paintScene(canvas, {
        theme,
        width,
        height,
        floor: 12,
        lanes: slots,
        bird: Math.round(body.offsetLeft / dot),
        narrow: slots === lanes.narrow,
      });
    };
    paint();
    const resized = new ResizeObserver(paint);
    resized.observe(area);
    return () => resized.disconnect();
  }, [slots, theme]);

  useEffect(() => {
    const context = bird.current?.getContext('2d');
    if (!context) return;
    window.clearTimeout(fired.current);
    if (phase === 'playing' || phase === 'paused') {
      drawn.current = () => atRest(context, live.current);
      drawn.current();
      return;
    }
    const act = phase === 'ready' ? acts.ready : over?.record ? acts.record : acts.done;
    let timer = 0;
    const perform = (beat: number) => {
      const [pose, lasts] = act[beat];
      drawn.current = () => drawPose(context, pose);
      drawn.current();
      if (beat + 1 < act.length) timer = window.setTimeout(() => perform(beat + 1), lasts);
    };
    perform(still ? act.length - 1 : 0);
    return () => window.clearTimeout(timer);
  }, [phase, over, still]);

  // Out of sight the clock stops, whether the tab has been left or the page scrolled away.
  useEffect(() => {
    const pause = () => setPhase((now) => (now === 'playing' ? 'paused' : now));
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) pause();
      },
      { threshold: 0.5 },
    );
    if (field.current) seen.observe(field.current);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      seen.disconnect();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    let last = performance.now();
    let frame = 0;

    function tick(now: number) {
      const state = live.current;
      // Never more than a moment at once, in case a frame comes late.
      state.time += Math.min(0.25, Math.max(0, now - last) / 1000);
      last = now;
      const time = state.time;
      const part = Math.min(1, time / round);
      if (state.reload) {
        if (time >= state.reload) {
          state.reload = 0;
          state.shots = cylinder;
          setEmptied(false);
          drawn.current();
        }
        // Filling up a chamber at a time.
        const filled = (1 - (state.reload - time) / reloading) * cylinder;
        setShots(state.reload ? Math.floor(filled) : cylinder);
      }
      if (time >= round) {
        const before = bestSoFar();
        const most = Math.max(state.score, before);
        try {
          localStorage.setItem(best, String(most));
        } catch {}
        state.targets = [];
        setTargets([]);
        setLeft(0);
        setOver({
          score: state.score,
          best: most,
          record: state.score > before,
          hits: state.hits,
          fired: state.fired,
          longest: state.longest,
        });
        setPhase('over');
        return;
      }
      frame = requestAnimationFrame(tick);
      let changed = false;
      const kept = state.targets.filter((target) => target.until > time);
      if (kept.length !== state.targets.length) changed = true;
      if (time >= state.next) {
        const free = slots
          .map((_, slot) => slot)
          .filter((slot) => !kept.some((each) => each.slot === slot));
        if (free.length) {
          kept.push({
            id: state.id++,
            slot: free[Math.floor(Math.random() * free.length)],
            app: Math.random() < 0.5 ? 'Thaw' : 'Floe',
            until: time + up.from + (up.to - up.from) * part,
          });
          changed = true;
        }
        state.next = time + every.from + (every.to - every.from) * part;
      }
      if (changed) {
        state.targets = kept;
        setTargets(kept);
      }
      setLeft(Math.ceil(round - time));
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, slots]);

  useEffect(
    () => () => {
      cancelAnimationFrame(flying.current.frame);
      window.clearTimeout(cheer.current);
      window.clearTimeout(fired.current);
      noises.close();
    },
    [noises],
  );

  function begin() {
    live.current = freshRound();
    if (noisy) noises.wake();
    setShots(cylinder);
    setEmptied(false);
    setCheering(false);
    setSlots(lanesNow());
    setTargets([]);
    setScore(0);
    setLeft(round);
    setOver(null);
    setPhase('playing');
  }

  // Draws what a shot left in the air, frame by frame until there is nothing left of it.
  function fly(now: number, last: number) {
    const canvas = air.current;
    const context = canvas?.getContext('2d');
    const shot = flying.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (shot.line && now < shot.until) {
      const [fromX, fromY, toX, toY] = shot.line;
      const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
      context.fillStyle = '#ffd34d';
      for (let step = 0; step <= steps; step += 1) {
        const part = step / (steps || 1);
        context.fillRect(
          Math.round(fromX + (toX - fromX) * part),
          Math.round(fromY + (toY - fromY) * part),
          1,
          1,
        );
      }
    }
    const lapse = Math.min(0.05, (now - last) / 1000);
    shot.shards = shot.shards.filter((shard) => shard.y < canvas.height);
    for (const shard of shot.shards) {
      shard.down += 90 * lapse;
      shard.x += shard.across * lapse;
      shard.y += shard.down * lapse;
      context.fillStyle = shard.colour;
      context.fillRect(Math.round(shard.x), Math.round(shard.y), 1, 1);
    }
    if (shot.shards.length || now < shot.until) {
      shot.frame = requestAnimationFrame((next) => fly(next, now));
    } else shot.frame = 0;
  }

  // A shot, at a place or at a point on the field. With the cylinder empty there is only
  // the click of it. Otherwise every shot fires, hit or miss; one that finds an icon
  // knocks it over, and one that does not breaks the run.
  function shoot(slot: number | null, point?: { x: number; y: number }) {
    const state = live.current;
    if (state.reload) {
      if (noisy) noises.empty();
      return;
    }
    state.fired++;
    state.shots--;
    setShots(state.shots);
    if (!state.shots) {
      state.reload = state.time + reloading;
      setEmptied(true);
      if (noisy) noises.reload();
    }
    const target =
      slot === null ? undefined : state.targets.find((each) => each.slot === slot && !each.hit);
    if (slot !== null) show(slot, target);
    else if (point) show(null, undefined, point);
    if (noisy) noises.shot();
    if (target) {
      state.hits++;
      state.streak++;
      state.longest = Math.max(state.longest, state.streak);
      const worth = state.streak % run ? 1 : 2;
      // Knocked over, it stays a moment to be seen falling, with its point over it, and
      // counts once.
      state.targets = state.targets.map((each) =>
        each === target
          ? { ...each, hit: true, until: state.time + 0.5, worth, streak: state.streak }
          : each,
      );
      state.score += worth;
      setScore(state.score);
      setTargets(state.targets);
      const beating = state.toBeat > 0 && state.score > state.toBeat && !state.beaten;
      if (beating) {
        state.beaten = true;
        setCheering(true);
        window.clearTimeout(cheer.current);
        cheer.current = window.setTimeout(() => setCheering(false), 1400);
      }
      if (noisy) {
        if (beating) noises.best();
        else if (worth > 1) noises.run();
        else noises.hit();
      }
      state.mood = worth > 1 || beating ? 'bobUp' : 'perched';
    } else {
      state.streak = 0;
      state.mood = 'looking';
    }
    if (still) state.mood = 'perched';
    const context = bird.current?.getContext('2d');
    if (!context) return;
    shooter(context, true);
    window.clearTimeout(fired.current);
    fired.current = window.setTimeout(() => {
      atRest(context, state);
      fired.current = window.setTimeout(() => {
        state.mood = 'perched';
        atRest(context, state);
      }, 300);
    }, 90);
  }

  // The line from the muzzle to where the shot went, and what flew up there.
  function show(slot: number | null, target?: Target, point?: { x: number; y: number }) {
    const canvas = air.current;
    const area = field.current?.getBoundingClientRect();
    const body = bird.current?.getBoundingClientRect();
    const floor = fence.current?.getBoundingClientRect();
    if (!canvas || !area || !body || !floor) return;
    const dot = body.width / columns;
    const wide = Math.round(area.width / dot);
    const high = Math.round(area.height / dot);
    if (canvas.width !== wide || canvas.height !== high) {
      canvas.width = wide;
      canvas.height = high;
      canvas.style.width = `${wide * dot}px`;
      canvas.style.height = `${high * dot}px`;
    }
    const toX = (slot === null ? (point?.x ?? 0) : slots[slot] * area.width) / dot;
    const toY = (slot === null ? (point?.y ?? 0) : floor.bottom - area.top - 7 * dot) / dot;
    const now = performance.now();
    const shot = flying.current;
    shot.line = [
      (body.left - area.left) / dot + 21,
      (body.top - area.top) / dot + 9,
      Math.round(toX),
      Math.round(toY),
    ];
    shot.until = now + trace;
    if (!still) {
      const bits = target ? shards[target.app] : clods;
      for (let count = 0; count < (target ? 10 : 4); count++) {
        shot.shards.push({
          x: toX,
          y: toY,
          across: (Math.random() - 0.5) * 50,
          down: -20 - Math.random() * 30,
          colour: bits[count % bits.length],
        });
      }
      if (live.current.reload) {
        for (let count = 0; count < cylinder; count++) {
          shot.shards.push({
            x: (body.left - area.left) / dot + 15,
            y: (body.top - area.top) / dot + 10,
            across: -5 - Math.random() * 25,
            down: -15 - Math.random() * 20,
            colour: brass[count % brass.length],
          });
        }
      }
    }
    if (!shot.frame) shot.frame = requestAnimationFrame((next) => fly(next, now));
  }

  // From the keyboard, while the focus is in the game: the arrows move the sights along
  // the places, Space or Enter fires, and a number fires straight at its place. On a
  // button, Space and Enter press it as usual.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') return onDone();
    const onField = event.target === field.current;
    const pressed = event.key === ' ' || event.key === 'Enter';
    if (phase === 'ready' || phase === 'paused') {
      if (pressed && onField) {
        event.preventDefault();
        if (phase === 'ready') begin();
        else setPhase('playing');
      }
      return;
    }
    if (phase !== 'playing') return;
    const slot = Number(event.key) - 1;
    if (slot >= 0 && slot < slots.length) {
      setAim(slot);
      return shoot(slot);
    }
    const step = { ArrowLeft: -1, a: -1, ArrowRight: 1, d: 1 }[event.key];
    if (step) {
      event.preventDefault();
      const middle = Math.floor(slots.length / 2);
      setAim((aimed) => Math.min(slots.length - 1, Math.max(0, (aimed ?? middle) + step)));
    } else if (pressed && onField) {
      event.preventDefault();
      if (aim !== null) shoot(aim);
      else setAim(Math.floor(slots.length / 2));
    }
  }

  // A click or a tap on nothing is a shot too, at where it landed.
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (phase !== 'playing' || !(event.target instanceof Element)) return;
    if (event.target.closest('button, .footer-shootout-board')) return;
    const area = event.currentTarget.getBoundingClientRect();
    shoot(null, { x: event.clientX - area.left, y: event.clientY - area.top });
  }

  const points = (count: number) => `${count} ${count === 1 ? 'point' : 'points'}`;

  function turnSound() {
    const on = !noisy;
    setNoisy(on);
    if (on) noises.hit();
    try {
      localStorage.setItem(sound, on ? 'on' : 'off');
    } catch {}
  }

  return (
    <div
      ref={field}
      role="dialog"
      aria-label="Shooting gallery"
      aria-describedby="shootout-how"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      className="footer-shootout absolute inset-0 z-[3] outline-none"
    >
      <canvas ref={backdrop} aria-hidden className="footer-shootout-scene" />
      {phase === 'ready' && !still && (
        <div className="footer-shootout-tumbleweed-path">
          <div
            className="footer-shootout-tumbleweed"
            style={size(sprites.tumbleweed, tumbleweed)}
          />
        </div>
      )}
      <canvas
        ref={bird}
        width={columns}
        height={rows}
        aria-hidden
        className="footer-shootout-bird"
      />
      {phase === 'playing' && (
        <div className="footer-shootout-board flex items-center gap-4 font-mono text-sm">
          <span>{points(score)}</span>
          <span aria-hidden>0:{String(left).padStart(2, '0')}</span>
          <span
            role="img"
            aria-label={emptied ? 'Reloading' : `${shots} shots left`}
            className="footer-shootout-cylinder"
          >
            {[...Array(cylinder).keys()].map((chamber) => (
              <span key={chamber} data-spent={chamber >= shots || undefined} />
            ))}
          </span>
          <span aria-hidden className="max-sm:hidden opacity-70">
            ← → aim, Space fires
          </span>
          <button type="button" onClick={onDone} className="footer-shootout-button">
            Stop
          </button>
        </div>
      )}
      <p id="shootout-how" className="sr-only">
        Thaw and Floe icons come up from behind crates and barrels in {slots.length} places for
        thirty seconds. Aim with the left and right arrows and fire with Space, or press a place’s
        number from 1 to {slots.length}. The revolver holds six shots and reloads itself when it is
        empty. A miss breaks your run, and every fifth hit in a row counts double. Escape closes the
        game.
      </p>
      <p className="sr-only" aria-live="polite">
        {phase === 'paused' && `Paused with ${points(score)}.`}
        {phase === 'playing' && emptied && 'Reloading.'}
        {over &&
          `Time. ${points(over.score)}, ${over.record ? 'a new best' : `best ${over.best}`}.`}
      </p>
      {aim !== null && phase === 'playing' && (
        <div className="footer-shootout-sights" style={{ left: across(slots[aim]) }} />
      )}
      <div ref={fence} className="footer-shootout-fence">
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            aria-label={`${target.app} icon, number ${target.slot + 1}`}
            data-hit={target.hit || undefined}
            className="footer-shootout-target"
            style={{ left: across(slots[target.slot]) }}
            // Out of the Tab order and never focused, so the keyboard stays on the game.
            tabIndex={-1}
            onPointerDown={(event) => {
              event.preventDefault();
              if (phase === 'playing') shoot(target.slot);
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: a fourteen-pixel picture drawn on the page, with nothing for next/image to do */}
            <img src={pictures[target.app]} alt="" />
          </button>
        ))}
        {targets
          .filter((target) => target.hit)
          .map((target) => (
            <span
              key={target.id}
              aria-hidden
              className="footer-shootout-point font-mono text-sm"
              style={{ left: across(slots[target.slot]) }}
            >
              +{target.worth}
              {(target.streak ?? 0) >= 3 && (
                <span className="block text-xs font-normal">{target.streak} in a row</span>
              )}
            </span>
          ))}
      </div>
      {slots.map((at, slot) => {
        const kind = slot % 2 ? 'barrel' : 'crate';
        return (
          <div
            key={at}
            className="footer-shootout-prop footer-shootout-cover"
            style={{ ...size(sprites[kind], covers[kind]), left: across(at) }}
          />
        );
      })}
      <canvas ref={air} aria-hidden className="footer-shootout-air" />
      {cheering && phase === 'playing' && (
        <p aria-hidden className="footer-shootout-cheer font-mono text-sm">
          New best!
        </p>
      )}
      {phase !== 'playing' && (
        <div className="footer-shootout-panel flex flex-col items-center gap-3 font-mono text-sm">
          {phase === 'ready' && (
            <>
              <p>Thirty seconds. Hit every icon that comes up.</p>
              <p className="opacity-70">
                Six shots, then a reload. A miss breaks your run, and every fifth hit in a row
                counts double.
              </p>
              <p className="opacity-70">
                {touch ? 'Tap the icons.' : 'Click them, or aim with ← → and fire with Space.'}
                {record > 0 && ` Best ${record}.`}
              </p>
            </>
          )}
          {phase === 'paused' && (
            <p>
              Paused. {points(score)}, {left} seconds left.
            </p>
          )}
          {over && (
            <>
              <p>
                {points(over.score)} · {over.record ? 'New best!' : `Best ${over.best}`}
              </p>
              <p className="opacity-70">
                {over.hits} of {over.fired} shots hit. Longest run {over.longest}.
              </p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-x-4">
            <button
              ref={primary}
              type="button"
              onClick={phase === 'paused' ? () => setPhase('playing') : begin}
              className="footer-shootout-button"
            >
              {phase === 'ready' ? 'Start' : phase === 'paused' ? 'Carry on' : 'Play again'}
            </button>
            <button type="button" onClick={onDone} className="footer-shootout-button">
              Back to {leaving}
            </button>
            <button type="button" onClick={turnSound} className="footer-shootout-button">
              Sound: {noisy ? 'on' : 'off'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
