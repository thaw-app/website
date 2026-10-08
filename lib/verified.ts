import { products } from '@/lib/shared';

const repo = products.thaw.repo;

// What each of those is, for someone who has not met them. `checkedBy` says who vouches
// for the value, since a score a machine gives and a checklist a project fills in differ.
export const meanings = [
  {
    term: 'SLSA build level',
    meaning:
      'A standard for how software gets built. At Level 3 a release is built by a hosted service, not on someone’s laptop, and comes with a signed record of which source it was built from. You can check that record against your download.',
    checkedBy: 'You can verify it yourself for any release.',
    href: 'https://slsa.dev/spec/v1.0/levels',
  },
  {
    term: 'OpenSSF Best Practices',
    meaning:
      'A checklist from the Open Source Security Foundation for how a project is run, such as how changes get reviewed and how security reports are handled. It has three badges, Passing, Silver and Gold.',
    checkedBy: 'The project answers each item and publishes its evidence.',
    href: 'https://www.bestpractices.dev/projects/13303',
  },
  {
    term: 'OpenSSF Baseline',
    meaning:
      'A shorter list of security controls every open source project should have, in three levels. Level 3 is the one meant for projects many people depend on.',
    checkedBy: 'The project answers these too, on the same public page.',
    href: 'https://baseline.openssf.org',
  },
  {
    term: 'OpenSSF Scorecard',
    meaning:
      'A tool that inspects the repository itself and scores it out of 10 on things such as whether changes are reviewed, dependencies are pinned and releases are signed.',
    checkedBy: 'Run by OpenSSF every week. The project cannot edit the score.',
    href: `https://scorecard.dev/viewer/?uri=github.com/${repo}`,
  },
  {
    term: 'Test coverage',
    meaning: 'The share of Thaw’s code that its automated tests run.',
    checkedBy: 'SonarQube Cloud measures it on every change.',
    href: `https://sonarcloud.io/component_measures?id=${repo.replace('/', '_')}&metric=coverage`,
  },
];
