import { apiError } from '@/lib/api-errors';

/** Any other address under /api: there is nothing there, said in JSON. */
function missing(request: Request) {
  return apiError(
    404,
    'not_found',
    `There is no API at ${new URL(request.url).pathname}.`,
    'The site has one API, /api/search. Its description is at /openapi.json.',
  );
}

export { missing as DELETE, missing as GET, missing as PATCH, missing as POST, missing as PUT };
