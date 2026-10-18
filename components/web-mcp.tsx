'use client';

import { useEffect } from 'react';

// Tools a browser agent can call on any page of the site (WebMCP, a W3C draft:
// webmachinelearning.github.io/webmcp). Both only read: one searches the docs through the
// site's search API (/openapi.json), the other fetches a page as Markdown. A browser
// without WebMCP has no modelContext, and nothing here runs.

interface ModelContext {
  registerTool(
    tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema: object;
      annotations?: { readOnlyHint?: boolean };
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> | void;
}

const tools = [
  {
    name: 'search_thaw_docs',
    title: 'Search Thaw’s docs',
    description:
      'Search the docs and release notes of Thaw, the macOS menu bar manager, and Floe, the launcher. Returns matching pages with their addresses, best first.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The words to search for, such as "permissions".' },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'At most this many results.',
        },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
    async execute({ query, limit }: Record<string, unknown>) {
      const params = new URLSearchParams({ query: String(query) });
      if (limit !== undefined) params.set('limit', String(limit));
      return (await fetch(`/api/search?${params}`)).json();
    },
  },
  {
    name: 'read_thaw_page',
    title: 'Read a page as Markdown',
    description:
      'Read a page of this site as Markdown, such as /docs/thaw/permissions or /faq. Use an address from search_thaw_docs.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The page’s address on this site, starting with /.' },
      },
      required: ['path'],
    },
    annotations: { readOnlyHint: true },
    async execute({ path }: Record<string, unknown>) {
      const address = String(path).split('#')[0];
      if (!address.startsWith('/')) return { error: 'The path must start with /.' };
      const response = await fetch(address, { headers: { Accept: 'text/markdown' } });
      return { status: response.status, markdown: await response.text() };
    },
  },
];

export function WebMcp() {
  useEffect(() => {
    const context = ((document as unknown as { modelContext?: ModelContext }).modelContext ??
      (navigator as unknown as { modelContext?: ModelContext }).modelContext) as
      | ModelContext
      | undefined;
    if (!context) return;
    const controller = new AbortController();
    for (const tool of tools) {
      Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {});
    }
    return () => controller.abort();
  }, []);
  return null;
}
