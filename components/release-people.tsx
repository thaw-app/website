'use client';

import { useState } from 'react';

/**
 * One person's picture, from GitHub by their login, which opens their profile. Notes are
 * written by hand and now and then name an account that does not exist; its picture fails
 * to load, and it is then left out, link and all, and not shown as a broken image.
 */
function Person({ login }: { login: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <a
      href={`https://github.com/${login}`}
      title={`@${login}`}
      aria-label={`@${login} on GitHub`}
      className="-ms-1.5 rounded-full transition-transform hover:z-10 hover:-translate-y-0.5"
    >
      {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
      <img
        // A picture that failed before the page woke up says so here; one that fails after, below.
        ref={(image) => {
          if (image?.complete && image.naturalWidth === 0) setMissing(true);
        }}
        onError={() => setMissing(true)}
        src={`https://github.com/${login}.png?size=48`}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        className="size-6 rounded-full bg-fd-muted ring-2 ring-fd-background"
      />
    </a>
  );
}

/**
 * The people a release's notes credit, as a row of round pictures from GitHub: who wrote,
 * reported or reviewed what went into it. Round, where the rest of the site is square,
 * because a round picture is how a person is shown everywhere else they are seen.
 */
export function ReleasePeople({
  people,
  max = 12,
  className = '',
}: {
  /** GitHub logins, in the order the notes name them. */
  people: string[];
  /** How many are drawn before the rest are a number. */
  max?: number;
  className?: string;
}) {
  if (!people.length) return null;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className={`flex flex-wrap items-center gap-y-1.5 ps-1.5 ${className}`}>
      {shown.map((login) => (
        <Person key={login} login={login} />
      ))}
      {rest > 0 && (
        <span className="ms-1.5 text-xs text-fd-muted-foreground tabular-nums">+{rest}</span>
      )}
    </span>
  );
}
