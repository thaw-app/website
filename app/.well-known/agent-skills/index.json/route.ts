import { skillsIndex } from '@/lib/agent-skills';

export const revalidate = false;

export async function GET() {
  return Response.json(await skillsIndex());
}
