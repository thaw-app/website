import { siteUrl } from '@/lib/shared';

// The site's one API, the search behind its search box, as OpenAPI 3.1: what an agent
// needs to call it as a tool without reading the code. Thaw's own controls, thaw://
// links, run on the Mac and are not an HTTP API: they are in the thaw-url-scheme skill.

const problem = {
  description: 'The request could not be answered. The body says why and what to do.',
  content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } } },
};

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Thaw site search',
    version: '1.0.0',
    summary: 'Search the docs and release notes of Thaw and Floe.',
    description:
      'Thaw is a free, open source menu bar manager for macOS, and Floe a launcher. This API searches their documentation and release notes, and is the same search as the site’s search box. It is read-only, needs no key, and returns JSON. Thaw itself is driven on the Mac through thaw:// links, not over HTTP: see /.well-known/agent-skills/thaw-url-scheme/SKILL.md.',
    license: { name: 'GPL-3.0', identifier: 'GPL-3.0-only' },
    contact: { name: 'Thaw on GitHub', url: 'https://github.com/thaw-app/website/issues' },
  },
  servers: [{ url: siteUrl }],
  externalDocs: { description: 'Every page of the site, for AI tools', url: `${siteUrl}/llms.txt` },
  paths: {
    '/api/search': {
      get: {
        operationId: 'searchDocs',
        summary: 'Search Thaw and Floe’s docs',
        description:
          'Finds the docs pages, release notes, headings and passages that match the words given, best first. Each result has the page’s address and where it sits in the docs. Use it to answer a question about installing, using, troubleshooting or scripting Thaw or Floe, then read the page at its url (add .md for Markdown).',
        parameters: [
          {
            name: 'query',
            in: 'query',
            required: true,
            description: 'The words to search for, such as "permissions" or "uninstall".',
            schema: { type: 'string', minLength: 1, examples: ['permissions'] },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'At most this many results. Every match when left out.',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'The matches, best first. An empty list when nothing matches.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/SearchResult' } },
              },
            },
          },
          '400': problem,
          '405': problem,
        },
      },
    },
  },
  components: {
    schemas: {
      SearchResult: {
        type: 'object',
        required: ['id', 'url', 'type', 'content'],
        properties: {
          id: { type: 'string', description: 'Unique within one response.' },
          url: {
            type: 'string',
            description: 'The page’s address on the site, with an anchor for a heading or passage.',
            examples: ['/docs/thaw/permissions#accessibility'],
          },
          type: {
            type: 'string',
            enum: ['page', 'heading', 'text'],
            description: 'A whole page, one of its headings, or a passage under a heading.',
          },
          content: {
            type: 'string',
            description: 'The matching text, with the words found wrapped in <mark>.',
          },
          breadcrumbs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Where the page sits, such as ["Docs", "Thaw", "Using Thaw"].',
          },
        },
      },
      Problem: {
        type: 'object',
        description: 'An error, as RFC 9457 problem details.',
        required: ['type', 'title', 'status', 'code', 'detail', 'resolution'],
        properties: {
          type: { type: 'string', format: 'uri' },
          title: { type: 'string' },
          status: { type: 'integer' },
          code: {
            type: 'string',
            enum: ['missing_query', 'invalid_limit', 'method_not_allowed', 'not_found'],
          },
          detail: { type: 'string' },
          resolution: { type: 'string', description: 'What to change to make the request work.' },
          documentation: { type: 'string', format: 'uri' },
        },
      },
    },
  },
};
