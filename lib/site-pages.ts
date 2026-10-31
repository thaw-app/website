/**
 * The site's own pages that have a picture for shared links: what each is called, its
 * headline, and the line under the headline on that picture. The page and the picture
 * read the headline from here, so they cannot come to say different things.
 */
export const sitePages = {
  home: {
    label: 'Thaw',
    title: 'The open source menu bar manager for macOS.',
    shared: 'Take back your menu bar. Free under GPL-3.0, with no tracking and no account.',
  },
  floe: {
    label: 'Floe',
    title: 'The open source launcher for macOS.',
    shared: 'One hotkey, one search, and Raycast extensions, unmodified. Free under AGPL-3.0.',
    // Its picture carries Floe's own icon and colour, and no cube, which is Thaw's.
    product: 'floe' as const,
  },
  floeRoadmap: {
    // The words Thaw's roadmap has: the header over the page says whose it is.
    label: 'Roadmap',
    title: 'What’s next for the year ahead.',
    shared: 'What comes next, what comes later, and what has shipped.',
    product: 'floe' as const,
  },
  floeCommunity: {
    label: 'Community',
    title: 'Floe is new, and open to anyone who wants to help.',
    shared: 'Floe in numbers, where its people are, and who has contributed.',
    product: 'floe' as const,
  },
  community: {
    label: 'Community',
    title: 'Thaw is built by the people who use it.',
    shared: 'Thaw in numbers, where its people are, and who has contributed.',
  },
  changelog: {
    label: 'Changelog',
    title: 'Every release of Thaw.',
    shared: 'What is new and what was fixed in each release, newest first.',
  },
  thawuiRoadmap: {
    label: 'Roadmap',
    title: 'What’s next for the year ahead.',
    shared: 'The design Thaw and Floe share: what is being built and what has shipped.',
  },
  roadmap: {
    label: 'Roadmap',
    title: 'What’s next for the year ahead.',
    shared: 'What is being worked on now, what comes next, and what has shipped.',
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently asked questions.',
    shared: 'Whether Thaw is free, which macOS it needs, and what its permissions are for.',
  },
  verified: {
    label: 'Verified',
    title: 'Privacy only works if the security around it does.',
    shared: 'What SLSA, the OpenSSF badges and the Scorecard are, and where Thaw stands.',
  },
  floeVerified: {
    label: 'Verified',
    title: 'Privacy only works if the security around it does.',
    shared: 'What SLSA, the OpenSSF badges and the Scorecard are, and where Floe stands.',
    product: 'floe' as const,
  },
};

export type SitePage = keyof typeof sitePages;
