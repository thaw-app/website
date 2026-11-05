'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Choice } from '@/components/choice';
import { choiceClass } from '@/components/choice-style';
import {
  compose,
  type Dye,
  dyes,
  fromPreset,
  ico,
  type Preset,
  png,
  presets,
  rasterise,
  type Settings,
  svgUrl,
  zip,
} from '@/lib/icon-generator';

const SIZES = [64, 32, 16];

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b py-1.5 text-sm last:border-b-0">
      <span className="text-fd-muted-foreground">{label}</span>
      <div className="ml-auto flex min-w-0 items-center justify-end gap-2">{children}</div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col border-t px-5 pt-4 pb-3">
      <legend className="sr-only">{label}</legend>
      <p aria-hidden className="mb-1 text-sm font-medium">
        {label}
      </p>
      {children}
    </fieldset>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 border-b py-1.5 text-sm last:border-b-0">
      <span className="text-fd-muted-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="generator-check"
      />
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 border-b py-1.5 text-sm last:border-b-0">
      <span className="text-fd-muted-foreground">{label}</span>
      <span className="flex items-center gap-3">
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="generator-range w-32 sm:w-36"
        />
        <span className="w-10 text-right font-mono text-xs tabular-nums text-fd-muted-foreground">
          {value}
          {unit}
        </span>
      </span>
    </label>
  );
}

function Colour({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="color"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="generator-colour"
    />
  );
}

/**
 * /generate: Thaw's cube, made into an icon of any kind. The settings are on the right, the
 * icon and what it looks like small on the left, and the files are made in the browser.
 */
