import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/docs', destination: '/docs/thaw', permanent: false },
      // The roadmap was a docs page first; links to it there still arrive.
      { source: '/docs/thaw/roadmap', destination: '/roadmap', permanent: true },
    ];
  },
};

export default withMDX(config);
