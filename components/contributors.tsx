interface Person {
  login: string;
  avatar: string;
  commits: number;
}

/**
 * The people who have committed to the project, most commits first, each
 * linked to their GitHub profile. A roster in columns, not a run of boxes: sixty names
 * each in a frame of its own was sixty frames to look at.
 */
export function Contributors({ people }: { people: Person[] }) {
  return (
    <ul className="not-prose grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {people.map((person) => (
        <li key={person.login}>
          <a
            href={`https://github.com/${person.login}`}
            title={person.login}
            className="group tap flex items-center gap-2.5 py-1.5 text-sm"
          >
            {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
            <img
              src={`${person.avatar}&s=48`}
              alt=""
              width={24}
              height={24}
              loading="lazy"
              className="size-6 flex-none"
            />
            <span className="truncate underline-offset-4 group-hover:underline">
              {person.login}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
