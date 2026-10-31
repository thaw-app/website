import { ResolvingText } from '@/components/resolving-text';
import { compact } from '@/lib/shared';

/** A row of counted numbers, each with what it counts. `accent` draws the first in the page's accent. */
export function NumberCells({
  numbers,
  accent,
  className = 'grid-cols-2',
}: {
  numbers: { label: string; value: number; unit: string }[];
  accent?: boolean;
  /** How many fit across: a row of three on a phone has no room for its numbers. */
  className?: string;
}) {
  return (
    <dl className={`crossed ${className}`}>
      {numbers.map((number) => (
        <div key={number.label} className="group flex flex-col gap-1 p-4 sm:p-6">
          <dt className="text-sm text-fd-muted-foreground">{number.label}</dt>
          <dd
            className={`font-display text-4xl font-semibold tracking-tight xl:text-5xl ${
              accent ? 'group-first:text-(--product-tone)' : ''
            }`}
          >
            <ResolvingText>{compact.format(number.value)}</ResolvingText>
          </dd>
          <dd className="text-sm text-fd-muted-foreground">{number.unit}</dd>
        </div>
      ))}
    </dl>
  );
}
