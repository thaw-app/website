'use client';

import {
  ChevronsUpDown,
  CircleArrowDown,
  CircleDashed,
  Clock,
  Eye,
  EyeOff,
  Power,
  Timer,
} from 'lucide-react';
import Image from 'next/image';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import floeIcon from '@/assets/floe-icon.png';
import thawIcon from '@/assets/thaw-icon.png';
import { ThawMark } from '@/components/thaw-mark';

/**
 * Punkto in a menu bar of its own: a click on its icon hides or shows the Hidden list, and a right
 * click opens its panel, rebuilt from PunktoPanel.swift. Lucide stands in for its SF Symbols.
 */

type ItemId = 'thaw' | 'floe' | 'droppy' | 'wifi' | 'control-center' | 'clock';

// The bar, left to right, without Punkto. Thaw is its cube, since its real item is a dot like
// Punkto's; the rest are the home page's white glyphs (public/desktop), inverted on light.
const items: { id: ItemId; name: string; file?: string; w?: number; h?: number }[] = [
  { id: 'thaw', name: 'Thaw' },
  { id: 'floe', name: 'Floe', file: 'thaw/items/floe', w: 16, h: 16 },
  { id: 'droppy', name: 'Droppy', file: 'thaw/items/droppy', w: 15, h: 18 },
  { id: 'wifi', name: 'WiFi', file: 'system/wifi', w: 16.5, h: 12 },
  { id: 'control-center', name: 'Control Center', file: 'system/control-center', w: 13.5, h: 13.5 },
  { id: 'clock', name: 'Clock' },
];
const punktoBefore: ItemId = 'wifi';

// The choices the panel offers, in its order (PunktoPanel.iconRow).
const iconStyles = ['Dot', 'Puck', 'Ellipsis', 'Eye', 'Image', 'None'] as const;
type IconStyle = (typeof iconStyles)[number];

const glyph = 'max-w-none shrink-0 invert dark:invert-0';
const ease = 'ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none';

