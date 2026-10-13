import { changelogRoute, changelogUrl, docsRoute } from './shared';

// Where each product's header goes: its docs, changelog and roadmap, the community page,
// which is the whole project's, and last the other product.
export const pagesOf = {
  thaw: [
    { text: 'Docs', url: `${docsRoute}/thaw`, active: 'nested-url' as const },
    { text: 'Changelog', url: changelogRoute, active: 'nested-url' as const },
    { text: 'Roadmap', url: '/roadmap' },
    { text: 'Community', url: '/community' },
    { text: 'Floe', url: '/floe' },
  ],
  floe: [
    { text: 'Docs', url: `${docsRoute}/floe`, active: 'nested-url' as const },
    { text: 'Changelog', url: changelogUrl('floe'), active: 'nested-url' as const },
    { text: 'Roadmap', url: '/floe/roadmap' },
    { text: 'Community', url: '/community' },
    { text: 'Thaw', url: '/' },
  ],
};
