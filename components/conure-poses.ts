// The owner's own peach-fronted conure, a pixel at a time, drawn from photographs of it.
// Each pose is 24 wide and 20 tall, and each letter a colour: G the green of its body, D the darker
// green of its wing, H the deep green of its head and C the bluer green of its crown, P
// the orange-red patch over its beak, E the pale ring round its eye and K the eye, W its
// pale horn-coloured beak, T the olive of its throat, L the yellow-green of its belly, B
// the dark tips of its flight feathers, O its long green tail, F its grey feet. A dot is
// nothing. The tail is as long as the rest of the bird, which is why the picture is
// taller and wider than the body alone needs.
export const poses: Record<string, string[]> = {
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
  // Flying, in three beats of the wing: up, level and down. The tail streams out behind,
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

// On some visits it wears a hat, one picked when the page loads: a sheriff's with a star
// on its chest, an outlaw's with a bandana over its throat, or a bolero with a red bow at
// the throat. Each hat is three rows, its brim on the crown,
// and the letters are its own colours: h the crown, n the band, s the brim.
type Hat = 'sheriff' | 'outlaw' | 'bolero';
const hats: Record<Hat, string[]> = {
  sheriff: ['..hhh..', 'h.nnn.h', '.sssss.'],
  outlaw: ['..hhh..', 'h.nnn.h', '.sssss.'],
  bolero: ['....hhh....', '...hhhhh...', 'sssssssssss'],
};
// Y the sheriff's star, R the red of a bandana or a bow and r its knot. The outlaw's
// black hat is charcoal on a dark page, so it does not vanish into it.
const wear: Record<Hat, Record<'dark' | 'light', Record<string, string>>> = {
  sheriff: {
    dark: { h: '#c8955a', s: '#9c6c3a', n: '#5a3a1f', Y: '#f2c230' },
    light: { h: '#c8955a', s: '#9c6c3a', n: '#5a3a1f', Y: '#f2c230' },
  },
  outlaw: {
    dark: { h: '#3d3836', s: '#2a2624', n: '#8a7a6e', R: '#c8323a', r: '#9a2430' },
    light: { h: '#2a2624', s: '#1a1716', n: '#8a7a6e', R: '#c8323a', r: '#9a2430' },
  },
  bolero: {
    dark: { h: '#c8955a', s: '#a87840', R: '#c8323a' },
    light: { h: '#c8955a', s: '#a87840', R: '#c8323a' },
  },
};
// Head down, or upside down, the hat would sit over its face, so it is not drawn.
const bareheaded = new Set(['pecking', 'tugging', 'hanging']);

// Two visits in three it wears nothing. `?conure-hat=sheriff` and the like puts one on.
function pickHat(): Hat | null {
  if (typeof window === 'undefined') return null;
  const asked = new URLSearchParams(window.location.search).get('conure-hat');
  if (asked && asked in hats) return asked as Hat;
  if (Math.random() < 2 / 3) return null;
  const all = Object.keys(hats) as Hat[];
  return all[Math.floor(Math.random() * all.length)];
}
export const hat = pickHat();

// Room above the poses for a hat, in rows.
const headroom = 2;
// The picture's size in its own pixels: the poses, and the room above them.
export const columns = 24;
export const rows = 20 + headroom;

// Each pose as it is drawn, hat and all, worked out the first time it is needed.
const dressed = new Map<string, string[][]>();
function dress(pose: string) {
  let grid = dressed.get(pose);
  if (grid) return grid;
  grid = [...Array(headroom)].map(() => [...'.'.repeat(columns)]);
  grid.push(...poses[pose].map((line) => [...line]));
  if (hat && !bareheaded.has(pose)) put(grid, hat);
  dressed.set(pose, grid);
  return grid;
}

function put(grid: string[][], on: Hat) {
  const find = (mark: string) =>
    grid.flatMap((line, row) =>
      line.flatMap((each, column) => (each === mark ? [{ column, row }] : [])),
    );
  const throat = find('T');
  if (on === 'sheriff') {
    // The star on its chest, beside the top of the yellow belly.
    const belly = find('L')[0];
    if (belly) grid[belly.row + 1][belly.column - 1] = 'Y';
  } else if (on === 'outlaw') {
    // The bandana over the whole throat, with its point hanging below the middle.
    for (const { column, row } of throat) grid[row][column] = 'R';
    const low = Math.max(...throat.map(({ row }) => row));
    const along = throat.filter(({ row }) => row === low).map(({ column }) => column);
    const middle = Math.round(along.reduce((sum, each) => sum + each, 0) / along.length);
    if (throat.length && grid[low + 1][middle] !== '.') grid[low + 1][middle] = 'r';
  } else if (throat.length) {
    // The bow at the bottom of the throat, two pixels wide.
    const { column, row } = throat.reduce((last, each) =>
      each.row > last.row || (each.row === last.row && each.column < last.column) ? each : last,
    );
    grid[row][column] = 'R';
    if (grid[row][column + 1] !== '.') grid[row][column + 1] = 'R';
  }
  // The hat goes on the crown, or on the orange patch over the beak where it faces you.
  const crown = find('C');
  const top = crown.length ? crown : find('P');
  if (!top.length) return;
  const row = top[0].row;
  const along = top.filter((each) => each.row === row).map(({ column }) => column);
  const middle = Math.round(along.reduce((sum, each) => sum + each, 0) / along.length);
  hats[on].forEach((line, step) => {
    [...line].forEach((mark, offset) => {
      const y = row - hats[on].length + 1 + step;
      const x = middle - Math.floor(line.length / 2) + offset;
      if (mark !== '.' && y >= 0 && x >= 0 && x < columns) grid[y][x] = mark;
    });
  });
}

/**
 * Draws one pose, a pixel per cell, with its hat if it has one. The canvas is 24 pixels by
 * 22 and is scaled up by CSS with hard edges, so the bird stays crisp at any size.
 */
export function drawPose(context: CanvasRenderingContext2D, pose: string) {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const palette: Record<string, string> = { ...palettes[theme], ...(hat ? wear[hat][theme] : {}) };
  context.clearRect(0, 0, columns, rows);
  dress(pose).forEach((line, row) => {
    line.forEach((mark, column) => {
      if (mark === '.') return;
      context.fillStyle = palette[mark];
      context.fillRect(column, row, 1, 1);
    });
  });
}

/** Whether a click or a tap landed on the bird, which takes none itself so what is behind it stays reachable. */
export function touches(event: PointerEvent, bird: HTMLCanvasElement) {
  const box = bird.getBoundingClientRect();
  return (
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom
  );
}
