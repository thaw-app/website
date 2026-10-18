import { missingMarkdown, roughTokens, siteMarkdown, siteMarkdownPaths } from '@/lib/site-markdown';

export const revalidate = false;

// The two forms of these addresses are chosen by Accept: proxy.ts sends a request that
// prefers Markdown here, and a cache has to keep the two apart.
const headers = { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept' };

/** A site page as Markdown, at /llms.mdx/site/<its address>/content.md. */
export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/site/[[...slug]]'>) {
  const { slug = [] } = await params;
  const path = `/${slug.slice(0, -1).join('/')}`;
  const markdown = await siteMarkdown(path);
  const body = markdown ?? missingMarkdown(path);
  return new Response(body, {
    status: markdown ? 200 : 404,
    headers: { ...headers, 'x-markdown-tokens': roughTokens(body) },
  });
}

export function generateStaticParams() {
  return siteMarkdownPaths().map((path) => ({
    slug: [...path.split('/').filter(Boolean), 'content.md'],
  }));
}
