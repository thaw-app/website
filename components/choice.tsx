'use client';

import { choiceClass } from './choice-style';

/**
 * A row of buttons of which one is chosen: the changelog's macOS filter and
 * the map's three views. (The install box has real tabs, with a panel under
 * them, and keeps its own.)
 */
export function Choice<T extends string | null>({
  legend,
  options,
  value,
  onChange,
  className = '',
}: {
  /** What is being chosen, for a screen reader. */
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={`flex flex-wrap items-center gap-2 ${className}`}>
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <button
          key={option.id ?? 'all'}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
          className={choiceClass(option.id === value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
