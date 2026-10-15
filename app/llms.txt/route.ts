import { llmsIndex } from '@/lib/llms';

export const revalidate = false;

export function GET() {
  return new Response(llmsIndex());
}
