/**
 * Where a release's notes are drawn alone (app/release-notes), given the address of its
 * page: /changelog/2.1.0 for Thaw's, /changelog/floe/0.2.0 for another product's (the
 * reverse of changelogUrl in lib/shared.ts). Kept apart from lib/shared.ts so the browser,
 * which asks for these, is not sent what that file imports.
 */
export function releaseNotesUrl(href: string) {
  const [product, tag] = href.replace(/^\/changelog\//, '').split('/');
  return tag ? `/release-notes/${product}/${tag}` : `/release-notes/thaw/${product}`;
}
