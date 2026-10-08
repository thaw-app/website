'use client';

import type { StaticImageData } from 'next/image';
import Image from 'next/image';
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useMenu } from './use-menu';

// ThawUI: the controls both settings windows are put together from, as both apps draw
// theirs with one library. A control has no colours of its own. It reads them from custom
// properties the window sets on its root (thaw-window.css, floe-window.css), so the same
// switch is yellow in Thaw's window and blue in Floe's.
//
// Every control is one element that takes `className` and `style`. Floe's window sets them
// in the flow of a form; Thaw's places each by the frame measured from the real window,
// with `position: absolute` in `style`, which outranks the control's own `relative`.

export const dim = 'text-(--dim)';
/** The filled box a group of settings sits in. */
export const group = 'rounded-(--group-radius) bg-(--group)';
/** A line between each row of a group that is laid out in the flow. */
export const divided = 'divide-y divide-[color:var(--separator)]';
/**
 * The ring that shows the keyboard's place, on any control here: flush against the control,
 * in the window's --focus. The site's own outline is drawn around it as everywhere else. A
 * window that marks focus another way makes --focus transparent and styles .thaw-ui-ring.
 */
export const ring =
  'thaw-ui-ring outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ring-offset-(--focus-under)';
// A sheet's buttons hold the ring a point off, the sheet's own fill showing between.
const sheetGap = 'ring-offset-1 ring-offset-[#f6f6f6] dark:ring-offset-[#2a2a2b]';
const pushFace = `bg-(--push) shadow-(--push-shadow) hover:bg-(--push-hover) enabled:active:brightness-[0.88] disabled:opacity-(--dimmed) disabled:hover:bg-(--push) ${ring}`;
const defaultFace = `bg-(--accent) font-medium text-(--on-accent) hover:brightness-[0.92] disabled:opacity-(--dimmed) disabled:hover:brightness-100 ${ring} ${sheetGap}`;
/** A push button. Its size and padding are the window's to give. */
export const push = `rounded-[6px] ${pushFace}`;
/** The default button of a sheet, in the window's accent. */
export const pushDefault = `rounded-[6px] ${defaultFace}`;
/** The capsule a toolbar's controls are drawn on. */
export const glass = 'rounded-full bg-(--capsule) shadow-[inset_0_0_0_0.5px_var(--rim)]';

interface Placed {
  className?: string;
  style?: CSSProperties;
}

