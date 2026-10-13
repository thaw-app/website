import Link from 'next/link';

import { FaqList } from './faq-list';

export { FaqList };

export interface Question {
  question: string;
  answer: string;
  steps?: string[];
  more?: { label: string; href: string };
}

/**
 * What the home page ends on: the few questions asked first, each opening on its answer,
 * and the way to the rest, which have a page of their own (/faq).
 */
export function FaqPrompt({ questions, total }: { questions: Question[]; total: number }) {
  return (
    <section className="border-t">
      <div className="mx-auto grid w-full max-w-[1592px] gap-x-16 gap-y-6 px-6 py-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:px-10 lg:py-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Questions?
        </h2>
        <div>
          <FaqList questions={questions} />
          <p className="mt-4">
            <Link href="/faq" className="tap font-medium link">
              All {total} questions
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * The same questions in the form search engines read (schema.org's FAQPage): the words on
 * the page and no others.
 */
export function faqData(questions: Question[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer, steps }) => ({
      '@type': 'Question',
      name: question,
      // Steps are given in the order they are drawn, numbered as they are on the page.
      acceptedAnswer: {
        '@type': 'Answer',
        text: steps ? steps.map((step, index) => `${index + 1}. ${step}`).join(' ') : answer,
      },
    })),
  };
}
