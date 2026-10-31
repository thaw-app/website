// The desert behind the shooting gallery, painted once in the game's own pixels: a sky and
// a low sun, a mesa and a ridge far off, one saguaro by the bird, a rail along the range,
// and the ground. Everything here is opaque and in a palette of its own for each theme, so
// depth comes from colour and overlap. The bird, the icons, and the crates and barrels they
// come up from behind are drawn on the page, in front of this.

type Theme = 'light' | 'dark';

const palettes = {
  light: {
    sky: '#f3e7d3',
    haze: '#efdcc2',
    sun: '#eab35e',
    core: '#f3cd87',
    mesa: '#dcbb9b',
    shade: '#d2ad8c',
    ridge: '#c99f7b',
    cactus: '#5f8a4f',
    rib: '#7aa265',
    rail: '#7d5a3a',
    top: '#b0845a',
    earth: '#946a45',
    patch: '#865e3b',
    stone: '#bda381',
    contact: '#6b4a2e',
  },
  dark: {
    sky: '#0d0b0a',
    haze: '#17110e',
    sun: '#b56f26',
    core: '#d9923a',
    mesa: '#2a1e18',
    shade: '#231914',
    ridge: '#35261d',
    cactus: '#2f5a32',
    rib: '#417343',
    rail: '#4a3423',
    top: '#684a30',
    earth: '#463020',
    patch: '#3a281b',
    stone: '#6e5742',
    contact: '#21160e',
  },
} satisfies Record<Theme, Record<string, string>>;

// A crate and a barrel, each as tall as the other and wide enough to hide the icon that
// comes up behind it. k is dark wood and w light, l where a barrel catches the light, and h
// its iron hoops.
export const covers = {
  crate: [
    'kkkkkkkkkkkkkkkk',
    'kwwwwwwwwwwwwwwk',
    'kwkwwwwwwwwwwkwk',
    'kwwkkwwwwwwkkwwk',
    'kwwwwkkwwkkwwwwk',
    'kwwwwwwkkwwwwwwk',
    'kwwwwwwkkwwwwwwk',
    'kwwwwkkwwkkwwwwk',
    'kwwkkwwwwwwkkwwk',
    'kwkwwwwwwwwwwkwk',
    'kwwwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkkkk',
  ],
  barrel: [
    '...kkkkkkkk...',
    '..kwwwwwwwwk..',
    '.hhhhhhhhhhhh.',
    '.kwlwwwwwwwwk.',
    'kwwlwwwwwwwwwk',
    'kwwlwwwwwwwwwk',
    'kwwlwwwwwwwwwk',
    'kwwlwwwwwwwwwk',
    '.kwlwwwwwwwwk.',
    '.hhhhhhhhhhhh.',
    '..kwwwwwwwwk..',
    '...kkkkkkkk...',
  ],
};
export const coverColours: Record<Theme, Record<string, string>> = {
  light: { k: '#5e3d22', w: '#a8743f', l: '#c48a52', h: '#6b6f76' },
  dark: { k: '#2e1d10', w: '#70492a', l: '#8a6038', h: '#4a4e55' },
};

// The tumbleweed that rolls through while the bird gets ready.
export const tumbleweed = [
  '...tt.t...',
  '.t.tttt.t.',
  '.ttt..ttt.',
  'tt.t.tt.tt',
  't.tt.t.tt.',
  '.tt.t.tt.t',
  'tt.tt.t.tt',
  '.ttt..ttt.',
  '.t.tttt.t.',
  '...t.tt...',
];
export const tumbleweedColours: Record<Theme, Record<string, string>> = {
  light: { t: '#8a6a3f' },
  dark: { t: '#8f7350' },
};

