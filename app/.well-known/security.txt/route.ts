import { repoUrl, siteUrl } from '@/lib/shared';

export const revalidate = false;

/**
 * Where to report a vulnerability, in the form scanners and researchers look for first
 * (RFC 9116). The contacts are the ones the security policy names: GitHub's private
 * reporting for each app. A file must say when it stops being valid, no more than a year
 * ahead, so it is dated from the build: a site not built for a year says it is stale.
 */
export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return new Response(
    [
      `Contact: ${repoUrl('thaw')}/security/advisories/new`,
      `Contact: ${repoUrl('floe')}/security/advisories/new`,
      `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
      `Policy: ${siteUrl}/docs/thaw/security`,
      'Preferred-Languages: en',
      `Canonical: ${siteUrl}/.well-known/security.txt`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
