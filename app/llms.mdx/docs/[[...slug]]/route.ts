import { notFound } from 'next/navigation';
import { getPageMarkdownUrl } from '@/lib/shared';
import { roughTokens } from '@/lib/site-markdown';
import { docsLlms, source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  const markdown = await docsLlms.page(page);
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // The page's address is HTML or this, chosen by Accept (proxy.ts). Vercel keeps a
      // Vary set here, and drops the one the proxy adds to its rewrite.
      Vary: 'Accept',
      'x-markdown-tokens': roughTokens(markdown),
    },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
