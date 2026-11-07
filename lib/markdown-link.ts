/**
 * A Markdown link whose text and address can come from outside the site, such as an issue
 * title or a contributor's name from GitHub. The text is kept to one line with the
 * characters that end or nest a link escaped, so a title like "x](https://elsewhere)" stays
 * text and cannot give the link another address. The address cannot close the link early.
 */
export function markdownLink(text: string, href: string) {
  const label = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\[\]]/g, '\\$&');
  const address = href.replace(/[\s()<>]/g, (character) =>
    character.trim()
      ? encodeURIComponent(character).replace('(', '%28').replace(')', '%29')
      : '%20',
  );
  return `[${label}](${address})`;
}
