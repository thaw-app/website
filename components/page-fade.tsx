import { type ReactNode, ViewTransition } from 'react';

/**
 * A page's own content, which fades out and the next page's in when a link is followed
 * (global.css, "From one page to the next"). It goes round what a page draws and not in a
 * layout: a layout stays where it is from page to page, so nothing in it would ever be
 * seen to leave or arrive. A browser without view transitions changes page at once, as
 * before.
 */
export function PageFade({ children }: { children: ReactNode }) {
  return <ViewTransition default="page">{children}</ViewTransition>;
}

/**
 * The same fade for a whole frame (the header's layout, the docs' sidebar and all), for the
 * step from one frame to another: from a page of the site into the docs, or from Thaw's
 * pages to Floe's. There the frame itself is what leaves and arrives, and the page inside
 * it is not seen to do either. Between two pages in one frame this does nothing, and the
 * page's own fade does the work.
 */
export function FrameFade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
