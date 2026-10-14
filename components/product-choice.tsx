import Link from 'next/link';
import { choiceClass } from '@/components/choice-style';
import { type ProductSlug, products } from '@/lib/shared';

/** Whose page this is, and the way to the other product's: on the changelog and the roadmap. */
export function ProductChoice({
  label,
  choices,
  current,
  className = '',
}: {
  /** What the choice is of, for someone who cannot see it. */
  label: string;
  choices: { product: ProductSlug; href: string }[];
  current: ProductSlug;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {choices.map(({ product, href }) => (
        <Link
          key={product}
          href={href}
          aria-current={product === current ? 'page' : undefined}
          className={choiceClass(product === current)}
        >
          {products[product].name}
        </Link>
      ))}
    </nav>
  );
}
