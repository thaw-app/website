/**
 * How code is coloured: in the site's own colours, which are the product's accent on
 * neutral ground (DESIGN.md: no other hues). Every colour is a CSS variable, set per
 * theme and per product in global.css, so Floe's docs colour their code in Floe's blue
 * and a change of theme needs no second set of colours here.
 */
export const codeTheme = {
  name: 'site',
  type: 'light' as const,
  colors: {
    'editor.foreground': 'var(--code-text)',
    'editor.background': 'var(--code-ground)',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: 'var(--code-comment)', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'constant.other.symbol'],
      settings: { foreground: 'var(--code-string)' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'support.constant'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: 'var(--code-quiet)' },
    },
  ],
};
