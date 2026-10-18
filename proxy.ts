import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { docsContentRoute, docsRoute } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

// The site's own pages as Markdown (lib/site-markdown.ts), and an address with no page as
// a Markdown "not found".
const siteContentRoute = '/llms.mdx/site';
// A page answered with its HTML even when Markdown is asked for: it only redirects.
const htmlOnly = new Set(['/try']);
// The routes that make the site's other formats, and files: a name ending in a dot and a
// word. A release's tag ends in a dot and a number (/changelog/2.1.0), and is a page.
const reserved = /^\/(_next|api|og|feed|llms|\.well-known)(\/|\.|$)/;
const isFile = /\.[a-z][a-z0-9]*$/i;

const siteMarkdown = (path: string) => `${siteContentRoute}${path === '/' ? '' : path}/content.md`;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const result = rewriteSuffix(pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }
  // A site page at its address plus .md, and the home page at /index.md.
  if (pathname.endsWith('.md') && !pathname.startsWith(docsRoute) && !reserved.test(pathname)) {
    const page = pathname === '/index.md' ? '/' : pathname.slice(0, -'.md'.length);
    return NextResponse.rewrite(new URL(siteMarkdown(page), request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: 'Accept' },
      });
    }
    if (!htmlOnly.has(pathname) && !reserved.test(pathname) && !isFile.test(pathname)) {
      return NextResponse.rewrite(new URL(siteMarkdown(pathname), request.nextUrl), {
        headers: { Vary: 'Accept' },
      });
    }
  }

  return NextResponse.next();
}
