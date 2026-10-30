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
/** The header that signs a request to GitHub, or none where there is no token to sign with. */
const githubHeaders = (token = githubToken()) =>
  token ? { Authorization: `Bearer ${token}` } : {};

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
      file: 'community.json',
      discordInvite: project.discordInvite,
      cask: 'thaw',
      updatesRepo: 'thaw-app/updates',
      team: ['stonerl', 'diazdesandi', 'nightah', 'alvst', 'camguillory'],
      // The project's entry on bestpractices.dev, which holds its OpenSSF badge and Baseline level.
      bestPractices: project.bestPractices,
    },
    // Pages this site writes itself, so the repo's file of the same name is not synced in.
    // The roadmap is content/site/roadmap.mdx, drawn at /roadmap.
    writtenHere: ['roadmap'],
    // What the home page draws itself in the README's place: the install commands, the
    // feature list, and at its end how the project is run.
    readmeParts: { install: '<InstallTabs />', features: '<FeatureList />', last: '<Assurance />' },
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
      'getting-started': 'Getting started',
      network: 'What Thaw sends over the network',
      'reset-and-uninstall': 'Reset or uninstall',
      shortcuts: 'Shortcuts and automation',
      'uri-schemes': 'URL schemes',
      'hidden-flags': 'Hidden flags',
      architecture: 'Architecture',
      releases: 'Releases and updates',
      'verifying-releases': 'Verifying releases',
      'assurance-case': 'Security assurance case',
      governance: 'Governance',
    },
    // What a page is about, for search results and the docs index, where its own opening
    // lines would only start the page over.
    descriptions: {
      'getting-started':
        'Install Thaw, give it the permissions it asks for, and hide your first menu bar item.',
      permissions:
        'What each permission Thaw asks for is used for, which ones you can refuse, and how to grant one again.',
      versions:
        'Which Thaw runs on which macOS, how to install it, and which updates each channel sends you.',
      network: 'Every network call Thaw makes, what each is for, and how to switch it off.',
      'reset-and-uninstall':
        'Put Thaw’s layout or settings back to how they started, or remove Thaw and what it leaves behind.',
      shortcuts:
        'Keyboard shortcuts, Shortcuts, Spotlight and Siri actions, Control Center controls, and more thaw:// links.',
      'frequent-issues':
        'Known problems and their workarounds, for Thaw 3 on macOS 27 and Thaw 2 on macOS 26. Check here before filing a bug.',
      'uri-schemes':
        'Run Thaw actions and read or change its settings from thaw:// links, in Raycast, Alfred, Shortcuts or a shell script.',
      'hidden-flags':
        'Switches Thaw reads but Settings doesn’t show, for working out menu bar reorder problems. Most people never need them.',
      development:
        'What you need to build Thaw from source, how to build and test it, and its code style.',
      architecture:
        'A map of Thaw’s main parts, where it keeps its data, and how it is built and released.',
      releases:
        'How Thaw’s installers and in-app updates are published, and what each update channel gets.',
      'verifying-releases':
        'What each Thaw release is signed with, and how to check a download yourself.',
      'assurance-case':
        'The case that Thaw meets its security requirements: its threat model, trust boundaries and the risks that remain.',
      'app-developers':
        'For developers of apps with menu bar items. How Thaw tells your items apart on macOS 27, how to keep them where people put them, and how to let each one be hidden on its own.',
    },
    icons: {
      'frequent-issues': 'LifeBuoy',
      'getting-started': 'Rocket',
      permissions: 'KeyRound',
      versions: 'GitBranch',
      network: 'Globe',
      'reset-and-uninstall': 'RotateCcw',
      shortcuts: 'Keyboard',
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
    // Floe's repo began on this day, so every commit in it counts.
    contributorsSince: '2026-10-03',
    notPeople: ['claude', 'cursoragent', 'lathe-agent-oa'],
    // The numbers on Floe's community page (/floe/community). It has no Homebrew cask and no
    // OpenSSF entry yet, so those are not asked for. It shares Thaw's Discord.
    community: {
      file: 'floe-community.json',
      discordInvite: project.discordInvite,
      team: ['diazdesandi'],
    },
    // Floe's README is laid out as Thaw's is, and its page leaves out what the home page
    // does, for the same reasons. Its roadmap is a page of its own, written in
    // content/site/floe-roadmap.mdx.
    readmeLeavesOut: [
      'Project documentation',
      'Contributors',
      'License',
      'Integrations',
      'Transparency',
      'Roadmap',
    ],
    // Its page has a download box and feature cells of its own (components/floe-parts.tsx).
    readmeParts: {
      install: '<FloeInstall />',
      features: '<FloeFeatures />',
      last: '<FloeAssurance />',
    },
    titles: {},
    descriptions: {
      development:
        'How to build and run Floe from source, how it runs Raycast extensions, and how to add one.',
    },
    icons: { changelog: 'ScrollText', development: 'Hammer' },
    extraPages: {
      'CHANGELOG.md': 'changelog',
      // Shown at /floe, not in the docs sidebar.
      'README.md': 'readme',
    },
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
  descriptions: {
    security:
      'How to report a vulnerability privately, which versions get fixes, and how disclosure works.',
    'contribute/code-of-conduct':
      'How people are expected to treat each other in every community space, and how that is enforced. Adapted from the Contributor Covenant.',
  },
  icons: { security: 'ShieldAlert' },
  // Written in this repo. "{{docs}}" in them stands for the product's own docs.
  dir: join(contentDir, '..', 'shared'),
};

export {
  cacheFile,
  contentDir,
  githubHeaders,
  githubToken,
  libFile,
  products,
  project,
  root,
  shared,
};
