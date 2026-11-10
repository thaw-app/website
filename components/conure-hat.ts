// On some visits the conure wears a hat, one picked when the page loads and the same on
// every conure. This is only the choice, so that what asks for a hat does not have to
// load the pictures of the poses; the hats themselves are drawn in conure-poses.
export type Hat = 'sheriff' | 'outlaw' | 'bolero';
const names: Hat[] = ['sheriff', 'outlaw', 'bolero'];

// Two visits in three it wears nothing. `?conure-hat=sheriff` and the like puts one on.
function pickHat(): Hat | null {
  if (typeof window === 'undefined') return null;
  const asked = new URLSearchParams(window.location.search).get('conure-hat');
  if (asked && (names as string[]).includes(asked)) return asked as Hat;
  if (Math.random() < 2 / 3) return null;
  return anyHat();
}
function anyHat() {
  return names[Math.floor(Math.random() * names.length)];
}
let hat = pickHat();
const listeners = new Set<() => void>();

/** The hat it wears, if any. */
export function currentHat() {
  return hat;
}

/** For what keeps pictures of the bird: called when the hat changes, so they are drawn again. */
export function onHatChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Puts a hat on a bird that has none, for whoever has got its attention. Drawn from the next pose on. */
export function wearHat() {
  if (hat) return;
  hat = anyHat();
  for (const listener of listeners) listener();
}
