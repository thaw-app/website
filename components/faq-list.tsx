import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { Question } from './faq';
import { HoverLine, HoverLines } from './hover-lines';

/**
 * The questions people ask before installing, numbered, one to a line (hover-lines.tsx):
 * resting the pointer on one opens its answer under it.
 */
export function FaqList({ questions }: { questions: Question[] }) {
  return (
    <HoverLines className="faq max-w-3xl">
      {questions.map(({ question, answer, steps, more }, index) => (
        <HoverLine
          key={question}
          marked
          summaryClassName="flex items-start gap-4 py-4 sm:gap-6"
          summary={
            <>
              <span
                aria-hidden
                className="w-[2ch] flex-none text-lg text-fd-muted-foreground tabular-nums"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="line-name min-w-0 flex-1 text-lg text-fd-foreground text-pretty">
                {question}
              </span>
              <ChevronDown
                aria-hidden
                className="mt-1.5 size-4 flex-none text-fd-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-fd-foreground motion-reduce:transition-none"
              />
            </>
          }
        >
          {/* Under the question's own words, past the number. */}
          <div className="line-more flex max-w-prose flex-col gap-2 pb-5 ps-[calc(2.25ch+1rem)] leading-relaxed text-fd-muted-foreground text-pretty sm:ps-[calc(2.25ch+1.5rem)]">
            {steps ? (
              // Something to do in order is numbered, one thing to a line.
              <ol className="flex list-decimal flex-col gap-1 ps-5">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>{answer}</p>
            )}
            {more && (
              <p>
                <Link href={more.href} className="tap text-fd-foreground link">
                  {more.label}
                </Link>
              </p>
            )}
          </div>
        </HoverLine>
      ))}
    </HoverLines>
  );
}
