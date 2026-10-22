'use client';

import './thaw-window.css';
import { type Dispatch, type HTMLAttributes, useCallback, useState } from 'react';
import { LayoutBars, layoutBars } from './layout-bars';
import type { MenuBarAction, MenuBarModel } from './menu-bar-model';
import type { ThawSwitches } from './model';
import { labelBefore, Pane, type PaneItem, type PaneValues, paneDefinitions } from './thaw-pane';
import { SimplePane } from './thaw-simple';
import { Menu, SearchField, SidebarRow, ToolbarTitle, TrafficLights } from './thaw-ui';

/** Where the images cut from the real window's capture are served from. */
const glyphs = '/desktop/thaw';

/** Each page's id, its name in the sidebar, and the line under it in the toolbar. */
const panes = [
  ['general', 'General', 'Startup, language and icon'],
  ['layout', 'Layout', 'Shown, hidden and always hidden'],
  ['visibility', 'Visibility', 'How hidden items appear'],
  ['appearance', 'Appearance', 'Colour, shape and borders'],
  ['thaw-bar', 'Thaw Bar', 'Hidden items below the menu bar'],
  ['displays', 'Displays & Spaces', 'Settings for each display and Space'],
  ['shortcuts', 'Shortcuts', 'Keyboard shortcuts'],
  ['profiles', 'Profiles', 'Saved layouts to switch between'],
  ['automation', 'Automation', 'Triggers, other apps and scripts'],
  ['experiments', 'Experiments', 'Features still in testing'],
  ['privacy', 'Privacy', 'Permissions and access'],
  ['troubleshooting', 'Troubleshooting', 'Logs, backups and resets'],
  ['about', 'About', 'Version, updates and credits'],
] as const;

/**
 * Where each sidebar row sits, in points from the window's top: the everyday pages, then
 * Modules and Manage under their headings, and About on its own (SettingsSidebarPaneList.swift).
 */
const rowTops = [60, 94, 128, 162, 196, 230, 264, 334, 368, 402, 472, 506, 558];
const sidebarHeadings = [
  { title: 'Modules', top: 314 },
  { title: 'Manage', top: 452 },
];

/** General's switches, by the label of their row, and the state each one sets here. */
const generalSwitches: Record<string, string> = {
  'Launch at Login': 'login',
  'Simple Mode': 'simple',
  'Show setting descriptions': 'descriptions',
  'Show Thaw icon': 'icon',
  'Hide app menus when showing menu bar items': 'menus',
  'Right-click the menu bar for the Thaw menu': 'right-click',
};

function Glyph({ name, ...style }: { name: string } & React.CSSProperties) {
  // biome-ignore lint/performance/noImgElement: a fixed-size cut-out, laid out to the half point
  return <img src={`${glyphs}/${name}.png`} alt="" style={style} />;
}

interface ThawWindowProps {
  /** Shrinks the whole window to fit a small desktop; 1 is its real size. */
  scale: number;
  /** Spread on the strip the window is dragged by. */
  dragProps: HTMLAttributes<HTMLDivElement>;
  switches: ThawSwitches;
  onSwitch: (id: string) => void;
  /** Called for a control that has nothing behind it here, with its name. */
  onInert: (name: string) => void;
  /** Says a line of its own in the same place. */
  onNotice: (message: string) => void;
  menuBar: MenuBarModel;
  dispatchMenuBar: Dispatch<MenuBarAction>;
  /** What the visitor has changed in the generated panes, by pane id. */
  paneValues: Record<string, PaneValues>;
  onPaneChange: (
    pane: string,
    index: number,
    value: boolean | number | string,
    item: PaneItem,
  ) => void;
  onClose: () => void;
  onMinimize: () => void;
}

const noValues: PaneValues = {};

/**
 * Thaw's settings window. General is laid out by hand; every other pane is
 * drawn from a definition generated from the real window (thaw-pane.tsx).
 */
