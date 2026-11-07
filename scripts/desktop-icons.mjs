// Writes components/desktop/icons.ts: the demo's small icons, each under 2 KB, as data
// URLs inside the demo's own code. As files they were 34 requests every time the demo loaded.
// Run after changing a file in public/desktop/system, public/desktop/thaw/items or the
// .png files directly in public/desktop/thaw.
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sources = [
  ['system', 'public/desktop/system', '.webp'],
  ['items', 'public/desktop/thaw/items', '.webp'],
  ['glyphs', 'public/desktop/thaw', '.png'],
];
const types = { '.webp': 'image/webp', '.png': 'image/png' };

let out =
  '// Written by scripts/desktop-icons.mjs from the files in public/desktop. Do not edit.\n';
for (const [name, dir, ext] of sources) {
  const files = (await readdir(path.join(root, dir))).filter((file) => file.endsWith(ext)).sort();
  out += `\nexport const ${name}: Record<string, string> = {\n`;
  for (const file of files) {
    const data = (await readFile(path.join(root, dir, file))).toString('base64');
    out += `  '${path.basename(file, ext)}': 'data:${types[ext]};base64,${data}',\n`;
  }
  out += '};\n';
}
const target = path.join(root, 'components/desktop/icons.ts');
await writeFile(target, out);
execFileSync(path.join(root, 'node_modules/.bin/biome'), ['format', '--write', target]);
console.log('wrote components/desktop/icons.ts');
