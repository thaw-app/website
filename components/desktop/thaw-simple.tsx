'use client';

import type { Dispatch, ReactNode } from 'react';
import { LayoutBars } from './layout-bars';
import type { MenuBarAction, MenuBarModel } from './menu-bar-model';
import type { ThawSwitches } from './model';
import { optionsFor } from './thaw-options';
import { labelBefore, type PaneItem, type PaneValues, paneDefinitions } from './thaw-pane';
import { dim, group, PopUp, push, Switch } from './thaw-ui';

/** One of the full window's controls, found in its pane by what it is. */
function find(
  pane: string,
  match: (item: PaneItem, index: number, items: PaneItem[]) => boolean,
): { pane: string; index: number; item: PaneItem } | null {
  const items = paneDefinitions.find((definition) => definition.id === pane)?.items ?? [];
  const index = items.findIndex(match);
  return index < 0 ? null : { pane, index, item: items[index] };
}

const named = (label: string) => (item: PaneItem, index: number, items: PaneItem[]) =>
  item.t === 'switch' && labelBefore(items, index) === label;

// Simple Mode's settings are the full window's own, so each is set through the pane that
// holds it and the two never disagree.
const arrangement = find('layout', (item) => item.label === 'Item arrangement');
const thawBar = find('thaw-bar', named('Use Thaw Bar'));
const rehide = find('visibility', named('Automatically rehide'));
const reveals = ['Click', 'Hover', 'Scroll'].map((way) =>
  find('visibility', (item) => item.t === 'segment' && item.text === way),
);
const version =
  paneDefinitions.find((pane) => pane.id === 'about')?.items.find((item) => item.mono)?.text ?? '';

// What each arrangement means, in the app's words (MenuBarArrangementMode.swift).
const arrangements: Record<string, string> = {
  Automatic:
    'Thaw keeps items in the order you set in Layout. To move another app’s item it sometimes has to drag it for you, and your mouse is briefly unavailable while it does.',
  Manual:
    'You set the order yourself by ⌘-dragging items in the menu bar. Thaw still hides and shows items, but only moves an item when you arrange it in Layout.',
};

interface SimplePaneProps {
  switches: ThawSwitches;
  onSwitch: (id: string) => void;
  menuBar: MenuBarModel;
  dispatchMenuBar: Dispatch<MenuBarAction>;
  paneValues: Record<string, PaneValues>;
  onPaneChange: (
    pane: string,
    index: number,
    value: boolean | number | string,
    item: PaneItem,
  ) => void;
  /** Called for a control that has nothing behind it here, with its name. */
  onInert: (name: string) => void;
}

/**
 * Simple Mode: the settings window as one page (SimpleModeSettingsPane.swift). The bars
 * to arrange come first, then how hidden items come back, then the app's own switches and
 * a line about the version. There is no capture of this page to copy, so unlike the panes
 * it is laid out in the flow, from the app's source, with the same controls.
 */