export function PunktoMenuBar({ version }: { version: string }) {
  const [hidden, setHidden] = useState<Set<ItemId>>(
    () => new Set<ItemId>(['thaw', 'floe', 'droppy']),
  );
  const [hiding, setHiding] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [method, setMethod] = useState<'Full' | 'Native'>('Native');
  const [login, setLogin] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [rehide, setRehide] = useState(0);
  const [icon, setIcon] = useState<IconStyle>('Dot');
  const [picture, setPicture] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dotRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Hide Again After.
  useEffect(() => {
    if (hiding || rehide === 0) return;
    const timer = setTimeout(() => setHiding(true), rehide * 1000);
    return () => clearTimeout(timer);
  }, [hiding, rehide]);

  // Escape hands focus back to the icon.
  useEffect(() => {
    if (!picture) return;
    return () => URL.revokeObjectURL(picture);
  }, [picture]);

  useEffect(() => {
    if (!panelOpen) {
      setNote(null);
      return;
    }
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setPanelOpen(false);
      dotRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      // The caption's button toggles the panel itself.
      const inside = [panelRef, dotRef, captionRef].some((ref) => ref.current?.contains(target));
      if (!inside) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [panelOpen]);

  function move(id: ItemId) {
    setHidden((was) => {
      const next = new Set(was);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const onBar = (id: ItemId) => !(hiding && hidden.has(id));
  const hidingSomething = hiding && hidden.size > 0;

  const punkto = (
    <button
      key="punkto"
      ref={dotRef}
      type="button"
      aria-pressed={hidingSomething}
      aria-label="Punkto: hide the apps in its Hidden list"
      aria-expanded={panelOpen}
      aria-controls={panelOpen ? panelId : undefined}
      onClick={() => setHiding((was) => !was)}
      onContextMenu={(event) => {
        event.preventDefault();
        setPanelOpen((was) => !was);
      }}
      className={`grid h-7 shrink-0 place-items-center overflow-hidden rounded-md transition-[width,opacity] duration-300 ${ease} hover:bg-(--punkto-rule) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--punkto-strong) ${
        icon === 'None' ? 'pointer-events-none w-0 opacity-0' : 'w-7 opacity-100'
      } ${panelOpen ? 'bg-(--punkto-rule)' : ''}`}
      tabIndex={icon === 'None' ? -1 : 0}
    >
      <PunktoIcon style={icon} picture={picture} filled={hidingSomething} />
    </button>
  );

  return (
    <figure className="mt-14">
      <div className="relative">
        <div className="flex h-9 items-center justify-end overflow-hidden rounded-lg border border-(--punkto-rule) bg-(--punkto-bar) px-2.5 text-[13px] text-(--punkto-strong)">
          {/* Only there to place the bar; a phone shows the right side alone. */}
          <div className="mr-auto flex items-center gap-4 pl-1.5 max-sm:hidden" aria-hidden="true">
            {/* biome-ignore lint/performance/noImgElement: a glyph at its exact size */}
            <img
              src="/desktop/system/apple.webp"
              alt=""
              width={13}
              height={15}
              className={glyph}
              draggable={false}
            />
            <span className="font-semibold">Finder</span>
          </div>
          {items.flatMap((item) => [
            ...(item.id === punktoBefore ? [punkto] : []),
            <span
              key={item.id}
              // Out of reach of the keyboard and screen readers while hidden.
              inert={!onBar(item.id)}
              className={`grid shrink-0 transition-[grid-template-columns,opacity] duration-300 ${ease} ${
                onBar(item.id) ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
              }`}
            >
              <span className="flex min-w-0 justify-center overflow-hidden px-1.5 sm:px-2">
                <BarItem item={item} />
              </span>
            </span>,
          ])}
        </div>

        {panelOpen && (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Punkto"
            tabIndex={-1}
            className="punkto-panel absolute top-[calc(100%+6px)] right-3 z-20 w-[min(300px,calc(100%-24px))] py-2 outline-none"
          >
            <PanelLists
              items={items.filter((item) => !hidden.has(item.id))}
              title="Visible"
              action="Hide"
              onMove={move}
            />
            <PanelLists
              items={items.filter((item) => hidden.has(item.id))}
              title="Hidden"
              action="Show"
              onMove={move}
            />
            <Divider />
            <div className="px-3 py-1">
              <Row chip={<EyeOff />} title="Hiding">
                <Pills
                  label="Hiding"
                  options={['Full', 'Native'] as const}
                  value={method}
                  onChange={setMethod}
                />
              </Row>
              <p className="mt-0.5 pl-8 text-[11px] leading-snug text-(--panel-dim)">
                {method === 'Native'
                  ? 'Uses System Settings’ switches. Live Activities stay, but a few apps, such as Zoom, can’t be hidden.'
                  : 'Hides any app. Live Activities and the camera indicator leave the bar while apps are hidden.'}
              </p>
            </div>
            <div className="px-3">
              <Row chip={<Power />} active={login} title="Launch at Login">
                <Switch label="Launch at Login" on={login} onChange={setLogin} />
              </Row>
              <Row chip={<CircleArrowDown />} active={updates} title="Automatic Updates">
                <Switch label="Automatic Updates" on={updates} onChange={setUpdates} />
              </Row>
              <Row chip={<Timer />} active={rehide > 0} title="Hide Again After">
                <Pills
                  label="Hide Again After"
                  options={[0, 5, 10] as const}
                  format={(seconds) => (seconds === 0 ? 'Off' : `${seconds} s`)}
                  value={rehide}
                  onChange={setRehide}
                />
              </Row>
              <Row chip={<CircleDashed />} title="Menu Bar Icon">
                <span className="relative">
                  <select
                    aria-label="Menu Bar Icon"
                    value={icon}
                    onChange={(event) => setIcon(event.target.value as IconStyle)}
                    className="h-6 appearance-none rounded-full bg-(--panel-fill) py-0 pr-6 pl-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-(--panel-accent)"
                  >
                    {iconStyles.map((style) => (
                      <option key={style}>{style}</option>
                    ))}
                  </select>
                  <ChevronsUpDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2"
                  />
                </span>
              </Row>
            </div>
            {icon === 'Image' && (
              <>
                <Action onClick={() => fileRef.current?.click()}>Choose Another Image…</Action>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setPicture(URL.createObjectURL(file));
                    event.target.value = '';
                  }}
                />
              </>
            )}
            <Divider />
            <Action onClick={() => setNote('Punkto isn’t out yet, so there’s nothing to update.')}>
              Check for Updates…
            </Action>
            <Action onClick={() => setNote(`Punkto ${version}, from the makers of Thaw and Floe.`)}>
              About Punkto
            </Action>
            <Action onClick={() => setPanelOpen(false)}>Quit Punkto</Action>
            <p
              role="status"
              className="px-3 pl-[2.875rem] text-[11px] leading-snug text-(--panel-dim) empty:hidden"
            >
              {note}
            </p>
          </div>
        )}
      </div>

      <figcaption className="mt-3 font-mono text-[0.75rem] leading-normal text-(--punkto-muted)">
        {icon === 'None'
          ? 'No icon now. '
          : hidingSomething
            ? `Click the ${icon === 'Dot' || (icon === 'Image' && !picture) ? 'dot' : 'icon'}. `
            : 'Click it again and they go. '}
        <button
          ref={captionRef}
          type="button"
          onClick={() => setPanelOpen((was) => !was)}
          className="underline decoration-(--punkto-muted) underline-offset-[0.22em] hover:text-(--punkto-strong)"
        >
          {panelOpen ? 'Close its panel' : 'Right-click it for its panel'}
        </button>
        .
      </figcaption>
    </figure>
  );
}

function BarItem({ item }: { item: (typeof items)[number] }) {
  if (item.id === 'thaw') {
    return (
      <span role="img" aria-label={item.name} className="flex">
        <ThawMark className="size-4 shrink-0" />
      </span>
    );
  }
  if (!item.file) {
    return <span className="font-medium whitespace-nowrap tabular-nums">9:41</span>;
  }
  return (
    // biome-ignore lint/performance/noImgElement: a glyph at its exact size
    <img
      src={`/desktop/${item.file}.webp`}
      alt={item.name}
      width={item.w}
      height={item.h}
      className={glyph}
      draggable={false}
    />
  );
}

/** Filled while it hides something (StatusItemController.updateIcon). Image without a picture is the dot. */
function PunktoIcon({
  style,
  picture,
  filled,
}: {
  style: IconStyle;
  picture: string | null;
  filled: boolean;
}) {
  if (style === 'Image' && picture) {
    return (
      // biome-ignore lint/performance/noImgElement: a picture from the visitor's own disk
      <img
        src={picture}
        alt=""
        className={`size-4 rounded-[3px] object-cover ${filled ? '' : 'opacity-50'}`}
      />
    );
  }
  if (style === 'Eye') {
    const EyeSymbol = filled ? EyeOff : Eye;
    return <EyeSymbol aria-hidden="true" className="size-4" strokeWidth={1.75} />;
  }
  if (style === 'Ellipsis') {
    return (
      <span aria-hidden="true" className="flex gap-[2.5px]">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={`size-[4.5px] rounded-full border-[1.25px] border-current ${filled ? 'bg-current' : ''}`}
          />
        ))}
      </span>
    );
  }
  if (style === 'Puck') {
    // PunktoPuckIcon.swift.
    return (
      <svg aria-hidden="true" viewBox="0 0 17 17" className="size-[17px]">
        {filled ? (
          <>
            <mask id="punkto-puck-face">
              <rect width="17" height="17" fill="white" />
              <path d="M3.5 5.2 A5 2.2 0 0 0 13.5 5.2" fill="none" stroke="black" strokeWidth="1" />
            </mask>
            <g mask="url(#punkto-puck-face)" fill="currentColor">
              <ellipse cx="8.5" cy="5.2" rx="5" ry="2.2" />
              <rect x="3.5" y="5.2" width="10" height="6.6" />
              <ellipse cx="8.5" cy="11.8" rx="5" ry="2.2" />
            </g>
          </>
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.1">
            <ellipse cx="8.5" cy="5.2" rx="4.45" ry="1.65" />
            <path d="M4.05 5.2 V11.8 M12.95 5.2 V11.8 M4.05 11.8 A4.45 1.65 0 0 0 12.95 11.8" />
          </g>
        )}
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`size-[7px] rounded-full border-[1.5px] border-current transition-colors duration-150 ${filled ? 'bg-current' : ''}`}
    />
  );
}

