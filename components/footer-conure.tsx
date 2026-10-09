'use client';

import { useEffect, useRef } from 'react';

// The owner's own peach-fronted conure, a pixel at a time, drawn from photographs of it.
// Each pose is 24 wide and 20 tall, and each letter a colour: G the green of its body, D the darker
// green of its wing, H the deep green of its head and C the bluer green of its crown, P
// the orange-red patch over its beak, E the pale ring round its eye and K the eye, W its
// pale horn-coloured beak, T the olive of its throat, L the yellow-green of its belly, B
// the dark tips of its flight feathers, O its long green tail, F its grey feet. A dot is
// nothing. The tail is as long as the rest of the bird, which is why the picture is
// taller and wider than the body alone needs.
const poses: Record<string, string[]> = {
  perched: [
    '........................',
    '........................',
    '............CCP.........',
    '...........HEKPW........',
    '...........HHTTW........',
    '..........GGTTT.........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  // Head turned to look back over its shoulder.
  looking: [
    '........................',
    '........................',
    '..........PCC...........',
    '.........WPKEH..........',
    '.........WTTHH..........',
    '..........GGTTT.........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  // Neck stretched up, to look at something overhead.
  bobUp: [
    '........................',
    '............CCP.........',
    '...........HEKPW........',
    '...........HHTTW........',
    '...........GGTT.........',
    '..........GGTTT.........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  // Turned to face whoever is watching: both eyes, the beak between them and the
  // orange patch above. Then the same with its neck up and with its head down, which
  // is how it bobs.
  facing: [
    '........................',
    '........................',
    '...........HPPPH........',
    '...........EKWKE........',
    '...........HTWTH........',
    '..........GGTTT.........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  faceUp: [
    '........................',
    '...........HPPPH........',
    '...........EKWKE........',
    '...........HTWTH........',
    '...........GGTT.........',
    '..........GGTTT.........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  faceDown: [
    '........................',
    '........................',
    '........................',
    '...........HPPPH........',
    '...........EKWKE........',
    '..........GHTWTH........',
    '.........DGGLLT.........',
    '.........DDGLLL.........',
    '........DDDGLLL.........',
    '........DDDGLL..........',
    '.......BDDDGL...........',
    '.......ODDGF.F..........',
    '......OODD.F.F..........',
    '......OOD...............',
    '......OO................',
    '.....OO.................',
    '.....OO.................',
    '.....OO.................',
    '....OO..................',
    '....O...................',
  ],
  // Hung head-down from where it stands, feet still gripping, to look at whoever is
  // watching the wrong way up: the orange patch under the beak, the tail up behind. From
  // a photograph of it peering down off a curtain rail.
  hanging: [
    '........................',
    '........................',
    '........................',
    '....O...................',
    '....OO..................',
    '.....OO.................',
    '.....OO.................',
    '......OOD...............',
    '......ODDD..............',
    '.......BDDD.............',
    '........DDDG............',
    '........DDGF.F..........',
    '.........GGF.F..........',
    '.........GGLL...........',
    '.........GLLLL..........',
    '.........GLLLL..........',
    '.........TLLLT..........',
    '.........HTWTH..........',
    '.........EKWKE..........',
    '.........HPPPH..........',
  ],
  // Out of sight: gone down behind a letter.
  hidden: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  // Only its head and neck, for when it looks over the top of a letter it is behind: from
  // a photograph of it peering over a ledge with one eye. The rest of the bird is not
  // drawn, so none of it shows through the letter's openings. Then the same, turned to
  // face whoever is watching.
  peek: [
    '........................',
    '........................',
    '............CCP.........',
    '...........HEKPW........',
    '...........HHTTW........',
    '..........GGTTT.........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  peekFacing: [
    '........................',
    '........................',
    '...........HPPPH........',
    '...........EKWKE........',
    '...........HTWTH........',
    '..........GGTTT.........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  // Walking, the way a parrot crosses a floor: body level, head out in front, tail straight
  // out behind, like a small dinosaur. Two steps: legs apart, legs together.
  stride: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '..............HCCP......',
    '.............HHEKPW.....',
    '.OOOOOODDDGGGGTTTW......',
    '..OOOOBDDDGGLLLT........',
    '.......DDGGLLL..........',
    '..........F..F..........',
    '.........F....F.........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  strideClosed: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '..............HCCP......',
    '.............HHEKPW.....',
    '.OOOOOODDDGGGGTTTW......',
    '..OOOOBDDDGGLLLT........',
    '.......DDGGLLL..........',
    '...........FF...........',
    '...........F.F..........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  // Bent forward, beak down at what it is standing on, tail tipped up behind.
  pecking: [
    '........................',
    '........................',
    '........................',
    '....O...................',
    '....OO..................',
    '.....OO.................',
    '.....OO.................',
    '......ODGG..............',
    '......DDDGGG............',
    '......BDDGGLGG..........',
    '.......DGGLLTGG.........',
    '.........F.F.THCCP......',
    '.........F.F..TEKPW.....',
    '..................W.....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  // Flying, in three beats of the wing: up, level and down. The tail streams out behind,
  // Still bent forward, the beak lifted off with a piece in it: between bites.
  tugging: [
    '........................',
    '........................',
    '........................',
    '....O...................',
    '....OO..................',
    '.....OO.................',
    '.....OO.................',
    '......ODGG..............',
    '......DDDGGG............',
    '......BDDGGLGG..........',
    '.......DGGLLTGG.........',
    '.........F.F.THCCP......',
    '.........F.F..TEKPW.....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  // seven pixels of it, which is what the extra width of the picture is for.
  wingsUp: [
    '........DD..............',
    '.......DDDD.............',
    '......BDDDD.............',
    '.....BBDDDG.............',
    '.OOOOOODDGGGGGHCCP......',
    'OOOOOO..GGGLLLTEKPW.....',
    '........GGLLLLTT..W.....',
    '.........LLLL...........',
    '..........F.F...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  wingsMid: [
    '........................',
    '........................',
    '........................',
    '.......BDDDDD...........',
    '.OOOOOODDGGGGGHCCP......',
    'OOOOOO..GGGLLLTEKPW.....',
    '........GGLLLLTT..W.....',
    '.........LLLL...........',
    '..........F.F...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  wingsDown: [
    '........................',
    '........................',
    '........................',
    '........................',
    '.OOOOO..GGGGGGHCCP......',
    'OOOOOOOGGGGLLLTEKPW.....',
    '..OOOOODGGLLLLTT..W.....',
    '.......DDDLLL.F.........',
    '......BDDDD.............',
    '......BBDDD.............',
    '.......BDD..............',
    '........D...............',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
};

// The colours on a dark page and on a light one, each a little deeper on the light one so
// the bird holds against it.
const palettes = {
  dark: {
    G: '#5aa838',
    D: '#2f7d2c',
    H: '#3b8540',
    C: '#2f7a62',
    P: '#f26a3d',
    E: '#f1e9a6',
    K: '#16161a',
    W: '#ead9c8',
    T: '#7c8a3a',
    L: '#bccf3a',
    B: '#2b4a8c',
    O: '#4f9a30',
    F: '#8f8a86',
  },
  light: {
    G: '#3f8f2a',
    D: '#256a24',
    H: '#2c6b33',
    C: '#235f4c',
    P: '#e2552b',
    E: '#d9cf7c',
    K: '#16161a',
    W: '#cdb8a2',
    T: '#667330',
    L: '#96ab22',
    B: '#1f3a78',
    O: '#3b8022',
    F: '#6f6a66',
  },
};

// The picture's size in its own pixels.
const columns = 24;
const rows = 20;

// Where the bird can be: off either side of the picture, on the h of "thaw", on the
// ampersand, on the l of "floe", and on the floor between the ampersand and "floe".
type Stop = 'thaw' | 'sign' | 'floor' | 'floe';
type Place = Stop | 'left' | 'right';

// Standing on the middle of the ampersand its beak would come down past the bowl's
// shoulder, where the letter has already fallen away. This many of its pixels back, the
// beak is over the top of the bowl.
const chewFrom = -4;
// Where the beak's tip is in the pecking pose, in the picture's own pixels.
const beak = { column: 18.5, row: 13.5 };

// How far down, in its own pixels, the bird is when it has dropped right behind a letter.
const sunk = 12;
// Looking out of the opening in the ampersand's lower bowl, its chin on the opening's
// floor: this far lower and the whole head is behind the letter's bottom stroke.
const ducked = 5;
// The head is drawn 13 to 14 pixels across the picture and ends 6 down it.
const head = { column: 13.5, chin: 6 };

// What it does at each stop: a pose, how many seconds it holds it, and how many of its
// own pixels along from the stop it stands meanwhile. A fourth number is how many pixels
// down behind the letter it is, which is also what puts the letter in front of it. A
// fifth says it is not on the stop at all but looking out of the letter's lower bowl,
// and then the fourth is how far it has ducked below that opening's floor. Uneven on purpose, and different
// at each stop, so it reads as a bird with things on its mind and not as a loop. It
// only pecks where there is something under its beak: the upright of a letter is
// narrower than the bird, and pecking there would be pecking at air.
const routines: Record<
  Stop,
  [pose: string, seconds: number, along?: number, down?: number, from?: 'bowl'][]
> = {
  // On the h it sidles along the top a step at a time, the way they walk a perch, and
  // back again, then hangs off it head-down for a moment.
  thaw: [
    ['perched', 0.6],
    ['looking', 0.7],
    ['perched', 0.35],
    ['perched', 0.3, 1],
    ['perched', 0.45, 2],
    ['looking', 0.5, 2],
    ['perched', 0.3, 1],
    ['perched', 0.5],
    // Then over the edge to look at you upside down, and back up.
    ['hanging', 1.3],
    ['perched', 0.5],
  ],
  // The ampersand gets eaten. It hops back so its beak is over the top of the bowl,
  // then stays head down, biting and tugging; each bite takes a piece out of the letter
  // (see `bite` below). The pieces grow back when it has gone.
  // After eating it falls behind the letter and looks out of its lower bowl.
  sign: [
    ['perched', 0.5],
    ['looking', 0.6],
    ['perched', 0.4, chewFrom],
    ['pecking', 0.3, chewFrom],
    ['tugging', 0.16, chewFrom],
    ['pecking', 0.24, chewFrom],
    ['tugging', 0.16, chewFrom],
    ['pecking', 0.24, chewFrom],
    ['tugging', 0.16, chewFrom],
    ['pecking', 0.24, chewFrom],
    ['tugging', 0.3, chewFrom],
    ['perched', 0.5, chewFrom],
    // Then it loses its footing and drops down behind the letter. A second of nothing,
    // and its head comes up in the opening of the lower bowl: one eye first, then a look
    // straight out, and down again. It does not climb back up: it walks out along the
    // floor from behind the letter (see `legs`).
    ['perched', 0.3, chewFrom, sunk],
    ['hidden', 1, chewFrom, sunk],
    ['peek', 0.9, 0, 0, 'bowl'],
    ['peekFacing', 0.8, 0, 0, 'bowl'],
    ['peek', 0.5, 0, 0, 'bowl'],
    ['peek', 0.25, 0, ducked, 'bowl'],
    ['hidden', 0.35, 0, ducked, 'bowl'],
  ],
  // The floor is where the food is: mostly pecking, a hop along to the next crumb,
  // and a look round before it goes back up.
  floor: [
    ['perched', 0.4],
    ['pecking', 0.3],
    ['perched', 0.25],
    ['pecking', 0.3],
    ['perched', 0.5],
    ['pecking', 0.3, 2],
    ['perched', 0.25, 2],
    ['pecking', 0.3, 2],
    ['perched', 0.2, 2],
    ['pecking', 0.3, 2],
    ['perched', 0.4, 2],
    ['looking', 0.7, 2],
    ['perched', 0.4, 2],
  ],
  // Its last stop, and a little show before it goes: a look round, then it turns to
  // face you and bobs its head up and down.
  floe: [
    ['perched', 0.5],
    ['looking', 0.7],
    ['perched', 0.4],
    ['facing', 0.5],
    ['faceUp', 0.16],
    ['faceDown', 0.16],
    ['faceUp', 0.16],
    ['faceDown', 0.16],
    ['faceUp', 0.16],
    ['faceDown', 0.16],
    ['facing', 0.5],
    ['perched', 0.4],
  ],
};

// One visit, a leg at a time. A flight goes from one place to another in so many
// seconds, rising `over` body-lengths above the straight line on the way; a rest lasts
// as long as its routine; a walk crosses the floor on foot. Every move goes rightward,
// the way the bird is drawn facing.
type Leg =
  | { from: Place; to: Place; lasts: number; over: number }
  | { on: Stop; lasts: number }
  // Out from behind a letter and along the floor to the next stop, on foot.
  | { walk: Stop; to: Stop; lasts: number };
const rest = (on: Stop): Leg => ({
  on,
  lasts: routines[on].reduce((sum, [, seconds]) => sum + seconds, 0),
});
const legs: Leg[] = [
  { from: 'left', to: 'thaw', lasts: 3.6, over: 0 },
  rest('thaw'),
  { from: 'thaw', to: 'sign', lasts: 1.1, over: 0.5 },
  rest('sign'),
  // No flight to the floor: it comes out from behind the ampersand and struts there.
  { walk: 'sign', to: 'floor', lasts: 2.4 },
  rest('floor'),
  { from: 'floor', to: 'floe', lasts: 0.9, over: 0.3 },
  rest('floe'),
  { from: 'floe', to: 'right', lasts: 3.2, over: 0 },
];
// Then it stays away a while before the next visit.
const away = 6;
const visit = legs.reduce((sum, leg) => sum + leg.lasts, away);
// A hop along the floor takes this long.
const hop = 0.22;
// With its wings out the bird is drawn with its feet this many pixels higher than when
// it stands, so in flight it is set that much lower: it takes off and lands on its feet.
const tucked = 4;

// One beat of the wings, passing through level on the way up and on the way down.
const wingbeat = ['wingsUp', 'wingsMid', 'wingsDown', 'wingsMid'];

/**
 * A conure that visits the wordmark at the foot of the page: it flies in from the
 * left, lands on "thaw", flies across to the ampersand, drops to the floor to eat,
 * goes up onto "floe", then flies off to the right. With reduced motion it simply
 * sits on the ampersand.
 */
export function FooterConure() {
  const birdRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bird = birdRef.current;
    const context = bird?.getContext('2d');
    const stage = bird?.parentElement;
    if (!bird || !context || !stage) return;

    let frame = 0;
    let visible = false;
    let shown = '';

    // Draws one pose, a pixel per cell. The canvas is 24 pixels by 20 and is
    // scaled up by CSS with hard edges, so the bird stays crisp at any size.
    function show(next: string, force = false) {
      if (!context || (next === shown && !force)) return;
      shown = next;
      const palette = document.documentElement.classList.contains('dark')
        ? palettes.dark
        : palettes.light;
      context.clearRect(0, 0, columns, rows);
      poses[next].forEach((line, row) => {
        [...line].forEach((mark, column) => {
          if (mark === '.') return;
          context.fillStyle = palette[mark as keyof typeof palette];
          context.fillRect(column, row, 1, 1);
        });
      });
    }

    show('perched');
    const themed = new MutationObserver(() => show(shown, true));
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => themed.disconnect();
    }

    // The visit is timed from when the footer comes into view, not from when the page
    // loaded: otherwise the first thing seen is the bird part-way through, already hopped
    // off the ampersand or half out of the picture.
    let started = 0;

    // Where the visitor's pointer is in the window while it is over the footer, and where
    // the bird was last put. A bird that is touched takes off from where it
    // is: `fled` is when, and from where.
    let pointer: { x: number; y: number } | null = null;
    let at = { x: 0, y: 0 };
    let fled: { when: number; x: number; y: number } | null = null;
    // What the routine last had it doing, how many bites it has taken of the ampersand
    // this visit, and whether any are waiting to be mended.
    let routinePose = '';
    let bites = 0;
    let eaten = false;
    // How long the getaway takes, in seconds.
    const getaway = 2;

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (!visible || !bird || !stage) return;
      const width = stage.clientWidth;
      const body = bird.clientWidth;
      const pixel = body / columns;
      // What the wordmark measured, read from where it wrote it. Until it has, a guess
      // at the same thing as a share of the width.
      const measured = (name: string, guess: number) => {
        const value = Number.parseFloat(stage.style.getPropertyValue(name));
        return Number.isFinite(value) ? value : guess;
      };
      // Where the bird's corner goes for it to stand at a place. Nought down is the
      // tops of the tall letters, where the stylesheet already puts it.
      const place = (name: Place) => {
        if (name === 'left') return { x: -body, y: -body * 0.7 };
        if (name === 'right') return { x: width + body, y: -body };
        if (name === 'thaw') return { x: measured('--perch-thaw', width * 0.11) - body / 2, y: 0 };
        if (name === 'floe') return { x: measured('--perch-floe', width * 0.75) - body / 2, y: 0 };
        if (name === 'floor') {
          const x = measured('--floor-x', width * 0.63) - body / 2;
          return { x, y: measured('--floor-drop', body * 2.3) };
        }
        return { x: measured('--perch-x', width / 2) - body / 2, y: 0 };
      };
      // It leaves a stop from wherever its routine left it standing.
      const leaving = (name: Place) => {
        const spot = place(name);
        if (name === 'left' || name === 'right') return spot;
        return { x: spot.x + (routines[name].at(-1)?.[2] ?? 0) * pixel, y: spot.y };
      };

      if (fled) {
        delete stage.dataset.conureBehind;
        const part = (now - fled.when) / 1000 / getaway;
        if (part < 1) {
          // Up and away to the right, gathering speed, from wherever it was touched.
          const to = place('right');
          const flown = part ** 2;
          show(wingbeat[Math.floor(now / 80) % wingbeat.length]);
          at = {
            x: fled.x + (to.x - fled.x) * flown,
            y: fled.y + (to.y - fled.y) * flown + tucked * pixel * (1 - part),
          };
          bird.style.translate = `${at.x}px ${at.y}px`;
          return;
        }
        // Gone: the visit picks up at the point where it stays away for a while.
        started = now - (visit - away) * 1000;
        fled = null;
      }

      // A frame's own time can be a hair earlier than the moment the footer was seen, on a
      // page short enough to show it at once: never let the visit start before nought.
      let time = (Math.max(0, now - started) / 1000) % visit;
      const leg = legs.find((each) => {
        if (time < each.lasts) return true;
        time -= each.lasts;
        return false;
      });
      // Away: parked out of the picture, to the right.
      let { x, y } = place('right');
      // Once it has gone, what it ate grows back for the next visit.
      if (!leg && eaten) {
        stage.dispatchEvent(new CustomEvent('conure:mend'));
        eaten = false;
        bites = 0;
      }

      if (leg && 'on' in leg) {
        const spot = place(leg.on);
        let before = 0;
        let sunkBefore = 0;
        let pose = 'perched';
        let along = 0;
        let lowered = 0;
        let inBowl = false;
        let into = time;
        for (const [next, seconds, step = 0, down = 0, from] of routines[leg.on]) {
          pose = next;
          // Arriving in the bowl it starts out of sight below the opening's floor.
          if (from === 'bowl' && !inBowl) sunkBefore = ducked;
          inBowl = from === 'bowl';
          // Where it stands changes with a short hop at the start of the beat.
          const hopped = Math.min(1, into / hop);
          along = before + (step - before) * hopped;
          // As high as it is far: a sidestep barely leaves the perch, a hop clears it.
          y = spot.y - Math.sin(hopped * Math.PI) * pixel * Math.min(2, Math.abs(step - before));
          // Going down behind the letter it falls, gathering speed; coming up it slows
          // as it arrives. Either takes a quarter of a second, or the beat if that is less.
          const moved = Math.min(1, into / Math.min(seconds, 0.25));
          const eased = down > sunkBefore ? moved ** 2 : 1 - (1 - moved) ** 2;
          lowered = sunkBefore + (down - sunkBefore) * eased;
          if (into < seconds) break;
          into -= seconds;
          before = step;
          sunkBefore = down;
        }
        x = spot.x + along * pixel;
        y += lowered * pixel;
        if (inBowl) {
          // Its head in the middle of the opening and its chin on the opening's floor,
          // as the wordmark measured them, or about there until it has.
          const top = measured('--perch-y', 0);
          x = measured('--peek-x', spot.x + body / 2) - head.column * pixel;
          y = measured('--peek-y', top + body * 1.5) - top + (13 - head.chin + lowered) * pixel;
        }
        // While any of it is below the letter's top, the letter is drawn over it: the
        // wordmark keeps a copy of the letter for this, in front of the bird.
        const behind = lowered > 0 || pose === 'hidden' || pose === 'peek' || pose === 'peekFacing';
        if (behind !== (stage.dataset.conureBehind === 'true')) {
          if (behind) stage.dataset.conureBehind = 'true';
          else delete stage.dataset.conureBehind;
        }
        // Each time the beak comes down on the ampersand, the wordmark is told where, and
        // takes a piece out of the letter there: a little deeper and to one side each time.
        if (leg.on === 'sign' && pose === 'pecking' && routinePose !== 'pecking') {
          const box = stage.getBoundingClientRect();
          const top = Number.parseFloat(stage.style.getPropertyValue('--perch-y')) || 0;
          stage.dispatchEvent(
            new CustomEvent('conure:bite', {
              detail: {
                x: box.left + x + (beak.column + (bites % 2 ? -0.7 : 0.7)) * pixel,
                y: box.top + top + (0.6 + bites * 0.8) * pixel,
                radius: pixel * 1.9,
              },
            }),
          );
          bites++;
          eaten = true;
        }
        routinePose = pose;
        // A pointer close by gets looked at, whatever the bird was doing: back over its
        // shoulder if it is behind, neck up if it is overhead, and straight at it otherwise.
        // Measured only while a pointer is over the footer, so nothing is read otherwise.
        if (pointer && !behind) {
          const box = bird.getBoundingClientRect();
          const head = { x: box.left + box.width * 0.6, y: box.top + pixel * 3 };
          if (Math.hypot(pointer.x - head.x, pointer.y - head.y) < body * 2.2) {
            const above = pointer.y < box.top - pixel;
            pose = above ? 'bobUp' : pointer.x < head.x - pixel * 3 ? 'looking' : 'perched';
          }
        }
        show(pose);
      } else if (leg && 'walk' in leg) {
        // It starts behind the letter, under the bowl it was looking out of, and walks to
        // the stop on the floor line: level, a step every so often, a small bob to each.
        // The letter stays in front of it until it has walked clear.
        stage.dataset.conureBehind = 'true';
        const end = place(leg.to);
        const start = {
          x: measured('--peek-x', place(leg.walk).x + body / 2) - head.column * pixel,
          y: end.y,
        };
        const part = time / leg.lasts;
        const steps = Math.floor(time / 0.16);
        x = start.x + (end.x - start.x) * part;
        y = end.y - Math.abs(Math.sin((time / 0.16) * Math.PI)) * pixel * 0.6;
        show(steps % 2 ? 'strideClosed' : 'stride');
      } else if (leg) {
        const from = leaving(leg.from);
        const to = place(leg.to);
        const part = time / leg.lasts;
        // Coming in it slows towards the perch, going off it gathers speed, and between
        // two stops it does both.
        let eased = part * part * (3 - 2 * part);
        // The long flights bob with each wingbeat, less the nearer the bird is to a perch.
        let bob = 0;
        if (leg.from === 'left') {
          eased = 1 - (1 - part) ** 2;
          bob = 1 - eased;
        } else if (leg.to === 'right') {
          eased = part ** 2;
          bob = Math.min(1, part * 4);
        }
        x = from.x + (to.x - from.x) * eased;
        y =
          from.y +
          (to.y - from.y) * eased -
          Math.sin(part * Math.PI) * body * leg.over +
          Math.sin(time * 9) * pixel * bob +
          tucked * pixel;
        show(wingbeat[Math.floor(time * 12) % wingbeat.length]);
      }
      at = { x, y };
      bird.style.translate = `${x}px ${y}px`;
    }

    // The bird itself takes no clicks, so the pictures behind it stay reachable; the
    // footer listens for it.
    function onPointerMove(event: PointerEvent) {
      pointer = { x: event.clientX, y: event.clientY };
    }
    function onPointerLeave() {
      pointer = null;
    }
    function onPointerDown(event: PointerEvent) {
      if (!bird || fled) return;
      const box = bird.getBoundingClientRect();
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      if (inside) fled = { when: performance.now(), ...at };
    }
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerleave', onPointerLeave);
    stage.addEventListener('pointerdown', onPointerDown);

    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) started = performance.now();
      visible = entry.isIntersecting;
    });
    seen.observe(stage);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      themed.disconnect();
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
      stage.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={birdRef}
      width={columns}
      height={rows}
      aria-hidden
      className="footer-conure pointer-events-none absolute top-0 left-0"
    />
  );
}