export function SimplePane({
  switches,
  onSwitch,
  menuBar,
  dispatchMenuBar,
  paneValues,
  onPaneChange,
  onInert,
}: SimplePaneProps) {
  const set = (control: typeof arrangement, value: boolean | string) => {
    if (control) onPaneChange(control.pane, control.index, value, control.item);
  };
  const mode = String(
    (arrangement && paneValues.layout?.[arrangement.index]) ?? arrangement?.item.text ?? '',
  );

  /** A row of a group: its name, the line under it while descriptions are on, and its control. */
  const row = (label: string, about: string | null, control: ReactNode) => (
    // The row's own rule sets its padding, so the room above and below is given here.
    <div className="thaw-row min-h-[37px] gap-4" style={{ paddingBlock: 8 }}>
      <span>
        <span className="block leading-[16px]">{label}</span>
        {about && switches.descriptions && (
          <span className={`mt-0.5 block text-[11px] leading-[14px] ${dim}`}>{about}</span>
        )}
      </span>
      {control}
    </div>
  );

  return (
    <div className="thaw-simple thaw-pane-in" data-menu-room>
      <div className="mx-auto flex max-w-[748px] flex-col gap-5 px-7 pt-2 pb-7 leading-[16px]">
        <section>
          <LayoutBars model={menuBar} dispatch={dispatchMenuBar} folded />
          <div className={`mt-2.5 ${group}`}>
            {row(
              'Item arrangement',
              arrangements[mode] ?? null,
              <PopUp
                label="Item arrangement"
                options={optionsFor('layout', 'Item arrangement')}
                chosen={mode}
                onChoose={(option) => set(arrangement, option)}
                className="mr-1 flex-none"
              />,
            )}
          </div>
          <button
            type="button"
            onClick={() => onInert('Reset Layout')}
            className={`thaw-ui-ring mt-2 ml-2.5 rounded-[3px] text-[11px] font-medium ${dim}`}
          >
            Reset Layout…
          </button>
        </section>

        <section>
          <h3 className="mb-2 px-2.5 text-[13px] font-semibold">Reveal</h3>
          <div className={group}>
            {row(
              'Use Thaw Bar',
              'Show hidden menu bar items in a separate bar below the menu bar.',
              <Switch
                on={menuBar.thawBar}
                label="Use Thaw Bar"
                onChange={() => set(thawBar, !menuBar.thawBar)}
              />,
            )}
            {row(
              'Show hidden items on',
              'Show hidden menu bar items by clicking, hovering, or scrolling in an empty area of the menu bar.',
              <fieldset className="thaw-segments flex h-6 flex-none">
                <legend className="sr-only">Show hidden items on</legend>
                {reveals.map((control) => {
                  const way = (
                    control?.item.text ?? ''
                  ).toLowerCase() as keyof MenuBarModel['revealOn'];
                  return (
                    <button
                      key={way}
                      type="button"
                      aria-pressed={menuBar.revealOn[way]}
                      onClick={() => set(control, !menuBar.revealOn[way])}
                      className="thaw-segment thaw-ui-ring px-3"
                    >
                      {control?.item.text}
                    </button>
                  );
                })}
              </fieldset>,
            )}
            {row(
              'Automatically rehide',
              null,
              <Switch
                on={menuBar.autoRehide}
                label="Automatically rehide"
                onChange={() => set(rehide, !menuBar.autoRehide)}
              />,
            )}
            {row(
              'Toggle the Hidden section',
              null,
              // The app records a shortcut here; a web page cannot claim one from the Mac.
              <button
                type="button"
                onClick={() => onInert('Record Shortcut')}
                className={`${push} h-6 w-[180px] flex-none text-[13px]`}
              >
                Record Shortcut
              </button>,
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-2 px-2.5 text-[13px] font-semibold">App</h3>
          <div className={group}>
            {row(
              'Launch at Login',
              null,
              <Switch
                on={switches.login}
                label="Launch at Login"
                onChange={() => {
                  onSwitch('login');
                  // It moves, and has nothing to change in a browser.
                  onInert('Launch at Login');
                }}
              />,
            )}
            {row(
              'Show Thaw icon',
              menuBar.alwaysHidden
                ? 'Click to show hidden items, double-click for Always Hidden, and right-click for settings.'
                : 'Click to show hidden items and right-click for settings.',
              <Switch
                on={switches.icon}
                label="Show Thaw icon"
                onChange={() => onSwitch('icon')}
              />,
            )}
            {switches.icon ? (
              row(
                'Thaw icon',
                null,
                <PopUp
                  label="Thaw icon"
                  chosen="Dot"
                  pull
                  onPress={() => onInert('Thaw icon')}
                  className="mr-1 flex-none"
                />,
              )
            ) : (
              <p
                className={`thaw-row text-[11px] leading-[14px] ${dim}`}
                style={{ paddingBlock: 8 }}
              >
                Hiding the icon also shrinks the section dividers to nothing. If items start landing
                in the wrong section, show the icon again.
              </p>
            )}
            {row(
              'Show setting descriptions',
              'Explains what a setting does directly beneath it, like this text.',
              <Switch
                on={switches.descriptions}
                label="Show setting descriptions"
                onChange={() => onSwitch('descriptions')}
              />,
            )}
          </div>
        </section>

        {/* One line, no card: the full window's About pane has the rest. */}
        <div className="flex items-center justify-between gap-3 px-2.5">
          <span className={`text-[11px] ${dim}`}>Thaw {version}</span>
          <button
            type="button"
            onClick={() => onInert('Check for Updates')}
            className={`${push} h-6 px-2.5 text-[12px]`}
          >
            Check for Updates
          </button>
        </div>
      </div>
    </div>
  );
}
