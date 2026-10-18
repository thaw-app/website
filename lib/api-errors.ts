import { siteUrl } from '@/lib/shared';

/**
 * An error from the site's API as JSON (RFC 9457 problem details), so an agent can read
 * what went wrong and what to do, where an HTML error page would be a dead end.
 */
export function apiError(status: number, code: string, detail: string, resolution: string) {
  return Response.json(
    {
      type: `${siteUrl}/openapi.json#error-${code}`,
      title: detail.replace(/\.$/, ''),
      status,
      code,
      detail,
      resolution,
      documentation: `${siteUrl}/openapi.json`,
    },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    },
  );
}

export const wrongMethod = () =>
  apiError(405, 'method_not_allowed', 'This API only answers GET.', 'Send the request as GET.');
