import { render } from 'pele';

/** A short name for a chart, so two diagrams on one page do not share ids. */
function idFor(chart: string) {
  let hash = 0;
  for (const character of chart) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return `d${(hash >>> 0).toString(36)}`;
}

/**
 * A mermaid code block from the docs, drawn as a diagram when the site is built: an SVG sent
 * with the page, and no script. Pele draws it, and its colours and fonts are the site's own
 * (global.css), so it follows light and dark without being drawn again. A wide diagram is
 * drawn twice, as it is and turned on its side for a narrow column, and the column's width
 * picks one. Pele escapes the text and drops links, so a diagram from a pull request
 * cannot put markup or a script on the page. One Pele cannot read is shown as its source.
 */
export function Mermaid({ chart }: { chart: string }) {
  const source = chart.replaceAll('\\n', '\n');
  const id = idFor(source);
  try {
    const wide = render(source, { idPrefix: `${id}w`, links: false, images: false });
    const narrow = render(source, {
      idPrefix: `${id}n`,
      links: false,
      images: false,
      autoDirection: true,
      maxWidth: 360,
    });
    const turned = narrow.width < wide.width;
    return (
      // On a phone the diagram keeps a size its words can be read at and scrolls sideways,
      // so the frame can be reached and scrolled from the keyboard too.
      <figure
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a frame that scrolls has to be reachable
        tabIndex={0}
        aria-label="Diagram"
        className="diagram not-prose @container my-6 overflow-x-auto"
      >
        <div
          className={turned ? 'hidden @5xl:block' : undefined}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: an SVG Pele drew, with the text escaped
          dangerouslySetInnerHTML={{ __html: wide.svg }}
        />
        {turned && (
          <div
            className="@5xl:hidden"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: an SVG Pele drew, with the text escaped
            dangerouslySetInnerHTML={{ __html: narrow.svg }}
          />
        )}
      </figure>
    );
  } catch {
    return (
      <pre>
        <code>{source}</code>
      </pre>
    );
  }
}
