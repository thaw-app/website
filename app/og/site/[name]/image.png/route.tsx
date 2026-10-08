import { notFound } from 'next/navigation';
import { shareImage } from '@/lib/og';

export const revalidate = false;

// The pictures a link to one of the site's own pages is shared with. The docs draw theirs
// from each page (app/og/docs).
const cards: Record<string, { title: string; description: string }> = {
  home: {
    title: 'The open source menu bar manager for macOS',
    description: 'Take back your menu bar. Free under GPL-3.0, with no tracking and no account.',
  },
  community: {
    title: 'Thaw is built by the people who use it',
    description: 'Thaw in numbers, where its people are, and who has contributed.',
  },
  roadmap: {
    title: 'What we’re building',
    description: 'What is being worked on now, what comes next, and what has shipped.',
  },
  verified: {
    title: 'Privacy only works if the security around it does',
    description: 'What SLSA, the OpenSSF badges and the Scorecard are, and where Thaw stands.',
  },
};

export async function GET(_req: Request, { params }: RouteContext<'/og/site/[name]/image.png'>) {
  const card = cards[(await params).name];
  if (!card) notFound();
  return shareImage({ ...card, withCube: true });
}

export function generateStaticParams() {
  return Object.keys(cards).map((name) => ({ name }));
}