/** The knob stretches while it is pressed, as Liquid Glass controls give under the pointer. */
export function Switch({
  on,
  label,
  disabled,
  onChange,
  className = '',
  style,
}: Placed & {
  on: boolean;
  label: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      style={style}
      className={`group/switch relative h-[17px] w-9 shrink-0 rounded-full transition-[background-color] duration-200 motion-reduce:transition-none disabled:opacity-50 ${ring} ring-offset-1 ${
        on ? 'bg-(--accent)' : 'bg-(--switch-off)'
      } ${className}`}
    >
      <span
        className={`absolute top-[2.5px] h-3 w-[22px] rounded-full bg-white [box-shadow:var(--knob-shadow)] [transition:left_0.22s_cubic-bezier(0.3,1.4,0.5,1),width_0.15s] group-enabled/switch:group-active/switch:w-[26px] motion-reduce:transition-none ${
          on ? 'left-[12.5px] group-enabled/switch:group-active/switch:left-[8.5px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

/** One row of a menu: null is a divider. */
export type MenuRow = {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onPick: () => void;
} | null;

/**
 * A menu under the button that opened it, drawn inside the same element as that button.
 * It opens upwards instead when the page it sits in (marked data-menu-room) has no room
 * left below. A row's height is the window's line height plus its padding.
 */
export function Menu({
  label,
  rows,
  align = 'right',
  inset,
  onClose,
  className = '',
  style,
}: Placed & {
  label?: string;
  rows: MenuRow[];
  /** Which edge of its button the menu lines up with. */
  align?: 'left' | 'right';
  /** Leaves the room a tick takes even while no row carries one. */
  inset?: boolean;
  onClose: () => void;
}) {
  const { menuRef, onKeyDown, dismiss } = useMenu(onClose);
  const [above, setAbove] = useState(false);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const room = menu?.closest('[data-menu-room]')?.getBoundingClientRect();
    if (menu && room) setAbove(menu.getBoundingClientRect().bottom > room.bottom);
  }, [menuRef]);

  const ticked = rows.filter((row) => row?.checked !== undefined).length;
  // Every row with a tick to carry is a choice of one; some of them are switches of their own.
  const role = ticked === rows.filter(Boolean).length ? 'menuitemradio' : 'menuitemcheckbox';
  const item = `relative rounded-[6px] py-[3px] pr-2.5 text-left whitespace-nowrap outline-none enabled:hover:bg-(--accent) enabled:hover:text-(--on-accent) enabled:focus-visible:bg-(--accent) enabled:focus-visible:text-(--on-accent) disabled:text-(--dim) ${
    ticked || inset ? 'pl-6' : 'pl-2.5'
  }`;
  const pick = (run: () => void) => {
    run();
    dismiss();
  };
  let divider = 0;
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={style}
      className={`desktop-menu absolute z-30 flex min-w-[150px] flex-col rounded-[10px] bg-(--menu-fill) p-[5px] text-[13px] font-normal text-(--text) [box-shadow:var(--menu-shadow)] [backdrop-filter:var(--menu-backdrop)] ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${above ? 'bottom-full mb-(--menu-gap)' : 'top-full mt-(--menu-gap)'} ${className}`}
    >
      {rows.map((row) =>
        row === null ? (
          <hr
            key={`divider-${divider++}`}
            className="mx-[9px] my-[5px] border-0 border-t-[0.5px] border-(--menu-line)"
          />
        ) : row.checked === undefined ? (
          <button
            key={row.label}
            type="button"
            role="menuitem"
            disabled={row.disabled}
            onClick={() => pick(row.onPick)}
            className={item}
          >
            {row.label}
          </button>
        ) : (
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is one of the two that are ticked
          <button
            key={row.label}
            type="button"
            role={role}
            aria-checked={row.checked}
            disabled={row.disabled}
            onClick={() => pick(row.onPick)}
            className={item}
          >
            {row.checked && (
              <i
                aria-hidden
                className="absolute top-[calc(50%-3.5px)] left-[9px] h-2 w-1 rotate-45 border-r-[1.5px] border-b-[1.5px] border-current"
              />
            )}
            {row.label}
          </button>
        ),
      )}
    </div>
  );
}

/**
 * A pop-up button: the current choice, and a menu of all of them when pressed. With
 * `pull` it is a pull-down, drawn with one chevron. Given no options it only calls
 * `onPress`, for a pop-up with nothing behind it here.
 */
export function PopUp({
  label,
  options,
  chosen,
  pull,
  onChoose,
  onPress,
  className = '',
  style,
}: Placed & {
  label: string;
  /** null is a divider. */
  options?: (string | null)[] | null;
  chosen?: string;
  pull?: boolean;
  onChoose?: (option: string) => void;
  onPress?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const chevron =
    'absolute left-[7px] size-[4.5px] border-t-[1.5px] border-r-[1.5px] border-(--text)';
  return (
    <span className={`relative inline-flex ${className}`} style={style}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={chosen ? `${label}: ${chosen}` : label}
        onClick={() => (options ? setOpen(!open) : onPress?.())}
        // Let narrower than what it says, it keeps its right edge and spills to the left.
        className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 rounded-full whitespace-nowrap ${ring}`}
      >
        {chosen && <span className="text-[color:var(--value,currentColor)]">{chosen}</span>}
        <i aria-hidden className="relative size-5 flex-none rounded-full bg-(--popup)">
          {pull ? (
            <i className={`${chevron} top-[6.5px] rotate-[135deg]`} />
          ) : (
            <>
              <i className={`${chevron} top-[6px] -rotate-45`} />
              <i className={`${chevron} top-[9.5px] rotate-[135deg]`} />
            </>
          )}
        </i>
      </button>
      {open && options && (
        <Menu
          label={label}
          rows={options.map((option) =>
            option === null
              ? null
              : {
                  label: option,
                  checked: option === chosen,
                  onPick: () => onChoose?.(option),
                },
          )}
          onClose={close}
        />
      )}
    </span>
  );
}

/** Everything in a container the Tab key can stop at. */
function stops(container: HTMLElement | null) {
  return [
    ...(container?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea, a[href]',
    ) ?? []),
  ];
}

/**
 * A sheet over the window: it takes the keyboard while it is up, Escape
 * cancels it, and what opened it has the keyboard again afterwards.
 */
