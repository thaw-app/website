// Draws the world as a grid of dots, each belonging to the country it falls in, for the
// map on the community page. Run by hand when the grid should change:
//   node scripts/build-world-map.mjs
// It reads scripts/data/countries-110m.json (world-atlas, from Natural Earth, public
// domain) and writes lib/world-map.json. Nothing here runs when the site is built.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const atlas = JSON.parse(readFileSync(join(root, 'scripts/data/countries-110m.json'), 'utf8'));

// Degrees between dots, and the band of latitude drawn: below it is only Antarctica.
const step = 1.8;
const north = 80;
const south = -56;

// The atlas names countries; the site counts by two-letter code.
const codes = new Map();
{
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      if (Intl.getCanonicalLocales(`und-${code}`)[0] !== `und-${code}`) continue;
      const name = names.of(code);
      if (name && name !== code) codes.set(name, code);
    }
  }
}
// Where the atlas abbreviates, or uses an older name.
const renamed = {
  'W. Sahara': 'EH',
  'United States of America': 'US',
  'Dem. Rep. Congo': 'CD',
  'Dominican Rep.': 'DO',
  'Falkland Is.': 'FK',
  'Fr. S. Antarctic Lands': 'TF',
  "Côte d'Ivoire": 'CI',
  'Central African Rep.': 'CF',
  Congo: 'CG',
  'Eq. Guinea': 'GQ',
  Palestine: 'PS',
  Myanmar: 'MM',
  Turkey: 'TR',
  'Solomon Is.': 'SB',
  'Bosnia and Herz.': 'BA',
  Macedonia: 'MK',
  'Trinidad and Tobago': 'TT',
  'S. Sudan': 'SS',
};
// Places too small for an outline this coarse, which still have people in them.
const specks = {
  SG: [103.8, 1.35],
  HK: [114.17, 22.3],
  MO: [113.55, 22.2],
  MT: [14.4, 35.9],
  BH: [50.55, 26.07],
  MU: [57.55, -20.3],
  RE: [55.5, -21.1],
};

// TopoJSON keeps each border once, as steps from point to point; put the rings back.
const { scale, translate } = atlas.transform;
const arcs = atlas.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
const ring = (indexes) =>
  indexes.flatMap((index) => (index < 0 ? [...arcs[~index]].reverse() : arcs[index]));

function inside([x, y], points) {
  let within = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) within = !within;
  }
  return within;
}

// An outline that crosses the date line (Russia's far east, Fiji) jumps from one edge of
// the map to the other, and tested as it stands would claim a band of dots right across.
// Such a one is tested with its western half moved round to follow the eastern.
const round = (x) => (x < 0 ? x + 360 : x);
function within(point, points) {
  const across = points.map(([x]) => x);
  if (Math.max(...across) - Math.min(...across) < 180) return inside(point, points);
  return inside(
    [round(point[0]), point[1]],
    points.map(([x, y]) => [round(x), y]),
  );
}

const countries = atlas.objects.countries.geometries.map((geometry) => {
  const polygons = (geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs).map((rings) =>
    rings.map(ring),
  );
  const all = polygons.flat(2);
  return {
    code: renamed[geometry.properties.name] ?? codes.get(geometry.properties.name) ?? '',
    polygons,
    box: [
      Math.min(...all.map(([x]) => x)),
      Math.min(...all.map(([, y]) => y)),
      Math.max(...all.map(([x]) => x)),
      Math.max(...all.map(([, y]) => y)),
    ],
  };
});

const columns = Math.round(360 / step);
const rows = Math.round((north - south) / step);
/** A place on the grid as the picture's own coordinates, one unit per dot. */
const cell = (lon, lat) => [
  Math.round((lon + 180) / step - 0.5),
  Math.round((north - lat) / step - 0.5),
];

const dots = {};
const add = (code, column, row) => {
  dots[code] ??= [];
  dots[code].push([column, row]);
};
for (let row = 0; row < rows; row++) {
  for (let column = 0; column < columns; column++) {
    const point = [-180 + (column + 0.5) * step, north - (row + 0.5) * step];
    const country = countries.find(
      ({ box, polygons }) =>
        point[1] >= box[1] &&
        point[1] <= box[3] &&
        (box[2] - box[0] > 180 || (point[0] >= box[0] && point[0] <= box[2])) &&
        polygons.some(
          ([outer, ...holes]) => within(point, outer) && !holes.some((hole) => within(point, hole)),
        ),
    );
    if (country) add(country.code, column, row);
  }
}
// A country the grid stepped over still gets one dot, in the middle of its own outline.
for (const { code, box } of countries) {
  if (code && !dots[code]) add(code, ...cell((box[0] + box[2]) / 2, (box[1] + box[3]) / 2));
}
for (const [code, [lon, lat]] of Object.entries(specks)) {
  if (!dots[code]) add(code, ...cell(lon, lat));
}

writeFileSync(join(root, 'lib/world-map.json'), `${JSON.stringify({ columns, rows, dots })}\n`);
const total = Object.values(dots).reduce((sum, list) => sum + list.length, 0);
console.log(`${total} dots in ${Object.keys(dots).length} countries, ${columns} by ${rows}.`);
