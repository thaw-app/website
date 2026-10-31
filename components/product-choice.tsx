import Link from 'next/link';
import { choiceClass } from '@/components/choice-style';

/** Whose page this is, and the way to the others': on the changelog and the roadmap. */
export function ProductChoice({
  label,
  choices,
  current,
  className = '',
}: {
  /** What the choice is of, for someone who cannot see it. */
  label: string;
  choices: { name: string; href: string }[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {choices.map(({ name, href }) => (
        <Link
          key={name}
          href={href}
          aria-current={name === current ? 'page' : undefined}
          className={choiceClass(name === current)}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
