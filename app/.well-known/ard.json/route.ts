import { aiCatalog } from '@/lib/ard';

export const revalidate = false;

export function GET() {
  return Response.json(aiCatalog(), { headers: { 'Content-Type': 'application/ai-catalog+json' } });
}
