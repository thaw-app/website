import { createFromSource } from 'fumadocs-core/search/server';
import { apiError, wrongMethod } from '@/lib/api-errors';
import { source } from '@/lib/source';

const server = createFromSource(source);

/**
 * Searches the docs and the release notes: the search box's own endpoint,
 * described for agents at /openapi.json. A request that cannot be answered is told why,
 * in JSON.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!params.has('query')) {
    return apiError(
      400,
      'missing_query',
      'The query parameter is missing.',
      'Add ?query= with the words to search for, such as /api/search?query=permissions.',
    );
  }
  const limit = params.get('limit');
  if (limit !== null && !/^([1-9]|[1-9]\d|100)$/.test(limit)) {
    return apiError(
      400,
      'invalid_limit',
      'The limit parameter must be a whole number from 1 to 100.',
      'Send limit=10, or leave it out to get every match.',
    );
  }
  return server.GET(request);
}

export { wrongMethod as DELETE, wrongMethod as PATCH, wrongMethod as POST, wrongMethod as PUT };
