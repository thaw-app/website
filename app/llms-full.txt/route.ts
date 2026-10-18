import { allSiteMarkdown } from '@/lib/site-markdown';
import { docsLlms } from '@/lib/source';

export const revalidate = false;

// The site's own pages first, then every docs page and release.
export async function GET() {
  return new Response(`${await allSiteMarkdown()}\n\n${await docsLlms.full()}`);
}