function PanelLists({
  items: list,
  title,
  action,
  onMove,
}: {
  items: typeof items;
  title: string;
  action: 'Hide' | 'Show';
  onMove: (id: ItemId) => void;
}) {
  return (
    <section aria-label={title} className="px-1.5 pb-1">
      <h3 className="px-1.5 pt-1 pb-0.5 text-[13px] font-semibold text-(--panel-dim)">{title}</h3>
      {list.length === 0 ? (
        <p className="px-1.5 py-1 text-[13px] text-(--panel-dim)">
          Drag apps here to {action === 'Hide' ? 'show' : 'hide'} their menu bar items.
        </p>
      ) : (
        <ul>
          {list.map((item) => (
            <li
              key={item.id}
              className="group flex h-7 items-center gap-2 rounded-full px-1.5 hover:bg-(--panel-hover)"
            >
              <AppIcon item={item} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => onMove(item.id)}
                aria-label={`${action} ${item.name}`}
                className="rounded-full bg-(--panel-fill) px-2 text-[12px] leading-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(--panel-accent) [@media(hover:none)]:opacity-100"
              >
                {action}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Thaw's and Floe's own icons; other apps get their glyph on a tile. */
function AppIcon({ item }: { item: (typeof items)[number] }) {
  if (item.id === 'floe' || item.id === 'thaw') {
    return (
      <Image
        src={item.id === 'floe' ? floeIcon : thawIcon}
        alt=""
        width={20}
        className="size-5 shrink-0"
      />
    );
  }
  if (!item.file) {
    return (
      <Clock
        aria-hidden="true"
        className="size-5 shrink-0 p-[1px] text-(--panel-dim)"
        strokeWidth={1.5}
      />
    );
  }
  if (item.file.startsWith('system/')) {
    return (
      <span className="grid size-5 shrink-0 place-items-center opacity-60">
        {/* biome-ignore lint/performance/noImgElement: a glyph at its exact size */}
        <img
          src={`/desktop/${item.file}.webp`}
          alt=""
          width={item.w}
          height={item.h}
          className={glyph}
        />
      </span>
    );
  }
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-[#2c2c2e]">
      {/* biome-ignore lint/performance/noImgElement: a glyph at its exact size */}
      <img
        src={`/desktop/${item.file}.webp`}
        alt=""
        width={(item.w ?? 16) * 0.7}
        height={(item.h ?? 16) * 0.7}
        className="max-w-none"
      />
    </span>
  );
}

function Row({
  chip,
  active = false,
  title,
  children,
}: {
  chip: ReactNode;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3 ${
          active ? 'bg-(--panel-accent) text-white' : 'bg-(--panel-fill)'
        }`}
      >
        {chip}
      </span>
      <span className="min-w-0 flex-1">{title}</span>
      {children}
    </div>
  );
}

function Pills<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <span
      role="radiogroup"
      aria-label={label}
      className="flex rounded-full bg-(--panel-fill) p-0.5"
    >
      {options.map((option, index) => (
        // biome-ignore lint/a11y/useSemanticElements: a pill of a segmented control, drawn as the app draws it
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          tabIndex={option === value ? 0 : -1}
          onClick={() => onChange(option)}
          onKeyDown={(event) => {
            // Arrow keys move the selection and focus, as in a radio group.
            const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const next = (index + step + options.length) % options.length;
            onChange(options[next]);
            const pills = event.currentTarget.parentElement?.children;
            (pills?.[next] as HTMLElement | undefined)?.focus();
          }}
          className={`rounded-full px-2.5 text-[13px] leading-5 outline-none focus-visible:ring-2 focus-visible:ring-(--panel-accent) ${
            option === value ? 'bg-(--panel-selected) shadow-sm' : ''
          }`}
        >
          {format(option)}
        </button>
      ))}
    </span>
  );
}

function Switch({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--panel-accent) focus-visible:ring-offset-1 ${
        on ? 'bg-(--panel-accent)' : 'bg-(--panel-fill)'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-[18px] w-[22px] rounded-full bg-white shadow transition-transform duration-200 ${ease} ${
          on ? 'translate-x-[14px]' : ''
        }`}
      />
    </button>
  );
}

function Action({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-1.5 block w-[calc(100%-0.75rem)] rounded-full py-1 pl-[2.375rem] text-left outline-none hover:bg-(--panel-hover) focus-visible:bg-(--panel-hover)"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <hr className="mx-3 my-1.5 border-(--panel-rule)" />;
}
