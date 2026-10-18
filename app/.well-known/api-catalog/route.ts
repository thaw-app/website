import { siteUrl } from '@/lib/shared';

export const revalidate = false;

/** The site's APIs as an RFC 9727 catalog: the one there is, its description and docs. */
export function GET() {
  return Response.json(
    {
      linkset: [
        {
          anchor: `${siteUrl}/api/search`,
          'service-desc': [
            { href: `${siteUrl}/openapi.json`, type: 'application/vnd.oai.openapi+json' },
          ],
          'service-doc': [{ href: `${siteUrl}/llms.txt`, type: 'text/plain' }],
        },
      ],
    },
    {
      headers: {
        'Content-Type':
          'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      },
    },
  );
}