export function Sheet({
  label,
  onCancel,
  className = '',
  children,
}: {
  label: string;
  onCancel: () => void;
  className?: string;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  // Whatever had the keyboard when the sheet was asked for. Noted while drawing, because
  // by the time the sheet is on screen the window behind is inert and has let go of it.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const sheet = sheetRef.current;
    (sheet?.querySelector<HTMLElement>('[data-first]') ?? stops(sheet)[0])?.focus({
      preventScroll: true,
    });
    return () => opener?.focus?.({ preventScroll: true });
  }, [opener]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    } else if (event.key === 'Tab') {
      // The window behind is out of reach, so Tab goes round the sheet.
      const all = stops(sheetRef.current);
      const edge = event.shiftKey ? all[0] : all[all.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? all[all.length - 1] : all[0])?.focus();
      }
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[17px] bg-black/25 dark:bg-black/45">
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={label}
        onKeyDown={onKeyDown}
        className={`desktop-pop flex max-h-[calc(100%-32px)] flex-col rounded-[14px] bg-[#f6f6f6] shadow-[0_18px_50px_rgb(0_0_0/0.4)] ring-[0.5px] ring-black/15 dark:bg-[#2a2a2b] dark:ring-white/20 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export interface AlertButton {
  label: string;
  /** `default` is the one in the accent, `destructive` the one in red; the rest are plain. */
  kind?: 'default' | 'destructive';
  onPick?: () => void;
}

/** A macOS alert: the app's icon, a line in bold, a line of detail, and its buttons. */
export function Alert({
  icon,
  title,
  message,
  buttons,
  onClose,
}: {
  icon: StaticImageData;
  title: string;
  message?: string;
  buttons: AlertButton[];
  /** Called after any button, and for Escape. */
  onClose: () => void;
}) {
  const hasDefault = buttons.some((button) => button.kind === 'default');
  return (
    <Sheet label={title} onCancel={onClose} className="w-[260px] items-center px-4 pt-5 pb-4">
      <Image src={icon} alt="" className="size-14" />
      <p className="mt-3 text-center font-bold">{title}</p>
      {message && (
        <p className={`mt-1.5 text-center text-[11px] leading-[14px] whitespace-pre-line ${dim}`}>
          {message}
        </p>
      )}
      <div className="mt-4 flex w-full flex-col gap-1.5">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            // The keyboard starts on the safe choice: the default, or else whatever is not in red.
            data-first={button.kind === 'default' || (!button.kind && !hasDefault) ? '' : undefined}
            onClick={() => {
              button.onPick?.();
              onClose();
            }}
            className={`h-7 rounded-[7px] text-[13px] ${
              button.kind === 'default'
                ? defaultFace
                : `${pushFace} ${sheetGap} ${
                    button.kind === 'destructive' ? 'text-[#d92d20] dark:text-[#ff6961]' : ''
                  }`
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** A named text field in a grouped form: its name on the left, what is typed on the right. */
export function Field({
  label,
  value,
  placeholder,
  first,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  /** Takes the keyboard when its sheet opens. */
  first?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-h-[37px] items-center gap-6 py-2">
      <span className="shrink-0">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        data-first={first ? '' : undefined}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`min-w-0 flex-1 rounded-[5px] bg-transparent px-1.5 py-0.5 text-right select-text placeholder:text-black/35 dark:placeholder:text-white/30 ${ring}`}
      />
    </label>
  );
}

/**
 * The three lights at a window's top left. Pointing at them shows their symbols, as on a
 * Mac. Zooming would need a bigger screen than this desktop has, so the third is not a button.
 */
export function TrafficLights({
  name,
  onClose,
  onMinimize,
  className = '',
  style,
}: Placed & {
  /** The window's name, as in "Close Thaw Settings". */
  name: string;
  onClose: () => void;
  onMinimize: () => void;
}) {
  const light =
    'relative size-3.5 rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.2)] after:absolute after:inset-0 after:text-center after:text-[11px] after:leading-[13px] after:font-bold after:text-black/55 after:opacity-0 after:transition-opacity after:duration-100 group-hover/lights:after:opacity-100 motion-reduce:after:transition-none';
  const button = `${light} focus-visible:ring-offset-1 focus-visible:after:opacity-100 active:brightness-90 ${ring}`;
  return (
    <div className={`group/lights flex gap-[9px] ${className}`} style={style}>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${name}`}
        className={`${button} bg-[#f35e54] after:content-['×']`}
      />
      <button
        type="button"
        onClick={onMinimize}
        aria-label={`Minimize ${name}`}
        className={`${button} bg-[#fcc000] after:content-['−']`}
      />
      <span aria-hidden className={`${light} bg-[#33c000] after:content-['+']`} />
    </div>
  );
}

/** One page's row in a settings window's sidebar. */
export function SidebarRow({
  current,
  icon,
  onClick,
  className = '',
  style,
  children,
}: Placed & {
  current: boolean;
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      style={style}
      className={`flex h-8 items-center rounded-[8.5px] text-left transition-colors duration-[120ms] motion-reduce:transition-none ${ring} ${
        current ? 'bg-(--accent) font-bold text-(--on-accent)' : 'active:bg-current/10'
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

/** The page's name in the toolbar, over a line about it. The gap between them is the window's. */
export function ToolbarTitle({
  title,
  subtitle,
  className = '',
  style,
}: Placed & { title: string; subtitle: string }) {
  return (
    <div className={`flex flex-col leading-none ${className}`} style={style}>
      <p className="font-bold">{title}</p>
      <p className={`text-[11px] ${dim}`}>{subtitle}</p>
    </div>
  );
}

/** The toolbar's search field, which is a button here: there is nothing to search. */
export function SearchField({
  icon,
  hidden,
  onClick,
  className = '',
  style,
}: Placed & { icon: ReactNode; hidden?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      hidden={hidden}
      aria-label="Search settings"
      onClick={onClick}
      style={style}
      className={`flex h-9 items-center font-semibold active:brightness-90 ${glass} ${dim} ${ring} ${className}`}
    >
      {icon}
      Search
    </button>
  );
}
