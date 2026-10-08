'use client';

import { CircleDot, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Hotkey } from './model';
import { ring } from './thaw-ui';

// What Floe's settings have that ThawUI (thaw-ui.tsx) does not: a shortcut and its recorder.

/** The key's name as Floe prints it (KeyCode.swift), from where it sits on the keyboard. */
function keyLabel(event: globalThis.KeyboardEvent) {
  const named: Record<string, string> = {
    Space: 'Space',
    Tab: '⇥',
    Enter: '⏎',
    Backspace: '⌫',
    Delete: '⌦',
    Escape: '⎋',
    Home: '↖',
    End: '↘',
    PageUp: '⇞',
    PageDown: '⇟',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: '’',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`',
  };
  const { code } = event;
  if (named[code]) return named[code];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^F\d+$/.test(code)) return code;
  // A key with no name here is shown as whatever it types.
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

/** A shortcut as the app writes one: the modifiers in Apple's order, then the key. */
export function hotkeyText(hotkey: Hotkey) {
  const modifiers = `${hotkey.control ? '⌃' : ''}${hotkey.option ? '⌥' : ''}${hotkey.shift ? '⇧' : ''}${hotkey.command ? '⌘' : ''}`;
  return `${modifiers} ${hotkey.label}`;
}

/** Whether a key press is the given shortcut. */
export function hotkeyMatches(
  hotkey: Hotkey | undefined,
  event: { ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean; code: string },
) {
  return (
    !!hotkey &&
    hotkey.code === event.code &&
    hotkey.control === event.ctrlKey &&
    hotkey.option === event.altKey &&
    hotkey.shift === event.shiftKey &&
    hotkey.command === event.metaKey
  );
}

const segment =
  'flex h-full items-center justify-center bg-(--push) text-[12px] hover:bg-(--push-hover)';

/**
 * Floe's shortcut recorder (HotkeyRecorder.swift): the wide half says what is
 * set and starts a recording, the square half backs out of one, clears what is
 * set, or starts one. While it listens every key press is its own, as in the
 * app: a combination needs a modifier other than Shift, and a bare Escape
 * backs out. A combination the browser or macOS keeps for itself never
 * reaches the page, so it cannot be recorded here.
 */
export function HotkeyRecorder({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Hotkey | undefined;
  onChange: (value: Hotkey | undefined) => void;
}) {
  const [listening, setListening] = useState(false);
  const boxRef = useRef<HTMLSpanElement>(null);
  const set = useRef(onChange);
  set.current = onChange;

  useEffect(() => {
    if (!listening) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        if (event.key === 'Escape') setListening(false);
        return;
      }
      set.current({
        control: event.ctrlKey,
        option: event.altKey,
        shift: event.shiftKey,
        command: event.metaKey,
        code: event.code,
        label: keyLabel(event),
      });
      setListening(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setListening(false);
    }
    // Before anything else on the page hears the key.
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [listening]);

  const text = listening ? 'Type Shortcut' : value ? hotkeyText(value) : 'Record Shortcut';
  return (
    <span ref={boxRef} className="flex h-6 w-40 gap-px">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        aria-pressed={listening}
        onClick={() => setListening(!listening)}
        className={`${segment} ${ring} min-w-0 flex-1 rounded-l-[6px] focus-visible:z-10 ${
          listening ? 'bg-black/[0.16] dark:bg-white/[0.24]' : ''
        }`}
      >
        <span className="truncate px-2">{text}</span>
      </button>
      <button
        type="button"
        aria-label={listening ? 'Cancel' : value ? 'Clear' : 'Record'}
        onClick={() => {
          if (listening) setListening(false);
          else if (value) onChange(undefined);
          else setListening(true);
        }}
        className={`${segment} ${ring} aspect-square rounded-r-[6px] focus-visible:z-10`}
      >
        {listening ? (
          <span aria-hidden className="text-[13px] leading-none">
            ⎋
          </span>
        ) : value ? (
          <X aria-hidden className="size-3" />
        ) : (
          <CircleDot aria-hidden className="size-3.5" />
        )}
      </button>
    </span>
  );
}
