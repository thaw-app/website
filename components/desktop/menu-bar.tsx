'use client';

import {
  type CSSProperties,
  type Dispatch,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BarItemView } from './bar-item';
import { barItems, type MenuBarAction, type MenuBarModel, type SectionId } from './menu-bar-model';
import { type Appearance, tints } from './model';

// The New Items slot marks, in the Layout editor, where a newly installed app's item will
// land. It is a placeholder there and not an item, so the menu bar itself never draws it.
const real = (id: string) => barItems[id]?.kind !== 'marker';

/** The Apple logo's size in points, as cut by reference/menubar/cut-glyphs.cjs. */
const APPLE = { w: 13, h: 15 };

interface MenuBarProps {
  model: MenuBarModel;
  dispatch: Dispatch<MenuBarAction>;
  appearance: Appearance;
  /** Whether Thaw's own icon is in the bar. */
  showIcon: boolean;
  /** Whether the app menus may step aside for the hidden items. */
  hideMenus: boolean;
  /** Thaw leaves the app menus alone while its settings window is open. */
  settingsOpen: boolean;
  /** Asks for the Thaw menu at a point on the page. */
  onMenu: (point: { clientX: number; clientY: number }, source: 'icon' | 'bar') => void;
  /** Asks for Floe's own menu, under its item. */
  onFloeMenu: (point: { clientX: number }) => void;
}

/**
 * The menu bar, drawn from the shared model: the visible section on the
 * right, and the hidden sections opening to its left when revealed.
 */
