import type { Root, RootContent } from 'mdast';

// GitHub's alert names, and the Callout type each one is drawn as.
const alerts: Record<string, { type: string; title: string }> = {
  NOTE: { type: 'info', title: 'Note' },
  TIP: { type: 'idea', title: 'Tip' },
  IMPORTANT: { type: 'info', title: 'Important' },
  WARNING: { type: 'warn', title: 'Warning' },
  CAUTION: { type: 'error', title: 'Caution' },
};

/**
 * Turns a GitHub alert, a quote that opens with "[!NOTE]", into a Callout.
 * The app repos write their docs for GitHub, where these are drawn as boxes.
 */
export function remarkGithubAlerts() {
  return (tree: Root) => {
    visit(tree);
  };
}

function visit(parent: { children: RootContent[] }) {
  parent.children = parent.children.map((node) => {
    if ('children' in node) visit(node as { children: RootContent[] });
    if (node.type !== 'blockquote') return node;

    const first = node.children[0];
    const text = first?.type === 'paragraph' ? first.children[0] : undefined;
    const marker = text?.type === 'text' ? text.value.match(/^\[!(\w+)\][ \t]*\n?/) : null;
    const alert = marker && alerts[marker[1].toUpperCase()];
    if (!alert || first?.type !== 'paragraph' || text?.type !== 'text') return node;

    text.value = text.value.slice(marker[0].length);
    if (!text.value) first.children.shift();
    const children = first.children.length > 0 ? node.children : node.children.slice(1);

    return {
      type: 'mdxJsxFlowElement',
      name: 'Callout',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'type', value: alert.type },
        { type: 'mdxJsxAttribute', name: 'title', value: alert.title },
      ],
      children,
    } as unknown as RootContent;
  });
}
