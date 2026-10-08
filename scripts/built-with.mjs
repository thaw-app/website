// Lists the packages Thaw, Floe and this site depend on, for the Built with page: each one
// once, with its licence and which of the three use it. Run at the end of the sync. A list
// that cannot be read keeps its last copy, so the page never loses one to a rate limit.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'lib', 'built-with.json');

// Where each app keeps its manifests. Floe has three kinds: Swift for the app, JavaScript
// for the runtime its extensions run in, and Rust for the calculator.
const apps = {
  Thaw: {
    repo: 'thaw-app/Thaw',
    ref: process.env.THAW_DOCS_REF || 'development',
    swift: 'Thaw.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved',
  },
  Floe: {
    repo: 'thaw-app/Floe',
    ref: process.env.FLOE_DOCS_REF || 'main',
    swift: 'Package.resolved',
    javascript: 'runtime/package.json',
    rust: 'Vendor/FendCore/rust/Cargo.toml',
  },
};

// Licences GitHub cannot name from the file, read from each repository's own LICENSE.
const licenses = {
  'sparkle-project/Sparkle': 'MIT, with others for bundled code',
  'swiftlang/swift-cmark': 'BSD-2-Clause',
};

const raw = async ({ repo, ref }, path) => {
  const response = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`);
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path}`);
  return response.text();
};

/** Adds one use of a package to a list, or a second user to one already on it. */
function note(list, { name, url, version, license }, user) {
  const entry = list.find((item) => item.name === name);
  if (entry) {
    entry.users[user] = version;
    entry.license ??= license;
  } else {
    list.push({ name, url, license: license ?? null, users: { [user]: version } });
  }
}

const sorted = (list) => list.sort((a, b) => a.name.localeCompare(b.name));

/** Both apps' Swift packages, with each one's licence as GitHub reads it. */
async function swiftPackages(token, before = []) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const list = [];
  for (const [user, app] of Object.entries(apps)) {
    const { pins } = JSON.parse(await raw(app, app.swift));
    for (const pin of pins) {
      const url = pin.location.replace(/\.git$/, '');
      const slug = url.replace('https://github.com/', '');
      let license = licenses[slug] ?? before.find((entry) => entry.url === url)?.license ?? null;
      // Asked once per package and then kept: unsigned, GitHub answers only sixty an hour.
      if (!license) {
        const answer = await fetch(`https://api.github.com/repos/${slug}/license`, { headers });
        const spdx = answer.ok ? (await answer.json()).license?.spdx_id : null;
        license = spdx && spdx !== 'NOASSERTION' ? spdx : null;
      }
      const version = pin.state.version ?? pin.state.revision?.slice(0, 7) ?? null;
      note(list, { name: slug.split('/')[1], url, version, license }, user);
    }
  }
  return sorted(list);
}

/** The site's own packages from what is installed, and the ones Floe's runtime names. */
async function javascriptPackages(before = []) {
  const list = [];
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
    const installed = join(root, 'node_modules', name, 'package.json');
    if (!existsSync(installed)) continue;
    // An alias installs one package under another's name; show the one that is there.
    const info = JSON.parse(readFileSync(installed, 'utf8'));
    note(
      list,
      {
        name: info.name,
        url: `https://www.npmjs.com/package/${info.name}`,
        version: info.version,
        license: info.license ?? null,
      },
      'Site',
    );
  }
  const runtime = JSON.parse(await raw(apps.Floe, apps.Floe.javascript));
  for (const [name, range] of Object.entries(runtime.dependencies ?? {})) {
    let license =
      list.find((item) => item.name === name)?.license ??
      before.find((item) => item.name === name)?.license ??
      null;
    if (!license) {
      const answer = await fetch(`https://registry.npmjs.org/${name}/latest`);
      license = answer.ok ? ((await answer.json()).license ?? null) : null;
    }
    // Floe names a range; the number in it is the least it will take.
    const version = range.replace(/^[^\d]*/, '');
    note(list, { name, url: `https://www.npmjs.com/package/${name}`, version, license }, 'Floe');
  }
  return sorted(list);
}

/** The Rust crates Floe builds in, from its Cargo manifest. */
async function rustCrates(before = []) {
  const manifest = await raw(apps.Floe, apps.Floe.rust);
  const section = manifest.split(/^\[dependencies\]$/m)[1]?.split(/^\[/m)[0] ?? '';
  const list = [];
  for (const [, name, version] of section.matchAll(/^([\w-]+)\s*=\s*"([^"]+)"/gm)) {
    let license = before.find((item) => item.name === name)?.license ?? null;
    if (!license) {
      const answer = await fetch(`https://crates.io/api/v1/crates/${name}`, {
        // crates.io refuses a request that does not say who is asking.
        headers: { 'User-Agent': 'thaw-app website sync (https://github.com/thaw-app)' },
      });
      license = answer.ok ? ((await answer.json()).versions?.[0]?.license ?? null) : null;
    }
    note(list, { name, url: `https://crates.io/crates/${name}`, version, license }, 'Floe');
  }
  return sorted(list);
}

export async function builtWith() {
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const lists = {};
  for (const [kind, read] of [
    ['swift', () => swiftPackages(token, before.swift)],
    ['javascript', () => javascriptPackages(before.javascript)],
    ['rust', () => rustCrates(before.rust)],
  ]) {
    try {
      lists[kind] = await read();
    } catch (error) {
      console.warn(`Could not read the ${kind} packages (${error.message}).`);
      lists[kind] = before[kind] ?? [];
    }
  }
  writeFileSync(file, `${JSON.stringify(lists, null, 2)}\n`);
}
