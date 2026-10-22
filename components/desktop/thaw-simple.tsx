'use client';

import type { Dispatch, ReactNode } from 'react';
import { LayoutBars } from './layout-bars';
import type { MenuBarAction, MenuBarModel } from './menu-bar-model';
import type { ThawSwitches } from './model';
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
const alwaysHidden = find('layout', named('Always Hidden'));
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
 * Simple Mode: the settings window as one page (SimpleModeSettingsPane.swift), as Thaw
 * 3.0.0-beta.4 draws it: a hint about ⌘-dragging, then the few settings it keeps in one
 * group. Its rows are laid out in the flow, measured against a capture of the real page,
 * with the same controls as the full window's panes.
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
  const set = (control: typeof arrangement, value: boolean | number | string) => {
    if (control) onPaneChange(control.pane, control.index, value, control.item);
  };
  const modes = arrangement?.item.options?.map((option) => option.text) ?? [];
  const chosen = Number(
    (arrangement && paneValues.layout?.[arrangement.index]) ?? arrangement?.item.chosen ?? 0,
  );

  /** A row of the group: its name, the line under it while descriptions are on, and its control. */
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
      <div className="flex flex-col gap-2.5 px-[50px] pt-7 pb-7 leading-[16px]">
        {/* The sections, shown at the top of the page when Sections preview is on. */}
        {switches.preview && <LayoutBars model={menuBar} dispatch={dispatchMenuBar} folded />}
        <p className={`thaw-simple-hint ${group}`}>
          <Glyph name="simple-hint" />
          Hold ⌘ and drag icons to the left of the divider in your menu bar to hide them. Click
          Thaw’s icon to show them again.
        </p>
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
            'Item arrangement',
            arrangements[modes[chosen] ?? ''] ?? null,
            <fieldset className="thaw-choice thaw-choice-pill relative h-[30px] w-[157px] flex-none self-start">
              <legend className="sr-only">Item arrangement</legend>
              {modes.map((mode, at) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={at === chosen}
                  onClick={() => set(arrangement, at)}
                  className={`thaw-choice-option thaw-ui-ring ${at === chosen ? 'thaw-chosen' : ''}`}
                  style={
                    arrangement?.item.options?.[at]
                      ? {
                          left: arrangement.item.options[at].x,
                          width: arrangement.item.options[at].w,
                        }
                      : undefined
                  }
                >
                  {mode}
                </button>
              ))}
            </fieldset>,
          )}
          {row(
            'Hide items again',
            null,
            <PopUp
              label="Hide items again"
              chosen="When I click elsewhere"
              onPress={() => onInert('Hide items again')}
              className="mr-1 flex-none"
            />,
          )}
          {row(
            'Always Hidden section',
            'Adds a second divider. Icons left of it stay hidden until you double-click Thaw’s icon.',
            <Switch
              on={menuBar.alwaysHidden}
              label="Always Hidden section"
              onChange={() => set(alwaysHidden, !menuBar.alwaysHidden)}
            />,
          )}
          {row(
            'Sections preview',
            'Shows your Visible, Hidden and Always Hidden items at the top of this page.',
            <Switch
              on={switches.preview}
              label="Sections preview"
              onChange={() => onSwitch('preview')}
            />,
          )}
          {row(
            'Shortcut to show and hide',
            null,
            // The app records a shortcut here; a web page cannot claim one from the Mac.
            <button
              type="button"
              onClick={() => onInert('Record Shortcut')}
              className={`${push} thaw-capsule h-6 w-[351px] flex-none text-[13px]`}
            >
              Record Shortcut
            </button>,
          )}
          {row(
            'Check for updates automatically',
            null,
            <Switch
              on={switches.updates}
              label="Check for updates automatically"
              onChange={() => onSwitch('updates')}
            />,
          )}
        </div>
      </div>
    </div>
  );
}

/** The hint's symbol, cut from the capture like the sidebar's. */
function Glyph({ name }: { name: string }) {
  // biome-ignore lint/performance/noImgElement: a fixed-size cut-out, laid out to the half point
  return <img src={`/desktop/thaw/${name}.png`} alt="" width={20} height={18} />;
}
