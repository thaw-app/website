'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { docsRoute, links, products, repoUrl } from '@/lib/shared';
import { checkedAt, checkTiming, type ShapeKind } from './model';
import { optionsFor } from './thaw-options';
import definitions from './thaw-panes.json';
import { group, Menu, PopUp, push, Switch } from './thaw-ui';

/**
 * One element of a settings pane, as read from the real window by
 * reference/build-panes.cjs. Positions are points from the pane's top left.
 */
export interface PaneItem {
  t: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  label?: string;
  on?: boolean;
  multi?: boolean;
  value?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  src?: string;
  shape?: string;
  up?: boolean;
  /** 1 is body text, 2 supporting text, 3 fainter still. */
  tone?: number;
  /** A colour of the element's own, per appearance, where it is not the theme's. */
  dark?: string;
  light?: string;
  seps?: number[];
  off?: boolean;
  align?: string;
  mono?: boolean;
  bold?: boolean;
  /** A screen with a camera housing, as a MacBook's own has. */
  notched?: boolean;
  /** Corner radius, for an image that has one. */
  round?: number;
}

export interface PaneDefinition {
  id: string;
  name: string;
  summary: string;
  height: number;
  items: PaneItem[];
}

export const paneDefinitions = definitions as PaneDefinition[];

/** What the visitor has changed in a pane: element index to its new value. */
export type PaneValues = Record<number, boolean | number | string>;

const images = '/desktop/thaw/img';

/** The font size a line of the given height is set in, in the app's type scale. */
function fontSize(height: number) {
  const single: Record<number, number> = { 13: 10, 14: 11, 15: 12, 16: 13, 17: 14, 18: 15, 20: 17 };
  if (height <= 21) return single[Math.round(height)] ?? Math.round(height * 0.8);
  if (height > 40 && height < 60) return 46; // the app's name on About
  if (height % 14 === 0) return 11;
  if (height % 13 === 0) return 10;
  return 13;
}

const lineHeight: Record<number, number> = { 10: 13, 11: 14, 12: 15, 13: 16 };

function frame(item: PaneItem, extra?: CSSProperties): CSSProperties {
  return { left: item.x, top: item.y, width: item.w, height: item.h, ...extra };
}

/** The frame for a ThawUI control, which is not placed until it is told to be. */
function place(item: PaneItem, extra?: CSSProperties): CSSProperties {
  return { position: 'absolute', ...frame(item, extra) };
}

/** A push button at the size the pane's are set in. */
const button = `${push} text-[13px] whitespace-nowrap`;

/** The element's own colours, handed to CSS to pick between by appearance. */
function tint(item: PaneItem): CSSProperties {
  return item.dark ? ({ '--own-dark': item.dark, '--own-light': item.light } as CSSProperties) : {};
}

function Captured({ item }: { item: PaneItem }) {
  return (
    <>
      {(['light', 'dark'] as const).map((mode) => (
        // biome-ignore lint/performance/noImgElement: a small cut-out at its exact size
        <img
          key={mode}
          src={`${images}/${item.src}-${mode}.webp`}
          alt=""
          className={`thaw-shot thaw-pane-${mode}`}
        />
      ))}
    </>
  );
}

const thawRepo = repoUrl('thaw');

/**
 * Where the About pane's buttons lead, by the name on each. The app's What's New
 * and Credits are windows of its own; here they are the site's pages that hold the
 * same thing, the changelog and the people on the community page. The rest are the
 * app's own links (Constants.swift and its Info.plist).
 */
const aboutLinks: Record<string, string> = {
  'What’s New': '/changelog',
  'Report a Bug': `${thawRepo}/issues`,
  'Source Code': thawRepo,
  Credits: '/community',
  'Support Thaw': links.sponsors,
};

/** The menu under About's "more" button, in the app's order; null is a divider. */
const aboutMore: ({ label: string; href: string } | null)[] = [
  // The app opens this file on GitHub; the site has it as a page.
  { label: 'Frequent Issues', href: `${docsRoute}/thaw/frequent-issues` },
  null,
  { label: 'Join the Discord', href: links.discord },
  { label: 'Help Translate', href: links.crowdin },
  null,
  { label: 'Acknowledgements', href: '/community' },
];

