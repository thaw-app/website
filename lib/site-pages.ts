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
  community: {
    label: 'Community',
    title: 'Thaw is built by the people who use it.',
    shared: 'Thaw in numbers, where its people are, and who has contributed.',
  },
  roadmap: {
    label: 'Roadmap',
    title: 'What we’re building.',
    shared: 'What is being worked on now, what comes next, and what has shipped.',
  },
  verified: {
    label: 'Verified',
    title: 'Privacy only works if the security around it does.',
    shared: 'What SLSA, the OpenSSF badges and the Scorecard are, and where Thaw stands.',
  },
};

export type SitePage = keyof typeof sitePages;
