import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const dev = process.env.NODE_ENV === 'development';

// What a page of this site may load, and from where. The site is its own only source:
// its scripts, styles and fonts are served from it, and it calls nothing but itself.
//
// Scripts and styles written into the page are allowed ('unsafe-inline'), because the
// pages are built once and served as files: the stricter way, a fresh nonce on every
// script, needs every page rendered on every request (see the Next.js guide on content
// security policy). What this still refuses is any script, style, frame or connection from
// somewhere else, which is what an injected tag would need.
//
// Pictures may come from any https address: the docs embed them from GitHub and other
// hosts, and contributors' pictures are GitHub's.
const contentSecurityPolicy = [
  "default-src 'self'",
  // React's debugging in development needs eval; a built site does not.
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Development also talks to the dev server over a socket, to reload what changed.
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only where the site is served over https, which is on Vercel. Run on this machine it
  // is http://localhost, and Safari would send every script to an https that is not there.
  ...(process.env.VERCEL ? ['upgrade-insecure-requests'] : []),
].join('; ');

// Sent with every response. Strict-Transport-Security is not here because Vercel adds
// it to everything it serves.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // A file is what its type says it is, and is not guessed at.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // The site is not to be shown inside another page (older browsers; frame-ancestors is the same for newer ones).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Another site is told which site a visitor came from, and not which page.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // A window this site opens, or is opened from, shares nothing with it.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // None of these is used, so none can be asked for, by the site or by anything in it.
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), midi=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=(), browsing-topics=()',
  },
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/docs', destination: '/docs/thaw', permanent: false },
      // The roadmap was a docs page first; links to it there still arrive.
      { source: '/docs/thaw/roadmap', destination: '/roadmap', permanent: true },
      // A release was filed under its version first (/changelog/3.0.0/3.0.0-beta.2), in the
      // docs and then here. Its address is now its tag alone.
      {
        source: '/docs/thaw/changelog/:group/:tag',
        destination: '/changelog/:tag',
        permanent: true,
      },
      {
        source: '/docs/floe/changelog/:group/:tag',
        destination: '/changelog/floe/:tag',
        permanent: true,
      },
      {
        source: '/changelog/floe/:group/:tag',
        destination: '/changelog/floe/:tag',
        permanent: true,
      },
      {
        source: '/changelog/:group((?!floe)[^/]+)/:tag',
        destination: '/changelog/:tag',
        permanent: true,
      },
      // So was the changelog, under each product's docs.
      { source: '/docs/thaw/changelog/:path*', destination: '/changelog/:path*', permanent: true },
      {
        source: '/docs/floe/changelog/:path*',
        destination: '/changelog/floe/:path*',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
