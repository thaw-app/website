interface Person {
  login: string;
  avatar: string;
  commits: number;
}

/**
 * The people who have committed to the project, most commits first, each
 * linked to their GitHub profile.
 */
export function Contributors({ people }: { people: Person[] }) {
  return (
    <ul className="not-prose my-6 flex flex-wrap gap-2">
      {people.map((person) => (
        <li key={person.login}>
          <a
            href={`https://github.com/${person.login}`}
            className="tap flex items-center gap-2 border py-1 pr-3 pl-1 text-sm transition-colors hover:bg-fd-accent"
          >
            {/* biome-ignore lint/performance/noImgElement: a remote avatar, not worth an image pipeline */}
            <img
              src={`${person.avatar}&s=48`}
              alt=""
              width={24}
              height={24}
              loading="lazy"
              className="size-6"
            />
            {person.login}
          </a>
        </li>
      ))}
    </ul>
  );
}