// A picture drawn once from rows of letters, each letter a colour and a dot nothing.
export function picture(lines: string[], palette: Record<string, string>) {
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

// The far mesa's outline, across and up as shares of its width and of the height it is
// given. Flat tops and steep sides, with its sunlit faces to the left and shaded to the right.
const skyline = [
  [0, 0.42],
  [0.05, 0.42],
  [0.09, 0.86],
  [0.27, 0.9],
  [0.32, 0.52],
  [0.41, 0.46],
  [0.45, 0.66],
  [0.6, 0.68],
  [0.65, 0.36],
  [0.76, 0.3],
  [0.8, 1],
  [0.94, 1],
  [1, 0.5],
];
function skylineAt(across: number) {
  const after = skyline.findIndex(([x]) => x >= across);
  if (after <= 0) return { up: skyline[0][1], falling: false };
  const [fromX, fromUp] = skyline[after - 1];
  const [toX, toUp] = skyline[after];
  return {
    up: fromUp + ((toUp - fromUp) * (across - fromX)) / (toX - fromX),
    falling: toUp < fromUp - 0.1,
  };
}

// The same stones and shadows each time: a fixed run of numbers, not Math.random.
function numbers() {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

// How high the ground comes at the bird's patch, in the game's pixels: the stylesheet
// stands it on this.
const patch = 3;

/**
 * Paints the scene at the size the stage is now, one canvas pixel to one of the game's.
 * `floor` is how many pixels up the ground is, `lanes` where the icons come up as shares of
 * the width, and `bird` the column the bird's picture starts on. A narrow stage has its
 * mesa drawn wider than it is and cropped at both sides.
 */
export function paintScene(
  canvas: HTMLCanvasElement,
  scene: {
    theme: Theme;
    width: number;
    height: number;
    floor: number;
    lanes: number[];
    bird: number;
    narrow: boolean;
  },
) {
  const { theme, width, height, floor, lanes, bird, narrow } = scene;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;
  const colours = palettes[theme];
  const rect = (colour: string, column: number, up: number, across: number, tall: number) => {
    context.fillStyle = colour;
    context.fillRect(column, height - up - tall, across, tall);
  };
  const horizon = floor;

  // The sky, a shade warmer towards the horizon, in plain steps.
  rect(colours.sky, 0, 0, width, height);
  rect(colours.haze, 0, horizon, width, 34);

  const span = narrow ? width * 2 : width;
  const start = narrow ? width * 0.26 : 0;
  const tall = Math.round(Math.min(height - floor - 18, narrow ? 40 : 52));

  // The sun, low, going down into the notch in the mesa over the open middle.
  const notch = 0.37;
  const sunX = Math.round(notch * span - start);
  const sunUp = horizon + Math.round(skylineAt(notch).up * tall) + 3;
  for (let row = -8; row <= 8; row++) {
    const half = Math.round(Math.sqrt(72 - row * row));
    rect(colours.sun, sunX - half, sunUp + row, half * 2 + 1, 1);
    if (Math.abs(row) > 5) continue;
    const inner = Math.round(Math.sqrt(30 - row * row));
    rect(colours.core, sunX - inner, sunUp + row, inner * 2 + 1, 1);
  }

  // The mesa, and a lower ridge in front of it.
  for (let column = 0; column < width; column++) {
    const { up, falling } = skylineAt((column + start) / span);
    rect(falling ? colours.shade : colours.mesa, column, horizon, 1, Math.round(up * tall));
    const low =
      7 + 2.5 * Math.sin((column + start) * 0.045) + 1.5 * Math.sin((column + start) * 0.13);
    rect(colours.ridge, column, horizon, 1, Math.round(low));
  }

  // The saguaro by the bird, tall and on its own, with the open ground in front of it.
  const trunk = bird + 1;
  const cactus = (column: number, up: number, across: number, high: number) =>
    rect(colours.cactus, trunk + column, horizon + up, across, high);
  cactus(0, 0, 6, 34);
  cactus(1, 34, 4, 1);
  cactus(-5, 12, 5, 3);
  cactus(-6, 12, 3, 13);
  cactus(6, 18, 5, 3);
  cactus(8, 18, 3, 11);
  rect(colours.rib, trunk + 2, horizon, 1, 33);
  rect(colours.rib, trunk + 4, horizon, 1, 30);

  // The rail the range stands along, which makes one thing of its crates and barrels.
  const first = Math.round(lanes[0] * width) - 13;
  const last = Math.round((lanes.at(-1) ?? 1) * width) + 13;
  rect(colours.rail, first, horizon + 7, last - first, 2);
  rect(colours.rail, first, horizon + 3, last - first, 1);
  for (const column of [first, last - 2]) rect(colours.rail, column, horizon, 2, 11);

  // The ground: a band of earth with an edge that is not quite straight, rising to the
  // patch the bird stands on, and little on it.
  const next = numbers();
  const middle = bird + 12;
  let rise = 0;
  for (let column = 0; column < width; column++) {
    if (next() < 0.12) rise = next() < 0.5 ? 0 : 1;
    const away = Math.abs(column - middle) / 16;
    const mound = away < 1 ? Math.round(patch * Math.cos((away * Math.PI) / 2) ** 0.6) : 0;
    const top = floor + Math.max(rise, mound);
    rect(colours.earth, column, 0, 1, top);
    rect(colours.top, column, top - 1, 1, 1);
  }
  for (let column = 3; column < width; column += 9 + Math.floor(next() * 22)) {
    const up = 1 + Math.floor(next() * (floor - 4));
    if (next() < 0.35) rect(colours.stone, column, up, 2, 1);
    else rect(colours.patch, column, up, 3 + Math.floor(next() * 6), 1);
  }

  // A shadow where each thing meets the ground.
  rect(colours.contact, bird + 8, floor + patch - 2, 10, 1);
  rect(colours.contact, trunk - 1, floor - 1, 8, 1);
  lanes.forEach((lane, slot) => {
    const half = slot % 2 ? 7 : 8;
    rect(colours.contact, Math.round(lane * width) - half - 1, floor - 1, half * 2 + 2, 1);
  });
}
