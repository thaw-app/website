import { openapi } from '@/lib/openapi';

export const revalidate = false;

export function GET() {
  return Response.json(openapi);
}
