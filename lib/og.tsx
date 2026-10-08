import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// The picture a link to the site is shared with: the page's own words on the site's black,
// in its type, under the icon of the product the page is about. Drawn when the site is
// built, so the fonts and icons are read from the repo and not fetched. The icons are
// small copies made for this (assets/og), since the full ones would be set into every picture.
const asset = (path: string) => readFile(join(process.cwd(), 'assets', path));

const regular = asset('fonts/SchibstedGrotesk-400.ttf');
const semibold = asset('fonts/SchibstedGrotesk-600.ttf');

const products = {
  thaw: { name: 'Thaw', icon: asset('og/thaw.png'), tone: '#fa9a2a' },
  floe: { name: 'Floe', icon: asset('og/floe.png'), tone: '#4f93ff' },
};

// Thaw's icon in characters, as at the top of the home page: scripts/capture-demo.mjs.
const cube = asset('og/cube.png');

const rule = 'rgba(255, 255, 255, 0.14)';
const frame = 44;

/** A small plus where two rules of the frame cross, as on the site's own grids. */
function Cross({ x, y }: { x: 'left' | 'right'; y: 'top' | 'bottom' }) {
  const arm = 9;
  return (
    <div
      style={{
        position: 'absolute',
        [x]: frame - arm,
        [y]: frame - arm,
        width: arm * 2 + 1,
        height: arm * 2 + 1,
        display: 'flex',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: arm,
          top: 0,
          width: 1,
          height: '100%',
          background: '#8a8a8a',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: arm,
          left: 0,
          height: 1,
          width: '100%',
          background: '#8a8a8a',
        }}
      />
    </div>
  );
}

export async function shareImage({
  title,
  description,
  product = 'thaw',
  label,
  withCube = false,
}: {
  title: string;
  description?: string;
  product?: keyof typeof products;
  /** What kind of page it is, beside the product's name: "Docs", say. */
  label?: string;
  /** The cube beside the words, for the site's own pages. */
  withCube?: boolean;
}) {
  const { name, icon, tone } = products[product];
  const picture = `data:image/png;base64,${(await icon).toString('base64')}`;
  const drawing = withCube ? `data:image/png;base64,${(await cube).toString('base64')}` : null;
  // A long title is set smaller so it and its description both fit, and smaller again
  // when the cube takes the right of the picture.
  const full = title.length > 52 ? 60 : title.length > 30 ? 72 : 84;
  const size = drawing ? Math.min(full, title.length > 30 ? 56 : 66) : full;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#000',
        color: '#ededed',
        fontFamily: 'Schibsted Grotesk',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: frame,
          border: `1px solid ${rule}`,
          display: 'flex',
        }}
      />
      <Cross x="left" y="top" />
      <Cross x="right" y="top" />
      <Cross x="left" y="bottom" />
      <Cross x="right" y="bottom" />
      {drawing && (
        // biome-ignore lint/performance/noImgElement: this is drawn to a picture, not served as a page
        <img
          src={drawing}
          alt=""
          width={452}
          height={452}
          style={{ position: 'absolute', right: frame + 26, top: (630 - 452) / 2 }}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: drawing ? 660 : '100%',
          padding: `${frame + 44}px ${drawing ? 0 : frame + 48}px ${frame + 44}px ${frame + 48}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* biome-ignore lint/performance/noImgElement: this is drawn to a picture, not served as a page */}
          <img src={picture} alt="" width={68} height={68} />
          <div style={{ display: 'flex', fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {name}
          </div>
          {label && (
            <div style={{ display: 'flex', fontSize: 30, color: '#a1a1a1', marginLeft: 4 }}>
              {label}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', width: 72, height: 6, background: tone }} />
          <div
            style={{
              display: 'flex',
              fontSize: size,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                display: 'flex',
                fontSize: 31,
                lineHeight: 1.35,
                color: '#a1a1a1',
                maxWidth: drawing ? 540 : 940,
                // Two lines at most; a longer one is cut with an ellipsis.
                lineClamp: 2,
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Schibsted Grotesk', data: await regular, weight: 400, style: 'normal' },
        { name: 'Schibsted Grotesk', data: await semibold, weight: 600, style: 'normal' },
      ],
    },
  );
}
