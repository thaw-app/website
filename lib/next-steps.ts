/**
 * The two pages shown under "Next steps" at a docs page's foot, keyed by its slugs. Kept on
 * the site, not in the app repos: it is how the site is read, not what the docs say.
 */
export const nextSteps: Record<string, string[]> = {
  // Only pages that end cold; the rest already close by sending the reader on.
  'thaw/shortcuts': ['thaw/uri-schemes', 'thaw/frequent-issues'],
  'thaw/uri-schemes': ['thaw/shortcuts', 'thaw/permissions'],
  'thaw/reset-and-uninstall': ['thaw/frequent-issues', 'thaw/getting-started'],
  'thaw/hidden-flags': ['thaw/frequent-issues', 'thaw/reset-and-uninstall'],
};
