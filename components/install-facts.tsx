import { HoverLine, HoverLines } from './hover-lines';

/**
 * What a person weighs before installing: what it asks for and what is optional. Each is
 * named, and says why under its name to a pointer that rests on it (hover-lines.tsx).
 */
export function InstallFacts({
  facts,
}: {
  facts: readonly { label: string; value: string; detail: string }[];
}) {
  return (
    <HoverLines className="border-t">
      <ul
        className={`grid sm:divide-x max-sm:divide-y ${
          facts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        }`}
      >
        {facts.map((fact) => (
          <li key={fact.value} className="px-4 py-3.5">
            <HoverLine
              summaryClassName="flex flex-col gap-1"
              summary={
                <>
                  <span className="text-sm text-fd-muted-foreground">{fact.label}</span>
                  <span className="line-name font-medium">{fact.value}</span>
                </>
              }
            >
              <p className="line-more pt-1 text-sm text-fd-muted-foreground text-pretty">
                {fact.detail}
              </p>
            </HoverLine>
          </li>
        ))}
      </ul>
    </HoverLines>
  );
}
