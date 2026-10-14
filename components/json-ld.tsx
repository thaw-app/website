/**
 * Data about a page in the form search engines read (schema.org). It is built from the
 * site's own values, and every "<" is escaped so nothing in it can close the script.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: data for search engines, built here from the site's own values and with "<" escaped, as the Next.js guide has it
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
