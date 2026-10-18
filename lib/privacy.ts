// Each of these was checked against the running site, and is true of the code in this
// repo. One that stops being true (analytics added, a cookie set, an outside script
// loaded) has to be changed here in the same change.
export const privacyFacts = [
  {
    name: 'Analytics and tracking',
    said: 'None. The site runs no analytics, no advertising and no tracking scripts, and nothing counts or follows visits.',
  },
  {
    name: 'Cookies',
    said: 'None. The site does not set any.',
  },
  {
    name: 'Kept in your browser',
    said: 'Two things: which theme you chose (light, dark or your Mac’s), so the site opens that way next time, and that you closed the line of news at the top, so it stays closed. Both stay in your browser and are not sent anywhere.',
  },
  {
    name: 'Search',
    said: 'What you type in the search panel is answered by this site’s own server. The site’s code does not keep it.',
  },
  {
    name: 'Fonts and scripts',
    said: 'Served from the site itself. No page loads a font or a script from another company.',
  },
];

export const privacyOthers = [
  {
    name: 'Vercel',
    said: 'The site is hosted by Vercel. Like any web host, its servers receive each request your browser makes, with your IP address and browser details, and it keeps logs of them under its own privacy policy.',
  },
  {
    name: 'GitHub',
    said: 'The community page and the changelog show contributors’ pictures, which your browser loads from GitHub. GitHub receives that request as it would for any picture on its own site. Following a link to GitHub, Discord or Crowdin takes you to them, under their policies.',
  },
];
