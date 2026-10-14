/**
 * Calls back when the page goes from light to dark or back, which is a class on the root
 * element. For what is drawn on a canvas, which does not restyle itself. Returns the way
 * to stop listening.
 */
export function onThemeChange(changed: () => void) {
  const themed = new MutationObserver(changed);
  themed.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => themed.disconnect();
}