/** A link drawn as one of the pane's controls: a page of this site, or a new tab for another. */
function Go({
  href,
  className,
  style,
  label,
  children,
}: {
  href: string;
  className: string;
  style: CSSProperties;
  label?: string;
  children: ReactNode;
}) {
  return href.startsWith('/') ? (
    <Link href={href} aria-label={label} className={className} style={style}>
      {children}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

/** How far an open disclosure pushes what is under it: one row of the form. */
const disclosureRow = 37;

interface PaneProps {
  pane: PaneDefinition;
  values: PaneValues;
  onChange: (index: number, value: boolean | number | string, item: PaneItem) => void;
  /** Pushes everything at or below `after` down by `by` points, to make room. */
  shift?: { after: number; by: number };
  /** Called for a control that has nothing behind it here, with its name. */
  onInert: (name: string) => void;
  /** Says a line of its own in the same place. */
  onNotice: (message: string) => void;
  /** Live content drawn over the pane, such as the Layout pane's bars. */
  children?: ReactNode;
}

/** Draws a pane from its definition, with every control working. */
export function Pane({ pane, values, onChange, onInert, onNotice, shift, children }: PaneProps) {
  const router = useRouter();
  // About: the copy button's tick, the check for updates, and the "more" menu.
  const about = pane.id === 'about';
  const [copied, setCopied] = useState(false);
  const [check, setCheck] = useState<'idle' | 'checking' | 'answered'>('idle');
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (run: () => void, after: number) => {
    timers.current.push(setTimeout(run, after));
  };

  // The first two lines of what the app copies; its third names the Mac's macOS, which a
  // web page does not know. Each value is the text on the row its label names.
  async function copyVersion() {
    const shown = (label: string) => {
      const named = pane.items.find((item) => item.t === 'text' && item.text === label);
      return pane.items.find((item) => item.mono && item.y === named?.y)?.text ?? '';
    };
    try {
      await navigator.clipboard.writeText(
        `Thaw ${shown('Version')} (${shown('Build')})\nCommit: ${shown('Commit')}`,
      );
      setCopied(true);
      later(() => setCopied(false), 1200);
    } catch {
      onNotice('The browser did not allow the copy.');
    }
  }

  // Nothing is asked of any server: the demo is not an updater, so a check only takes its
  // moment and notes the time on the row beside the button, and says nothing of versions.
  const checkedIndex = pane.items.findIndex(
    (item) => item.t === 'text' && /^(Last checked|Not checked yet)/.test(item.text ?? ''),
  );
  function checkNow() {
    setCheck('checking');
    later(() => {
      if (checkedIndex >= 0)
        onChange(checkedIndex, checkedAt(Date.now()), pane.items[checkedIndex]);
      setCheck('answered');
      later(() => setCheck('idle'), checkTiming.answer);
    }, checkTiming.checking);
  }

  // The disclosures that are open, by their place in the pane.
  const [opened, setOpened] = useState<number[]>([]);
  let items = shift
    ? pane.items.map((item) => (item.y >= shift.after ? { ...item, y: item.y + shift.by } : item))
    : pane.items;
  // An open disclosure has a row under it: everything below moves down by that much, and
  // the box it sits in grows to hold it, taking its dividers down too.
  for (const at of opened) {
    const opener = items[at];
    if (!opener) continue;
    items = items.map((item, index) => {
      if (index === at) return item;
      if (item.y > opener.y) return { ...item, y: item.y + disclosureRow };
      if (item.t === 'box' && item.y <= opener.y && item.y + item.h > opener.y) {
        return {
          ...item,
          h: item.h + disclosureRow,
          seps: item.seps?.map((top) => (item.y + top > opener.y ? top + disclosureRow : top)),
        };
      }
      return item;
    });
  }
  const grown = (shift?.by ?? 0) + opened.length * disclosureRow;

  // A radio segment turns its neighbours in the same strip off.
  function choose(index: number, item: PaneItem) {
    if (item.multi) {
      onChange(index, !(values[index] ?? item.on), item);
      return;
    }
    items.forEach((other, at) => {
      // Screens differ in size, so they count as one strip wherever they sit.
      const sameStrip =
        other.t === item.t && (item.t === 'display' || Math.abs(other.y - item.y) < 2);
      if (sameStrip) onChange(at, at === index, other);
    });
  }

  return (
    <div className="thaw-scroll thaw-pane-in" key={pane.id}>
      <div className="thaw-scroll-body" style={{ height: pane.height + grown }}>
        {children}
        {items.map((item, index) => {
          const key = `${item.t}-${index}`;
          const on = (values[index] ?? item.on) === true;

          switch (item.t) {
            case 'box':
              return (
                <div
                  key={key}
                  className={`${group} ${item.dark ? 'thaw-own-fill' : ''}`}
                  style={place(item, tint(item))}
                >
                  {item.seps?.map((top) => (
                    <i key={top} className="thaw-sep" style={{ top }} />
                  ))}
                </div>
              );
            case 'bar':
              return (
                <div key={key} className="thaw-bar thaw-own-fill" style={frame(item, tint(item))} />
              );
            case 'heading': {
              const size = fontSize(item.h);
              return (
                <h3
                  key={key}
                  className="thaw-el thaw-h"
                  style={frame(item, {
                    fontSize: size,
                    lineHeight: `${item.h}px`,
                    width: 'max-content',
                    fontWeight: size > 30 ? 700 : 600,
                  })}
                >
                  {item.text}
                </h3>
              );
            }
            case 'text': {
              if (item.text && /^(ALPHA|BETA|NEW)$/.test(item.text)) {
                return (
                  <span
                    key={key}
                    className="thaw-el thaw-beta"
                    style={{ left: item.x - 5, top: item.y - 2, margin: 0 }}
                  >
                    {item.text}
                  </span>
                );
              }
              const size = fontSize(item.h);
              const oneLine = item.h <= 21;
              // The row beside Check Now says how the check is going, then when it was made.
              const checking = about && index === checkedIndex;
              const text = !checking
                ? item.text
                : check === 'checking'
                  ? 'Checking…'
                  : check === 'answered'
                    ? 'Up to date'
                    : typeof values[index] === 'string'
                      ? values[index]
                      : item.text;
              return (
                <p
                  key={key}
                  role={checking ? 'status' : undefined}
                  className={`thaw-el thaw-tone-${item.tone ?? (size >= 13 ? 1 : 2)} ${
                    item.dark ? 'thaw-own-ink' : ''
                  }`}
                  style={frame(item, {
                    ...tint(item),
                    fontSize: size,
                    lineHeight: `${oneLine ? item.h : (lineHeight[size] ?? 16)}px`,
                    whiteSpace: oneLine ? 'nowrap' : 'normal',
                    width: oneLine && item.align !== 'right' ? 'max-content' : item.w + 2,
                    textAlign: item.align === 'right' ? 'right' : undefined,
                    fontFamily: item.mono
                      ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
                      : undefined,
                    fontWeight: item.bold ? 600 : undefined,
                  })}
                >
                  {text}
                </p>
              );
            }
            case 'switch':
              return (
                <Switch
                  key={key}
                  on={on}
                  label={item.label || labelBefore(items, index)}
                  disabled={item.off}
                  onChange={() => onChange(index, !on, item)}
                  // A point taller than the frame the window reports, and centred on it.
                  style={{ position: 'absolute', left: item.x, top: item.y - 0.5 }}
                />
              );
            case 'check':
              return (
                <input
                  key={key}
                  type="checkbox"
                  checked={on}
                  aria-label={item.label}
                  onChange={() => onChange(index, !on, item)}
                  className="thaw-el thaw-check"
                  style={frame(item)}
                />
              );
            case 'segments':
              return <div key={key} className="thaw-el thaw-segments" style={frame(item)} />;
            case 'segment':
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(index, item)}
                  className="thaw-el thaw-segment"
                  style={frame(item)}
                >
                  {item.text}
                </button>
              );
            case 'display':
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(index, item)}
                  className="thaw-el thaw-display"
                  style={frame(item)}
                >
                  {item.notched && <i />}
                  <span>{item.text}</span>
                </button>
              );
            case 'shape':
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on || (values[index] === undefined && item.shape === 'split')}
                  onClick={() => choose(index, item)}
                  className="thaw-el thaw-shape"
                  style={frame(item)}
                >
                  <ShapeDrawing shape={item.shape as ShapeKind} />
                  <span>{item.text}</span>
                </button>
              );
            case 'popup':
            case 'menu': {
              const name = item.label?.split(', ')[0] || labelBefore(items, index);
              return (
                <PopUp
                  key={key}
                  label={item.label || name}
                  options={optionsFor(pane.id, item.label ?? '')}
                  chosen={typeof values[index] === 'string' ? (values[index] as string) : item.text}
                  pull={item.t === 'menu'}
                  onChoose={(option) => onChange(index, option, item)}
                  onPress={() => onInert(name)}
                  style={place(item)}
                />
              );
            }
            case 'button': {
              const href = about ? aboutLinks[item.text ?? ''] : undefined;
              if (href) {
                return (
                  <Go
                    key={key}
                    href={href}
                    className={`${button} flex items-center justify-center`}
                    style={place(item)}
                  >
                    {item.text}
                  </Go>
                );
              }
              const checks = about && item.text === 'Check Now';
              return (
                <button
                  key={key}
                  type="button"
                  disabled={item.off || (checks && check === 'checking')}
                  onClick={() => (checks ? checkNow() : onInert(item.text ?? ''))}
                  className={button}
                  style={place(item)}
                >
                  {item.text}
                </button>
              );
            }
            case 'iconbutton':
            case 'item': {
              const href = about ? aboutLinks[item.label ?? ''] : undefined;
              if (href) {
                return (
                  <Go
                    key={key}
                    href={href}
                    label={item.label}
                    className="thaw-el thaw-iconbutton"
                    style={frame(item)}
                  >
                    <Captured item={item} />
                  </Go>
                );
              }
              if (about && item.label === 'Copy version information') {
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={copied ? 'Copied' : item.label}
                    title={
                      copied ? 'Copied' : 'Copy the version, build and commit for a bug report'
                    }
                    onClick={copyVersion}
                    className={`thaw-el thaw-iconbutton ${copied ? 'thaw-copied' : ''}`}
                    style={frame(item)}
                  >
                    <Captured item={item} />
                  </button>
                );
              }
              if (about && item.label === 'More about Thaw') {
                return (
                  <span key={key}>
                    <button
                      type="button"
                      aria-label={item.label}
                      aria-haspopup="menu"
                      aria-expanded={moreOpen}
                      onClick={() => setMoreOpen(!moreOpen)}
                      className="thaw-el thaw-iconbutton"
                      style={frame(item)}
                    >
                      <Captured item={item} />
                    </button>
                    {moreOpen && (
                      <Menu
                        label={item.label}
                        align="left"
                        rows={aboutMore.map(
                          (row) =>
                            row && {
                              label: row.label,
                              onPick: () =>
                                row.href.startsWith('/')
                                  ? router.push(row.href)
                                  : window.open(row.href, '_blank', 'noopener'),
                            },
                        )}
                        // Just under the button, from its left edge, in the pane's own points.
                        style={{ left: item.x, top: item.y + item.h + 2, marginTop: 0 }}
                        onClose={closeMore}
                      />
                    )}
                  </span>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={item.label}
                  title={item.t === 'item' ? item.label : undefined}
                  onClick={() => onInert(item.label ?? '')}
                  className={`thaw-el ${item.t === 'item' ? 'thaw-item' : 'thaw-iconbutton'}`}
                  style={frame(item)}
                >
                  <Captured item={item} />
                </button>
              );
            }
            case 'image':
              return (
                <div
                  key={key}
                  title={item.label || undefined}
                  className="thaw-el"
                  style={frame(item, { borderRadius: item.round, overflow: 'hidden' })}
                >
                  <Captured item={item} />
                </div>
              );
            case 'step':
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={item.label}
                  onClick={() => onInert(item.label ?? '')}
                  className={`thaw-el thaw-step ${item.up ? 'thaw-step-up' : ''}`}
                  style={frame(item)}
                />
              );
            case 'slider':
              return (
                <Slider
                  key={key}
                  item={item}
                  value={
                    typeof values[index] === 'number'
                      ? (values[index] as number)
                      : (item.value ?? 0)
                  }
                  onChange={(value) => onChange(index, value, item)}
                />
              );
            case 'field':
              return (
                <input
                  key={key}
                  aria-label={item.placeholder || labelBefore(items, index)}
                  placeholder={item.placeholder}
                  value={
                    typeof values[index] === 'string'
                      ? (values[index] as string)
                      : (item.text ?? '')
                  }
                  onChange={(event) => onChange(index, event.target.value, item)}
                  className="thaw-el thaw-field"
                  style={frame(item)}
                />
              );
            case 'plain':
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onInert(item.text ?? '')}
                  className="thaw-el thaw-plain"
                  style={frame(item, {
                    fontSize: fontSize(item.h),
                    lineHeight: `${item.h}px`,
                    width: 'max-content',
                  })}
                >
                  {item.text}
                </button>
              );
            case 'symbol':
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={item.label}
                  onClick={() => onInert(item.label ?? '')}
                  className="thaw-el thaw-symbol"
                  style={frame(item)}
                >
                  {item.text}
                </button>
              );
            case 'link': {
              const href = about ? aboutLinks[item.text ?? ''] : undefined;
              const style = frame(item, {
                fontSize: fontSize(item.h),
                lineHeight: `${item.h}px`,
                width: 'max-content',
              });
              return href ? (
                <Go key={key} href={href} className="thaw-el thaw-link" style={style}>
                  {item.text}
                </Go>
              ) : (
                <button
                  key={key}
                  type="button"
                  onClick={() => onInert(item.text ?? '')}
                  className="thaw-el thaw-link"
                  style={style}
                >
                  {item.text}
                </button>
              );
            }
            case 'disclosure': {
              const open = opened.includes(index);
              return (
                <span key={key}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpened(open ? opened.filter((at) => at !== index) : [...opened, index])
                    }
                    className="thaw-el thaw-disclosure"
                    // Not where the capture has it. The window reports the triangle in the
                    // margin, left of the box the row belongs to; the row is one of the box's
                    // own, so it starts at the box's padding, where the capture puts the name,
                    // with the triangle first and the name after it.
                    style={frame(item, { left: item.x + 22.5, width: 'max-content' })}
                  >
                    {item.text}
                  </button>
                  {/* What Thaw keeps under Spacers: its one button, until a spacer is added. */}
                  {open && (
                    <button
                      type="button"
                      onClick={() => onInert('Add Spacer')}
                      className={`${button} thaw-pane-in`}
                      style={{
                        position: 'absolute',
                        left: 30,
                        top: item.y + 29,
                        width: 92,
                        height: 24,
                      }}
                    >
                      Add Spacer
                    </button>
                  )}
                </span>
              );
            }
            case 'appicon':
              return (
                <Image
                  key={key}
                  src={products.thaw.icon}
                  alt=""
                  width={96}
                  className="thaw-el"
                  style={frame(item, { filter: 'none' })}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

/** A switch carries no name of its own: it takes the label of the row it ends. */
export function labelBefore(items: PaneItem[], index: number) {
  const item = items[index];
  const label = items.find(
    (other) => other.t === 'text' && Math.abs(other.y + other.h / 2 - (item.y + item.h / 2)) < 6,
  );
  return label?.text ?? '';
}

/** The picture of the menu bar on each shape choice, as Thaw draws them. */
function ShapeDrawing({ shape }: { shape: ShapeKind }) {
  return (
    <i className={`thaw-shape-drawing thaw-shape-${shape}`}>
      <b />
      {(shape === 'split' || shape === 'notch') && <b />}
      {shape === 'notch' && <u />}
    </i>
  );
}

/** Thaw's slider: a bar that fills from the left, with its value written on it. */
function Slider({
  item,
  value,
  onChange,
}: {
  item: PaneItem;
  value: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const min = item.min ?? 0;
  const max = item.max ?? 1;
  const whole = max - min > 2;

  function set(event: PointerEvent<HTMLDivElement>) {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box) return;
    const part = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const next = min + part * (max - min);
    onChange(whole ? Math.round(next) : Math.round(next * 100) / 100);
  }

  // The label is the value with its unit, such as "13 seconds". A slider named
  // for a side, such as Left, shows that name at one end and its points at the other.
  const named = !/\d/.test(item.text ?? '');
  const label = named
    ? `${item.text} ${value} pt`
    : (item.text ?? '').replace(/^-?[\d.,]+/, String(value));
  // The real control is drawn 24 points tall, whatever height it reports.
  const box = { ...item, y: item.y + item.h / 2 - 12, h: 24 };
  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        set(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) set(event);
      }}
      onKeyDown={(event) => {
        const step = whole ? 1 : (max - min) / 20;
        if (event.key === 'ArrowRight') onChange(Math.min(max, value + step));
        if (event.key === 'ArrowLeft') onChange(Math.max(min, value - step));
      }}
      className={`thaw-el thaw-slider ${named ? 'thaw-slider-named' : ''} ${
        item.text === 'Right' ? 'thaw-slider-reversed' : ''
      }`}
      style={frame(box)}
    >
      <i style={{ width: `${((value - min) / (max - min || 1)) * 100}%` }} />
      {named ? (
        <>
          <span>{item.text}</span>
          <span>{value} pt</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}
