import { docsRoute, links, products } from '@/lib/shared';

const repo = products.thaw.repo;

// What each of those is, for someone who has not met them. `checkedBy` says who vouches
// for the value, since a score a machine gives and a checklist a project fills in differ.
// `id` is what ties one to its value: a value that could not be read is left out of the
// list of values, so the two lists cannot be matched by position.
export const meanings: {
  id: VerifiedId;
  term: string;
  meaning: string;
  checkedBy: string;
  href: string;
}[] = [
  {
    id: 'slsa',
    term: 'SLSA build level',
    meaning:
      'A standard for how software gets built. At Level 3 a release is built by a hosted service, not on someone’s laptop, and comes with a signed record of which source it was built from. You can check that record against your download.',
    checkedBy: 'You can verify it yourself for any release.',
    href: 'https://slsa.dev/spec/v1.0/levels',
  },
  {
    id: 'bestPractices',
    term: 'OpenSSF Best Practices',
    meaning:
      'A checklist from the Open Source Security Foundation for how a project is run, such as how changes get reviewed and how security reports are handled. It has three badges, Passing, Silver and Gold.',
    checkedBy: 'The project answers each item and publishes its evidence.',
    href: links.bestPractices,
  },
  {
    id: 'baseline',
    term: 'OpenSSF Baseline',
    meaning:
      'A shorter list of security controls every open source project should have, in three levels. Level 3 is the one meant for projects many people depend on.',
    checkedBy: 'The project answers these too, on the same public page.',
    href: 'https://baseline.openssf.org',
  },
  {
    id: 'scorecard',
    term: 'OpenSSF Scorecard',
    meaning:
      'A tool that inspects the repository itself and scores it out of 10 on things such as whether changes are reviewed, dependencies are pinned and releases are signed.',
    checkedBy: 'Run by OpenSSF every week. The project cannot edit the score.',
    href: `https://scorecard.dev/viewer/?uri=github.com/${repo}`,
  },
  {
    id: 'coverage',
    term: 'Test coverage',
    meaning: 'The share of Thaw’s code that its automated tests run.',
    checkedBy: 'SonarQube Cloud measures it on every change.',
    href: `https://sonarcloud.io/component_measures?id=${repo.replace('/', '_')}&metric=coverage`,
  },
];

export type VerifiedId = 'slsa' | 'bestPractices' | 'baseline' | 'scorecard' | 'coverage';

export interface Verified {
  id: VerifiedId;
  value: string;
  label: string;
  detail: string;
  href: string;
  /** A level out of so many, drawn as that many steps. */
  steps?: number;
  reached?: number;
  /** A score as a share of its full mark, drawn as one bar. */
  share?: number;
  tone: string;
}

/** What the sync read from the outside bodies; any of it may be missing. */
export interface Assurance {
  bestPractices?: string;
  baseline?: number;
  scorecard?: number;
  coverage?: number;
}

// The colours the bodies' own badges use: gold for the Gold badge, green for a pass.
const gold = 'var(--verified-gold)';
const green = 'var(--verified-green)';

const badges = ['passing', 'silver', 'gold'];
const places = ['lowest', 'second', 'highest'];

/**
 * The Verified values as the pages show them. Each is read from its source when the site
 * is built, apart from the SLSA level, which the release pipeline documents; one that
 * could not be read is left out. What is said beside a value follows from the value, so a
 * badge that is not the highest is never called it.
 */
export function verifiedFrom(assurance: Assurance): Verified[] {
  const { bestPractices, baseline, scorecard, coverage } = assurance;
  const badge = bestPractices ? badges.indexOf(bestPractices) : -1;
  const candidates: (Verified | false)[] = [
    {
      id: 'slsa',
      value: 'Level 3',
      label: 'SLSA build',
      detail: 'Every release has a signed record of how it was built.',
      steps: 3,
      reached: 3,
      tone: green,
      href: `${docsRoute}/thaw/verifying-releases`,
    },
    badge >= 0 &&
      typeof bestPractices === 'string' && {
        id: 'bestPractices',
        value: bestPractices.charAt(0).toUpperCase() + bestPractices.slice(1),
        label: 'OpenSSF Best Practices',
        detail: `How the project is run. The ${places[badge]} of three badges.`,
        steps: 3,
        reached: badge + 1,
        tone: bestPractices === 'gold' ? gold : green,
        href: links.bestPractices,
      },
    typeof baseline === 'number' &&
      baseline >= 1 && {
        id: 'baseline',
        value: `Level ${baseline}`,
        label: 'OpenSSF Baseline',
        detail: `Security controls every project should have. ${
          baseline >= 3 ? 'Met at the top level.' : `Met at Level ${baseline} of 3.`
        }`,
        steps: 3,
        reached: baseline,
        tone: green,
        href: links.bestPractices,
      },
    typeof scorecard === 'number' && {
      id: 'scorecard',
      value: `${scorecard} / 10`,
      label: 'OpenSSF Scorecard',
      detail: 'An automated score of the repository, run weekly.',
      share: scorecard / 10,
      tone: green,
      href: `https://scorecard.dev/viewer/?uri=github.com/${repo}`,
    },
    typeof coverage === 'number' && {
      id: 'coverage',
      value: `${coverage}%`,
      label: 'Test coverage',
      detail: 'The share of Thaw’s code its tests run.',
      share: coverage / 100,
      tone: green,
      href: `https://sonarcloud.io/component_measures?id=${repo.replace('/', '_')}&metric=coverage`,
    },
  ];
  return candidates.filter((entry): entry is Verified => Boolean(entry));
}

/**
 * When a set of numbers was read. `day` is the newest reading among them; `older` names
 * the ones kept from an earlier day because their source could not be reached since, so
 * a page can say so and not date them all today.
 */
export function readDays(
  readOn: Partial<Record<string, string>>,
  names: Record<string, string>,
): { day: string | undefined; older: { name: string; day: string }[] } {
  const read = Object.entries(names).flatMap(([key, name]) => {
    const day = readOn[key];
    return day ? [{ name, day }] : [];
  });
  const day = read
    .map((entry) => entry.day)
    .sort()
    .at(-1);
  return { day, older: read.filter((entry) => entry.day !== day) };
}