export function MenuBar({
  model,
  dispatch,
  appearance,
  showIcon,
  hideMenus,
  settingsOpen,
  onMenu,
  onFloeMenu,
}: MenuBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  // The item being dragged along the bar, which takes holding Command, as on a Mac.
  const [dragging, setDragging] = useState<string | null>(null);

  function grab(event: PointerEvent, id: string) {
    if (!event.metaKey) return;
    event.preventDefault();
    barRef.current?.setPointerCapture(event.pointerId);
    setDragging(id);
  }

  // Drop the dragged item into whichever showing section the pointer is over,
  // after the items whose middles lie to the pointer's left.
  function drag(event: PointerEvent) {
    if (!dragging || !barRef.current) return;
    const open = [...barRef.current.querySelectorAll<HTMLElement>('[data-section]')].filter(
      (element) => element.getBoundingClientRect().width > 0,
    );
    const over =
      open.find((element) => {
        const box = element.getBoundingClientRect();
        return event.clientX >= box.left && event.clientX <= box.right;
      }) ??
      (open.length > 0 && event.clientX < open[0].getBoundingClientRect().left ? open[0] : null);
    if (!over) return;
    const index = [...over.querySelectorAll<HTMLElement>('[data-id]')].filter((element) => {
      const box = element.getBoundingClientRect();
      return element.dataset.id !== dragging && box.left + box.width / 2 < event.clientX;
    }).length;
    dispatch({ type: 'move', id: dragging, to: over.dataset.section as SectionId, index });
  }
  // With the Thaw Bar on, hidden items open under the menu bar, not in it.
  const inline = !model.thawBar;
  // As in the app, the menus only step aside when the revealed items do not
  // fit in the room they have, and never while Thaw's settings are open.
  const statusRef = useRef<HTMLDivElement>(null);
  const [cramped, setCramped] = useState(false);
  const itemCount =
    model.sections.hidden.filter(real).length + model.sections.alwaysHidden.filter(real).length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measured whenever what is showing changes
  useEffect(() => {
    // Measured once the reveal has finished sliding open.
    const timer = setTimeout(() => {
      const status = statusRef.current;
      setCramped(!!status && status.scrollWidth > status.clientWidth + 1);
    }, 550);
    return () => clearTimeout(timer);
  }, [model.hiddenShown, model.alwaysHiddenShown, itemCount]);
  const menusHidden = hideMenus && inline && model.hiddenShown && !settingsOpen && cramped;

  // Scrolling over the bar reveals or hides, when that is switched on. The
  // listener is set by hand because React's wheel handler cannot stop the page scrolling.
  const scrollReveals = model.revealOn.scroll;
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !scrollReveals) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      dispatch({ type: event.deltaY + event.deltaX > 0 ? 'show-hidden' : 'hide-hidden' });
    }
    bar.addEventListener('wheel', onWheel, { passive: false });
    return () => bar.removeEventListener('wheel', onWheel);
  }, [scrollReveals, dispatch]);

  // Each menu title has ten points either side, as measured on the real bar.
  const menus = (
    <div
      aria-hidden={menusHidden}
      className={`flex shrink-0 items-center transition-opacity duration-300 motion-reduce:transition-none ${
        menusHidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* The Apple menu, cut from the real bar like the status glyphs. */}
      <span className="grid w-[34px] place-items-center">
        {/* biome-ignore lint/performance/noImgElement: a glyph at its exact size */}
        <img src="/desktop/system/apple.webp" alt="Apple menu" width={APPLE.w} height={APPLE.h} />
      </span>
      <span className="pr-2.5 pl-1 font-bold">Finder</span>
      {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((menu) => (
        <span key={menu} className="hidden px-2.5 md:inline">
          {menu}
        </span>
      ))}
    </div>
  );

  const section = (name: SectionId, shown: boolean) => (
    <div
      data-section={name}
      aria-hidden={!shown}
      // Squeezed for room, a section keeps the items nearest the visible ones.
      className={`flex shrink items-center justify-end overflow-hidden transition-[max-width,opacity] duration-500 ease-out motion-reduce:transition-none ${
        shown ? 'max-w-[44rem] opacity-100' : 'max-w-0 opacity-0'
      }`}
    >
      {model.sections[name].filter(real).map((id) => (
        <Item key={id} id={id} dragging={dragging === id} onGrab={grab} onFloeMenu={onFloeMenu} />
      ))}
    </div>
  );

  const statusItems = (
    // Nothing can sit under the notch: what does not fit beside it is cut off,
    // as macOS does. The Thaw Bar is the way round that.
    <div
      ref={statusRef}
      className="flex min-w-0 items-center justify-end overflow-hidden md:max-w-[calc(50cqw-7.5rem)]"
    >
      {section('alwaysHidden', inline && model.alwaysHiddenShown)}
      {section('hidden', inline && model.hiddenShown)}
      <div data-section="visible" className="flex shrink-0 items-center">
        {model.sections.visible.map((id) =>
          barItems[id]?.kind === 'thaw' ? (
            // Thaw's icon: click to show or hide, double-click for Always Hidden, right-click for its menu.
            <button
              key={id}
              type="button"
              data-id={id}
              onPointerDown={(event) => grab(event, id)}
              onClick={(event) => !event.metaKey && dispatch({ type: 'toggle-hidden' })}
              onDoubleClick={() => model.alwaysHidden && dispatch({ type: 'toggle-always-hidden' })}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMenu(event, 'icon');
              }}
              aria-pressed={model.hiddenShown}
              aria-label={model.hiddenShown ? 'Hide menu bar items' : 'Show hidden menu bar items'}
              tabIndex={showIcon ? 0 : -1}
              className={`bar-item overflow-hidden outline-none transition-[max-width,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none ${
                showIcon ? 'max-w-12 opacity-100' : 'pointer-events-none max-w-0 opacity-0'
              }`}
            >
              <BarItemView id={id} />
            </button>
          ) : (
            <Item
              key={id}
              id={id}
              dragging={dragging === id}
              onGrab={grab}
              onFloeMenu={onFloeMenu}
            />
          ),
        )}
      </div>
    </div>
  );

  // The empty stretch of the bar, which Thaw can treat as a button.
  const gap = (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Show hidden menu bar items"
      onClick={model.revealOn.click ? () => dispatch({ type: 'toggle-hidden' }) : undefined}
      onMouseEnter={model.revealOn.hover ? () => dispatch({ type: 'show-hidden' }) : undefined}
      className="min-w-4 flex-1 self-stretch"
    />
  );

  // The camera housing of a MacBook display. A phone is too narrow to fit one.
  // The notch is Droppy's home on a real Mac, so pointing at it opens a small
  // panel the way Droppy's does there: it drops from the notch, black at the
  // top and melting into glass below. It says so and links to our partner.
  const notch = (
    <a
      href="https://getdroppy.app/"
      target="_blank"
      rel="noreferrer"
      aria-label="Droppy, the app that lives in your notch. Works with Thaw."
      className="droppy-notch group absolute top-0 left-1/2 z-10 hidden -translate-x-1/2 text-white outline-none md:block"
    >
      <span className="droppy-notch-body">
        <span className="flex h-full items-end gap-3 px-5 pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-150 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#2b84f0]">
            {/* biome-ignore lint/performance/noImgElement: Droppy's own menu bar glyph at its exact size */}
            <img src="/desktop/thaw/items/droppy.webp" alt="" width={15} height={18} />
          </span>
          <span className="flex flex-col pb-0.5 text-left leading-tight whitespace-nowrap">
            <span className="text-[13px] font-semibold">Droppy lives up here</span>
            <span className="text-[12px] text-white/60">Works with Thaw</span>
          </span>
        </span>
      </span>
    </a>
  );

  const shaped = appearance.shape !== 'none';
  let bar: ReactNode;
  if (appearance.shape === 'split') {
    bar = (
      <>
        <Surface appearance={appearance} faded={menusHidden}>
          {menus}
        </Surface>
        {gap}
        <Surface appearance={appearance}>{statusItems}</Surface>
      </>
    );
  } else if (appearance.shape === 'notch') {
    bar = (
      <>
        <Surface appearance={appearance} grow>
          {menus}
          {gap}
        </Surface>
        {/* The stretch the two halves leave clear for the notch. */}
        <span className="w-1 shrink-0 md:w-52" />
        <Surface appearance={appearance} grow>
          {gap}
          {statusItems}
        </Surface>
      </>
    );
  } else {
    bar = (
      <Surface appearance={appearance} grow>
        {menus}
        {gap}
        {statusItems}
      </Surface>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a right-click anywhere on the bar, as on a Mac; the Thaw icon offers the same menu to the keyboard
    <div
      ref={barRef}
      onPointerMove={drag}
      onPointerUp={() => setDragging(null)}
      onPointerCancel={() => setDragging(null)}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu(event, 'bar');
      }}
      // The real bar is 30 points tall; a shape sits a point inside it, nine from each end.
      className={`@container relative z-30 flex h-[30px] shrink-0 items-center text-[13px] ${shaped ? 'px-[9px]' : ''}`}
    >
      {notch}
      {bar}
    </div>
  );
}

/**
 * An item other than Thaw's own. It lights up under the pointer, as a real one does when
 * clicked. Floe's is the one that answers: a click opens Floe's menu, as on a Mac.
 */
function Item({
  id,
  dragging,
  onGrab,
  onFloeMenu,
}: {
  id: string;
  dragging?: boolean;
  /** Called when the item is pressed, so the bar can start a Command-drag. */
  onGrab?: (event: PointerEvent, id: string) => void;
  onFloeMenu?: (point: { clientX: number }) => void;
}) {
  if (id === 'floe' && onFloeMenu) {
    return (
      <button
        type="button"
        data-id={id}
        aria-label="Floe"
        aria-haspopup="menu"
        onPointerDown={onGrab ? (event) => onGrab(event, id) : undefined}
        onClick={(event) => {
          if (event.metaKey) return;
          // Under the item's own left edge, wherever in it the click landed.
          onFloeMenu({ clientX: event.currentTarget.getBoundingClientRect().left });
        }}
        className={`bar-item outline-none focus-visible:ring-2 focus-visible:ring-white ${
          dragging ? 'bar-item-dragging' : ''
        }`}
        title={barItems[id]?.name}
      >
        <BarItemView id={id} />
      </button>
    );
  }
  return (
    <span
      data-id={id}
      onPointerDown={onGrab ? (event) => onGrab(event, id) : undefined}
      className={`bar-item ${dragging ? 'bar-item-dragging' : ''}`}
      title={barItems[id]?.name}
    >
      <BarItemView id={id} />
    </span>
  );
}

/** One painted piece of the bar: the whole of it, or one of the two halves. */
function Surface({
  appearance,
  grow,
  faded,
  children,
}: {
  appearance: Appearance;
  grow?: boolean;
  /** Fades the whole piece out, for the menus' half when they step aside. */
  faded?: boolean;
  children: ReactNode;
}) {
  const tint = tints[appearance.color];
  const shaped = appearance.shape !== 'none';
  const style: CSSProperties = {
    background:
      appearance.tint === 'solid'
        ? `color-mix(in oklab, ${tint.from} 80%, transparent)`
        : appearance.tint === 'gradient'
          ? `linear-gradient(90deg, color-mix(in oklab, ${tint.from} 88%, transparent), color-mix(in oklab, ${tint.to} 88%, transparent))`
          : // The near-black glass the real bar shows over a dark wallpaper.
            'linear-gradient(rgb(8 8 10 / 0.82), rgb(30 30 34 / 0.78))',
    borderRadius: shaped ? (appearance.ends === 'round' ? 9999 : 6) : 0,
  };

  return (
    <div
      style={style}
      className={`flex min-w-0 items-center border px-1 backdrop-blur-md transition-[background,border-radius,opacity] duration-300 motion-reduce:transition-none ${
        faded ? 'opacity-0' : ''
      } ${
        shaped ? 'h-7' : 'h-[30px]'
      } ${grow ? 'flex-1' : ''} ${appearance.border ? 'border-white/50' : 'border-transparent'} ${
        appearance.shadow ? 'shadow-lg shadow-black/50' : ''
      }`}
    >
      {children}
    </div>
  );
}

/**
 * The Thaw Bar: with it switched on, the hidden items open in a bar of their
 * own under the menu bar, which keeps them clear of a notch.
 */
export function ThawBar({ model }: { model: MenuBarModel }) {
  const shown = model.thawBar && model.hiddenShown;
  const ids = [
    ...(model.alwaysHiddenShown ? model.sections.alwaysHidden : []),
    ...model.sections.hidden,
  ].filter(real);

  return (
    <div
      aria-hidden={!shown}
      className={`absolute top-[34px] right-[9px] z-30 flex h-9 max-w-[calc(100%-1rem)] origin-top-right items-center overflow-hidden rounded-full border border-white/15 bg-black/45 px-2 text-[13px] shadow-xl backdrop-blur-xl transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
        shown ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
      }`}
    >
      {ids.map((id) => (
        <Item key={id} id={id} />
      ))}
    </div>
  );
}