export function IconGenerator() {
  const [settings, setSettings] = useState<Settings>(() => fromPreset('app'));
  const [preset, setPreset] = useState<Preset | null>('app');
  const [small, setSmall] = useState<string[]>([]);
  const [px, setPx] = useState(1024);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [svg, setSvg] = useState('');

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((was) => ({ ...was, [key]: value }));
    setPreset(null);
  };
  const choose = (name: Preset) => {
    setSettings(fromPreset(name));
    setPreset(name);
  };

  // The papel cube is measured in the page, so the icon is drawn once the page is running.
  useEffect(() => setSvg(compose(settings)), [settings]);

  useEffect(() => {
    if (!svg) return;
    let current = true;
    (async () => {
      const urls: string[] = [];
      for (const n of SIZES) urls.push((await rasterise(svg, n * 2)).toDataURL());
      if (current) setSmall(urls);
    })();
    return () => {
      current = false;
    };
  }, [svg]);

  const url = useMemo(() => (svg ? svgUrl(svg) : ''), [svg]);
  const s = settings;
  const papel = s.style === 'papel';

  // One file at a time, and a failure is said in words, not left as a button that did nothing.
  async function run(drawing: string, make: () => Promise<string> | string) {
    setBusy(true);
    setStatus(drawing);
    try {
      setStatus(await make());
    } catch (error) {
      setStatus(`The file could not be made: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPng() {
    const n = Math.min(4096, Math.max(16, Math.round(px) || 1024));
    save(
      new Blob([await png(await rasterise(svg, n))] as BlobPart[], { type: 'image/png' }),
      `thaw-icon-${n}.png`,
    );
    return `Saved a ${n} × ${n} PNG.`;
  }
  function downloadSvg() {
    save(new Blob([svg], { type: 'image/svg+xml' }), 'thaw-icon.svg');
    return papel
      ? 'Saved the SVG. The paper is drawn with SVG filters, which some design apps show flat.'
      : 'Saved the SVG.';
  }
  async function downloadIconset() {
    const files = [];
    for (const n of [16, 32, 128, 256, 512]) {
      files.push({
        name: `Thaw.iconset/icon_${n}x${n}.png`,
        data: await png(await rasterise(svg, n)),
      });
      files.push({
        name: `Thaw.iconset/icon_${n}x${n}@2x.png`,
        data: await png(await rasterise(svg, n * 2)),
      });
    }
    save(zip(files), 'Thaw.iconset.zip');
    return 'Saved. Unzip it, then run iconutil -c icns Thaw.iconset for an .icns.';
  }
  async function downloadFavicons() {
    const at = async (n: number) => png(await rasterise(svg, n));
    const ico16 = await at(16);
    const ico32 = await at(32);
    const files = [
      {
        name: 'favicon.ico',
        data: ico([
          { size: 16, data: ico16 },
          { size: 32, data: ico32 },
          { size: 48, data: await at(48) },
        ]),
      },
      { name: 'favicon-16.png', data: ico16 },
      { name: 'favicon-32.png', data: ico32 },
      { name: 'apple-touch-icon.png', data: await at(180) },
      { name: 'icon-192.png', data: await at(192) },
      { name: 'icon-512.png', data: await at(512) },
      { name: 'icon.svg', data: new TextEncoder().encode(svg) },
    ];
    save(zip(files), 'thaw-favicons.zip');
    return 'Saved favicon.ico, the PNG sizes, an apple-touch-icon and an SVG.';
  }

  return (
    <div className="flex flex-col gap-6">
      <Choice
        legend="Start from"
        options={(Object.keys(presets) as Preset[]).map((id) => ({ id, label: presets[id].label }))}
        value={preset}
        onChange={(id) => id && choose(id)}
      />

      <div className="grid border lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section
          aria-label="The icon"
          className="flex flex-col lg:sticky lg:top-16 lg:h-[calc(100dvh-5rem)] lg:max-h-[52rem] lg:self-start"
        >
          <div className="generator-stage flex flex-1 items-center justify-center p-8 sm:p-12">
            <div className="relative aspect-square w-full max-w-[26rem]">
              {url ? (
                // biome-ignore lint/performance/noImgElement: a data URL drawn in the page
                <img src={url} alt="The icon, as set on the right" className="size-full" />
              ) : (
                <p className="grid size-full place-items-center text-sm text-fd-muted-foreground">
                  Drawing the icon…
                </p>
              )}
              {s.guide !== 'none' && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 border-[1.5px] border-dashed border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"
                  style={{ borderRadius: s.guide === 'circle' ? '50%' : '22%' }}
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6 border-t px-5 py-4">
            {(['light', 'dark'] as const).map((tone) => (
              <div key={tone} className="flex flex-col gap-2">
                <span className="text-xs text-fd-muted-foreground">
                  {tone === 'light' ? 'On light' : 'On dark'}
                </span>
                <div
                  className={`flex items-end gap-3 p-3 ${tone === 'light' ? 'bg-[#f2f2f2]' : 'bg-[#0a0a0a] ring-1 ring-fd-border'}`}
                >
                  {SIZES.map((n, i) => (
                    <span
                      key={n}
                      title={`${n} px`}
                      className="block"
                      style={{ width: n, height: n }}
                    >
                      {small[i] && (
                        // biome-ignore lint/performance/noImgElement: a canvas drawn in the page
                        <img src={small[i]} alt="" width={n} height={n} className="block" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => run('Drawing the PNG…', downloadPng)}
                disabled={!svg || busy}
                className="tap press bg-fd-foreground px-4 py-2 text-sm font-medium text-fd-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                Download PNG
              </button>
              <label className="flex items-center gap-2 border px-3 py-1.5 text-sm text-fd-muted-foreground">
                <input
                  type="number"
                  min={16}
                  max={4096}
                  step={16}
                  value={px}
                  onChange={(event) => setPx(Number(event.target.value))}
                  aria-label="PNG size in pixels"
                  className="w-14 bg-transparent text-right text-base text-fd-foreground tabular-nums sm:text-sm"
                />
                px
              </label>
              <button
                type="button"
                onClick={() => run('Saving…', downloadSvg)}
                disabled={!svg || busy}
                className={choiceClass(false)}
              >
                SVG
              </button>
              <button
                type="button"
                onClick={() => run('Drawing ten sizes…', downloadIconset)}
                disabled={!svg || busy}
                className={choiceClass(false)}
              >
                macOS iconset
              </button>
              <button
                type="button"
                onClick={() => run('Drawing the favicons…', downloadFavicons)}
                disabled={!svg || busy}
                className={choiceClass(false)}
              >
                Favicons
              </button>
            </div>
            <p role="status" className="min-h-5 text-sm text-fd-muted-foreground">
              {status}
            </p>
          </div>
        </section>

        <div className="border-t lg:border-t-0 lg:border-l">
          <div className="px-5 py-4">
            <Choice
              legend="Style"
              options={[
                { id: 'plain', label: 'Thaw' },
                { id: 'papel', label: 'Papel picado' },
              ]}
              value={s.style}
              onChange={(id) => set('style', id)}
            />
          </div>

          <Group label="Shape">
            <div className="py-2">
              <Choice
                legend="Shape"
                options={[
                  { id: 'squircle', label: 'macOS' },
                  { id: 'rounded', label: 'Rounded' },
                  { id: 'circle', label: 'Circle' },
                  { id: 'square', label: 'Square' },
                ]}
                value={s.shape}
                onChange={(id) => set('shape', id)}
              />
            </div>
            {s.shape === 'rounded' && (
              <Slider
                label="Corners"
                value={s.radius}
                min={0}
                max={50}
                unit="%"
                onChange={(v) => set('radius', v)}
              />
            )}
            <Slider
              label="Margin"
              value={s.margin}
              min={0}
              max={200}
              onChange={(v) => set('margin', v)}
            />
            <Toggle
              label="Shadow under it"
              checked={s.tileShadow}
              onChange={(v) => set('tileShadow', v)}
            />
            <Row label="Crop guide">
              <Choice
                legend="Crop guide"
                options={[
                  { id: 'none', label: 'None' },
                  { id: 'circle', label: 'Circle' },
                  { id: 'rounded', label: 'Rounded' },
                ]}
                value={s.guide}
                onChange={(id) => setSettings((was) => ({ ...was, guide: id }))}
              />
            </Row>
          </Group>

          {!papel && (
            <>
              <Group label="Background">
                <div className="py-2">
                  <Choice
                    legend="Background"
                    options={[
                      { id: 'light', label: 'Orange' },
                      { id: 'dark', label: 'Dark orange' },
                      { id: 'gradient', label: 'Gradient' },
                      { id: 'solid', label: 'Colour' },
                      { id: 'none', label: 'None' },
                    ]}
                    value={s.bg}
                    onChange={(id) => set('bg', id)}
                  />
                </div>
                {(s.bg === 'gradient' || s.bg === 'solid') && (
                  <Row label={s.bg === 'gradient' ? 'Colours' : 'Colour'}>
                    <Colour label="First colour" value={s.bg1} onChange={(v) => set('bg1', v)} />
                    {s.bg === 'gradient' && (
                      <Colour label="Second colour" value={s.bg2} onChange={(v) => set('bg2', v)} />
                    )}
                  </Row>
                )}
                {s.bg === 'gradient' && (
                  <Slider
                    label="Angle"
                    value={s.bgAngle}
                    min={0}
                    max={360}
                    unit="°"
                    onChange={(v) => set('bgAngle', v)}
                  />
                )}
                {s.bg !== 'none' && (
                  <Toggle
                    label="Glass highlight"
                    checked={s.sheen}
                    onChange={(v) => set('sheen', v)}
                  />
                )}
              </Group>

              <Group label="Cube">
                <div className="py-2">
                  <Choice
                    legend="Cube"
                    options={[
                      { id: 'layers', label: 'As in the app' },
                      { id: 'flat', label: 'One colour' },
                      { id: 'cutout', label: 'Cut out' },
                    ]}
                    value={s.mark}
                    onChange={(id) => set('mark', id)}
                  />
                </div>
                {(s.mark === 'flat' || (s.mark === 'cutout' && s.bg === 'none')) && (
                  <Row label="Colour">
                    <Colour
                      label="Cube colour"
                      value={s.markColour}
                      onChange={(v) => set('markColour', v)}
                    />
                  </Row>
                )}
                {s.mark === 'layers' && (
                  <>
                    <Toggle label="Faces" checked={s.faces} onChange={(v) => set('faces', v)} />
                    <Toggle
                      label="Shadows between layers"
                      checked={s.layerShadow}
                      onChange={(v) => set('layerShadow', v)}
                    />
                  </>
                )}
                <Slider
                  label="Size"
                  value={s.size}
                  min={40}
                  max={140}
                  unit="%"
                  onChange={(v) => set('size', v)}
                />
                <Slider
                  label="Up or down"
                  value={s.shift}
                  min={-120}
                  max={120}
                  onChange={(v) => set('shift', v)}
                />
              </Group>
            </>
          )}

          {papel && (
            <>
              <Group label="Paper">
                <div className="flex flex-wrap gap-2 py-2.5">
                  {(Object.keys(dyes) as Dye[]).map((dye) => {
                    const colours = dyes[dye].colours ?? [s.dye1, s.dye2];
                    return (
                      <button
                        key={dye}
                        type="button"
                        aria-pressed={s.dye === dye}
                        aria-label={dyes[dye].label}
                        title={dyes[dye].label}
                        onClick={() => set('dye', dye)}
                        className={`tap press size-7 ring-offset-2 ring-offset-fd-background ${s.dye === dye ? 'ring-2 ring-fd-foreground' : 'ring-1 ring-fd-border hover:ring-fd-muted-foreground'}`}
                        style={{
                          background:
                            dyes[dye].colours === null
                              ? `conic-gradient(${colours[0]} 0 50%, ${colours[1]} 0)`
                              : `linear-gradient(${colours[0]}, ${colours[1]})`,
                        }}
                      />
                    );
                  })}
                </div>
                {s.dye === 'custom' && (
                  <Row label="Top and foot">
                    <Colour
                      label="Top of the sheet"
                      value={s.dye1}
                      onChange={(v) => set('dye1', v)}
                    />
                    <Colour
                      label="Foot of the sheet"
                      value={s.dye2}
                      onChange={(v) => set('dye2', v)}
                    />
                  </Row>
                )}
                <Row label="Behind it">
                  <Choice
                    legend="Behind the paper"
                    options={[
                      { id: 'dark', label: 'Brown' },
                      { id: 'custom', label: 'Colour' },
                      { id: 'none', label: 'None' },
                    ]}
                    value={s.backing}
                    onChange={(id) => set('backing', id)}
                  />
                </Row>
                {s.backing === 'custom' && (
                  <Row label="Colour">
                    <Colour
                      label="Behind the paper"
                      value={s.backingColour}
                      onChange={(v) => set('backingColour', v)}
                    />
                  </Row>
                )}
                <Slider
                  label="Crumple"
                  value={s.crumple}
                  min={0}
                  max={6}
                  step={0.2}
                  onChange={(v) => set('crumple', v)}
                />
                <Toggle
                  label="Shadow behind the paper"
                  checked={s.lift}
                  onChange={(v) => set('lift', v)}
                />
                <div className="py-2.5">
                  <button
                    type="button"
                    onClick={() => set('seed', Math.floor(Math.random() * 900) + 1)}
                    className={choiceClass(false)}
                  >
                    Crumple it again
                  </button>
                </div>
              </Group>

              <Group label="Cuts">
                <Row label="Detail">
                  <Choice
                    legend="Detail"
                    options={[
                      { id: 'fine', label: 'Fine' },
                      { id: 'bold', label: 'Bold' },
                    ]}
                    value={s.detail}
                    onChange={(id) => set('detail', id)}
                  />
                </Row>
                <Row label="Kept inside">
                  <Choice
                    legend="Cuts kept inside"
                    options={[
                      { id: 'shape', label: 'Shape' },
                      { id: 'circle', label: 'Circle' },
                      { id: 'rounded', label: 'Rounded' },
                    ]}
                    value={s.clear}
                    onChange={(id) => set('clear', id)}
                  />
                </Row>
                <Slider
                  label="Window"
                  value={s.window}
                  min={130}
                  max={200}
                  onChange={(v) => set('window', v)}
                />
                <Slider
                  label="Cube"
                  value={s.fit}
                  min={55}
                  max={110}
                  unit="%"
                  onChange={(v) => set('fit', v)}
                />
                <Row label="Ties">
                  <Choice
                    legend="Ties"
                    options={[
                      { id: '0', label: 'None' },
                      { id: '6', label: '6' },
                      { id: '12', label: '12' },
                    ]}
                    value={String(s.ties)}
                    onChange={(id) => set('ties', Number(id))}
                  />
                </Row>
                <Toggle label="Ring of petals" checked={s.ring} onChange={(v) => set('ring', v)} />
                <Toggle
                  label="Border of diamonds"
                  checked={s.border}
                  onChange={(v) => set('border', v)}
                />
                <Toggle
                  label="Flowers in the corners"
                  checked={s.corners}
                  onChange={(v) => set('corners', v)}
                />
                <Toggle
                  label="Teardrops at the foot"
                  checked={s.foot}
                  onChange={(v) => set('foot', v)}
                />
              </Group>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
