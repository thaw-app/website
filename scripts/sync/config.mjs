// Where the sync reads from and writes to: the products and what is shared between them.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The repo's own folders, from this file's place in scripts/sync.
const root = join(import.meta.dirname, '..', '..');
const contentDir = join(root, 'content', 'docs');

/** A file of fetched numbers or lists under lib/, which is committed. */
const libFile = (name) => join(root, 'lib', name);

/** A file under .cache/, which is not: the last answer from a source, for when it cannot be reached. */
const cacheFile = (name) => join(root, '.cache', name);

/** The token GitHub is asked with, when there is one: without it the shared limits apply. */
const githubToken = () => process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

// What a product is called, where it lives and its ids with outside services, which the
// site reads too (lib/shared.ts).
const project = JSON.parse(readFileSync(libFile('project.json'), 'utf8'));

// extraPages are files outside docs/ that get a page too, keyed by their path
// in the repo. icons are Lucide names for the sidebar, keyed by page slug.
// titles replace a file's own heading where that is too long for the sidebar.
const products = [
  {
    slug: 'thaw',
    ...project.products.thaw,
    // The macOS each major version runs on, from the deployment target its tags were built with.
    // A release that says "macOS 27 only" in its notes is filed by that instead.
    systems: { 3: 'macOS 27', 2: 'macOS 26', 1: 'macOS 14 and 15' },
    // Thaw began as a fork of Ice on this day. Contributors are counted from it on, so
    // the people who only ever worked on Ice are not listed as Thaw's.
    contributorsSince: '2026-01-29',
    // Accounts that commit but are not people.
    // lathe-agent-oa's own profile calls it a machine account run by a contributor.
    notPeople: ['claude', 'cursoragent', 'lathe-agent-oa'],
    // Where the community page's numbers come from.
    // updatesRepo holds the files the app's own updater fetches, which count as downloads too.
    // team is who maintains the project, in the order they are shown.
    community: {
      discordInvite: project.discordInvite,
      cask: 'thaw',
      updatesRepo: 'thaw-app/updates',
      team: ['stonerl', 'diazdesandi', 'nightah', 'alvst', 'camguillory'],
      // The project's entry on bestpractices.dev, which holds its OpenSSF badge and Baseline level.
      bestPractices: project.bestPractices,
    },
    // Pages this site writes itself, so the repo's file of the same name is not synced in.
    // The roadmap is content/site/roadmap.mdx, drawn at /roadmap; it says more than
    // docs/ROADMAP.md does, for now.
    writtenHere: ['roadmap'],
    // README sections the home page leaves out: it links to the docs itself, and the
    // contributors are on the community page and the licence in the footer.
    readmeLeavesOut: [
      'Project documentation',
      'Contributors',
      'License',
      // The home page has one job, getting Thaw installed; these two are in the docs and on
      // the community page.
      'Integrations',
      'Languages',
      // What Transparency lists is said where it applies: free and GPL-3.0 beside the
      // headline, Screen Recording under Install, no tracking in the footer.
      'Transparency',
    ],
    // Releases tagged in words: what their group is called, and the version it is listed under.
    namedGroups: {
      'macos-27-preview': {
        label: 'Pre-3.0.0',
        after: '3.0.0',
        note: 'Experimental builds for macOS 27, versioned 2.1.0 at the time. They branched from the 2.0.0 betas in June 2026 and were to become the macOS 27 release, until that work was rewritten as 3.0.0.',
      },
    },
    titles: {
      'frequent-issues': 'Frequent issues',
      'uri-schemes': 'URL schemes',
      'hidden-flags': 'Hidden flags',
      architecture: 'Architecture',
      releases: 'Releases and updates',
      'verifying-releases': 'Verifying releases',
      'assurance-case': 'Security assurance case',
      governance: 'Governance',
    },
    icons: {
      'frequent-issues': 'LifeBuoy',
      'uri-schemes': 'Link',
      'hidden-flags': 'Flag',
      roadmap: 'Map',
      changelog: 'ScrollText',
      development: 'Hammer',
      architecture: 'Layers',
      releases: 'Package',
      'verifying-releases': 'ShieldCheck',
      'assurance-case': 'FileCheck',
      governance: 'Scale',
    },
    extraPages: {
      'CHANGELOG.md': 'changelog',
      'FREQUENT_ISSUES.md': 'frequent-issues',
      '.github/GOVERNANCE.md': 'governance',
      // Shown on the home page, not in the docs sidebar.
      'README.md': 'readme',
    },
  },
  {
    slug: 'floe',
    ...project.products.floe,
    titles: {},
    icons: { changelog: 'ScrollText', development: 'Hammer' },
    extraPages: { 'CHANGELOG.md': 'changelog' },
  },
];

// What every product's docs carry a copy of: the policies both apps follow,
// which live in the organisation's own repo, and the pages in content/shared.
const shared = {
  repo: `${project.org}/.github`,
  ref: 'main',
  pages: {
    '.github/CONTRIBUTING.md': 'contribute/guidelines',
    '.github/CODE_OF_CONDUCT.md': 'contribute/code-of-conduct',
    '.github/SECURITY.md': 'security',
  },
  titles: {
    security: 'Security policy',
    'contribute/guidelines': 'Contribution guidelines',
    'contribute/code-of-conduct': 'Code of Conduct',
  },
  icons: { security: 'ShieldAlert' },
  // Written in this repo. "{{docs}}" in them stands for the product's own docs.
  dir: join(contentDir, '..', 'shared'),
};

export { cacheFile, contentDir, githubToken, libFile, products, project, root, shared };