export function ThawWindow({
  scale,
  dragProps,
  switches,
  onSwitch,
  onInert,
  onNotice,
  menuBar,
  dispatchMenuBar,
  paneValues,
  onPaneChange,
  onClose,
  onMinimize,
}: ThawWindowProps) {
  // The panes visited, and where in that trail the window is, for Back and Forward.
  const [trail, setTrail] = useState({ panes: [0], at: 0 });
  const pane = trail.panes[trail.at];
  const setPane = (next: number) =>
    setTrail((current) =>
      next === current.panes[current.at]
        ? current
        : { panes: [...current.panes.slice(0, current.at + 1), next], at: current.at + 1 },
    );
  const step = (by: number) => setTrail((current) => ({ ...current, at: current.at + by }));
  const canGoBack = trail.at > 0;
  const canGoForward = trail.at < trail.panes.length - 1;
  // Whether the toolbar's More menu is open.
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const [paneId, paneName, paneSummary] = panes[pane];
  // The toolbar's first button slides the sidebar away and back, as in the app.
  const [sidebarShown, setSidebarShown] = useState(true);
  // Simple Mode is the window as one page: no sidebar, no panes, and a toolbar with only
  // All Settings, the way back, and the More menu (SettingsView.swift).
  const simple = switches.simple;
  // General's switches show the state they set, wherever else it was changed.
  const general = paneDefinitions[0];
  const generalValues: PaneValues = {};
  general.items.forEach((item, index) => {
    const id = item.t === 'switch' ? generalSwitches[labelBefore(general.items, index)] : undefined;
    if (id) generalValues[index] = switches[id];
  });

  return (
    <div
      className="thaw-window"
      data-mode={simple ? 'simple' : undefined}
      data-sidebar={sidebarShown ? undefined : 'hidden'}
      style={{ zoom: scale }}
    >
      {/* Out of reach while it is hidden, so Tab does not land on rows nobody can see. */}
      <div className="thaw-sidebar" inert={!sidebarShown} hidden={simple}>
        {sidebarHeadings.map((heading) => (
          <p key={heading.title} className="thaw-sidebar-heading" style={{ top: heading.top }}>
            {heading.title}
          </p>
        ))}
        {panes.map(([id, label], index) => (
          <SidebarRow
            key={id}
            current={index === pane}
            onClick={() => setPane(index)}
            className="thaw-sidebar-row pl-9"
            style={{ position: 'absolute', left: 10, top: rowTops[index], width: 200 }}
            icon={<Glyph name={id} left={5} top={3} width={28} height={26} opacity={0.8} />}
          >
            {label}
          </SidebarRow>
        ))}
      </div>
      <div className="thaw-drag" {...dragProps} />

      <TrafficLights
        name="Thaw Settings"
        onClose={onClose}
        onMinimize={onMinimize}
        className="thaw-lights"
        style={{ position: 'absolute', left: 19, top: 19 }}
      />

      {simple ? (
        <>
          <div className="thaw-simple-title">Thaw: Simple Mode</div>
          {/* The way back to every page, beside More (SettingsView.swift). */}
          <button
            type="button"
            onClick={() => onSwitch('simple')}
            className="thaw-glass thaw-all-settings"
            style={{ left: 665, width: 91 }}
          >
            All Settings
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-label={sidebarShown ? 'Hide Sidebar' : 'Show Sidebar'}
            onClick={() => setSidebarShown(!sidebarShown)}
            className="thaw-glass thaw-lead"
            style={{ left: 176, width: 36, background: 'var(--circle)' }}
          >
            <Glyph name="tb-sidebar" left={6} top={7} width={24} height={22} />
          </button>
          <div className="thaw-glass thaw-lead" style={{ left: 228, width: 73 }}>
            <button
              type="button"
              aria-label="Back"
              disabled={!canGoBack}
              onClick={() => step(-1)}
              className="thaw-history"
              style={{ left: 0 }}
            >
              <Glyph name="tb-back" left={11} top={7} width={15} height={22} />
            </button>
            <button
              type="button"
              aria-label="Forward"
              disabled={!canGoForward}
              onClick={() => step(1)}
              className="thaw-history"
              style={{ left: 36 }}
            >
              <Glyph name="tb-forward" left={11} top={7} width={15} height={22} />
            </button>
          </div>
          {/* Keyed by pane so the title fades in again each time it changes. */}
          <ToolbarTitle
            key={paneId}
            title={paneName}
            subtitle={paneSummary}
            className="thaw-fade thaw-lead gap-[3px]"
            // The words start at 313; the room before them keeps a letter's overhang from being cut.
            style={{ left: 303, top: 12, paddingLeft: 10 }}
          />
        </>
      )}
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen(!moreOpen)}
        className="thaw-glass"
        // The window is narrower in Simple Mode, and the button keeps to its right edge.
        style={{ left: simple ? 760 : 541, width: 36 }}
      >
        <Glyph name="tb-more" left={8} top={8} width={20} height={20} opacity={0.85} />
      </button>
      {moreOpen && (
        // The rows and their order are the app's (SettingsView.swift); a row with nothing
        // behind it here says so.
        <Menu
          align="left"
          // Simple Mode's row is ticked when it is on, so the room for a tick is kept.
          inset
          style={{
            left: simple ? 'auto' : 541,
            right: simple ? 8 : 'auto',
            top: 48,
            marginTop: 0,
          }}
          rows={moreRows(switches).map(
            (row) =>
              row && {
                label: row.label,
                disabled: row.disabled,
                checked: row.checked,
                onPick() {
                  if (row.toggles) onSwitch(row.toggles);
                  else onInert(row.label.replace('…', ''));
                },
              },
          )}
          onClose={closeMore}
        />
      )}
      <SearchField
        hidden={simple}
        onClick={() => onInert('Search')}
        icon={<Glyph name="tb-search" left={9} top={10} width={17} height={17} opacity={0.6} />}
        // The capture sets the word half a point above the capsule's middle.
        style={{
          position: 'absolute',
          left: 585,
          top: 8,
          width: 325,
          paddingLeft: 32,
          paddingBottom: 1,
        }}
      />

      {simple && (
        <SimplePane
          switches={switches}
          onSwitch={onSwitch}
          menuBar={menuBar}
          dispatchMenuBar={dispatchMenuBar}
          paneValues={paneValues}
          onPaneChange={onPaneChange}
          onInert={onInert}
        />
      )}

      {!simple && (
        <Pane
          key={paneId}
          pane={paneDefinitions[pane]}
          values={paneId === 'general' ? generalValues : (paneValues[paneId] ?? noValues)}
          onChange={(index, value, item) => {
            if (paneId === 'general') {
              const id = generalSwitches[labelBefore(paneDefinitions[pane].items, index)];
              if (!id) return onInert(item.label || item.text || '');
              onSwitch(id);
              // These change nothing in this window, and say so.
              if (['login', 'descriptions', 'right-click'].includes(id)) onInert(item.label || '');
              return;
            }
            onPaneChange(paneId, index, value, item);
          }}
          onInert={onInert}
          onNotice={onNotice}
          // Switching Always Hidden off takes the third bar away and moves the rest up.
          shift={
            paneId === 'layout' && !menuBar.alwaysHidden
              ? {
                  // From the third bar's heading to its bottom edge.
                  after: layoutBars.top + 2 * layoutBars.pitch - 24,
                  gone: layoutBars.height + 26,
                  by: -layoutBars.pitch,
                }
              : undefined
          }
        >
          {paneId === 'layout' && <LayoutBars model={menuBar} dispatch={dispatchMenuBar} />}
        </Pane>
      )}
    </div>
  );
}

interface ToolbarRow {
  label: string;
  disabled?: boolean;
  checked?: boolean;
  /** The General switch this row flips. */
  toggles?: string;
}

/** The toolbar's More menu; null is a divider. */
const moreRows = (switches: ThawSwitches): (ToolbarRow | null)[] => [
  { label: 'Swap Shown and Hidden Items' },
  { label: 'Zen Mode' },
  null,
  { label: 'Zoom' },
  null,
  { label: 'Simple Mode', checked: switches.simple, toggles: 'simple' },
];
