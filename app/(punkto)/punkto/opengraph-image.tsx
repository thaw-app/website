import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Its own share picture, not the site's (lib/og.tsx), to match the page.
export const alt = 'Punkto: hides the menu bar items you choose.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const asset = (path: string) => readFile(join(process.cwd(), 'assets', path));

const ink = { ground: '#f7f7f4', strong: '#0a0a09', muted: '#6b6a66' };

export default async function Image() {
  const [icon, regular] = await Promise.all([
    asset('punkto-icon-light.png'),
    asset('fonts/SchibstedGrotesk-400.ttf'),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 120px',
        background: ink.ground,
        fontFamily: 'Schibsted Grotesk',
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: this is drawn to a picture, not served as a page */}
      <img
        src={`data:image/png;base64,${icon.toString('base64')}`}
        alt=""
        width={144}
        height={144}
      />
      <div
        style={{
          display: 'flex',
          marginTop: 44,
          fontSize: 68,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          color: ink.strong,
        }}
      >
        Hides the menu bar items you choose.
      </div>
      <div style={{ display: 'flex', marginTop: 22, fontSize: 32, color: ink.muted }}>
        Punkto, from the makers of Thaw.
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Schibsted Grotesk', data: regular, weight: 400 }] },
  );
}
