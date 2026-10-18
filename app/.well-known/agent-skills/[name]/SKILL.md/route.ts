import { notFound } from 'next/navigation';
import { skillMarkdown, skillNames } from '@/lib/agent-skills';

export const revalidate = false;
export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/.well-known/agent-skills/[name]/SKILL.md'>,
) {
  const markdown = await skillMarkdown((await params).name);
  if (!markdown) notFound();
  return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}

export function generateStaticParams() {
  return skillNames.map((name) => ({ name }));
}
