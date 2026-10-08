'use client';

import './thaw-window.css';
import { type Dispatch, type HTMLAttributes, useCallback, useState } from 'react';
import { LayoutBars, layoutBars } from './layout-bars';
import type { MenuBarAction, MenuBarModel } from './menu-bar-model';
import type { ThawSwitches } from './model';
import { Pane, type PaneItem, type PaneValues, paneDefinitions } from './thaw-pane';
import { SimplePane } from './thaw-simple';
import {
  group,
  Menu,
  SearchField,
  SidebarRow,
  Switch,
  ToolbarTitle,
  TrafficLights,
} from './thaw-ui';

/** Where the images cut from the real window's capture are served from. */
const glyphs = '/desktop/thaw';

/** Each pane's id, its name in the sidebar, and the line under it in the toolbar. */
const panes = [
  ['general', 'General', 'Startup, language and icon'],
  ['layout', 'Layout', 'Shown, hidden and always hidden'],
  ['visibility', 'Visibility', 'How hidden items appear'],
  ['appearance', 'Appearance', 'Colour, shape and borders'],
  ['thaw-bar', 'Thaw Bar', 'Hidden items below the menu bar'],
  ['profiles', 'Profiles', 'Saved layouts to switch between'],
  ['shortcuts', 'Shortcuts', 'Keyboard shortcuts'],
  ['automation', 'Automation', 'Shortcuts, URLs and other apps'],
  ['triggers', 'Triggers', 'Show items while an app runs'],
  ['displays', 'Displays', 'Settings for each display'],
  ['spaces', 'Spaces', 'Layouts for each space'],
  ['privacy', 'Privacy', 'Permissions and access'],
  ['experiments', 'Experiments', 'Features still in testing'],
  ['troubleshooting', 'Troubleshooting', 'Logs and resets'],
  ['about', 'About', 'Version, updates and credits'],
] as const;

type Row =
  | { label: string; kind: 'switch'; id: string; beta?: boolean; height: number }
  | { label: string; kind: 'language'; height: number }
  | { label: string; kind: 'icon'; height: number };

/** The General pane. Tops and heights are points measured from the capture. */
const sections: { title: string; titleTop: number; top: number; rows: Row[] }[] = [
  {
    title: 'App',
    titleTop: 88,
    top: 106,
    rows: [
      { label: 'Launch at Login', kind: 'switch', id: 'login', height: 37 },
      { label: 'App language', kind: 'language', height: 41.5 },
      { label: 'Simple Mode', kind: 'switch', id: 'simple', height: 37.5 },
      {
        label: 'Show setting descriptions',
        kind: 'switch',
        id: 'descriptions',
        height: 37,
      },
    ],
  },
  {
    title: 'Thaw icon',
    titleTop: 297,
    top: 315,
    rows: [
      { label: 'Show Thaw icon', kind: 'switch', id: 'icon', height: 37 },
      { label: 'Thaw icon', kind: 'icon', height: 37 },
    ],
  },
  {
    title: 'Menu bar behavior',
    titleTop: 427.5,
    top: 446,
    rows: [
      {
        label: 'Hide app menus when showing menu bar items',
        kind: 'switch',
        id: 'menus',
        height: 36.5,
      },
      {
        label: 'Right-click the menu bar for the Thaw menu',
        kind: 'switch',
        id: 'right-click',
        height: 37.5,
      },
      {
        label: 'Show Live Activities and the camera indicator',
        kind: 'switch',
        id: 'live',
        beta: true,
        height: 37,
      },
    ],
  },
];

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
  // Which of the toolbar's two menus is open.
  const [toolbarMenu, setToolbarMenu] = useState<'profile' | 'more' | null>(null);
  const closeToolbarMenu = useCallback(() => setToolbarMenu(null), []);
  const [paneId, paneName, paneSummary] = panes[pane];
  // The toolbar's first button slides the sidebar away and back, as in the app.
  const [sidebarShown, setSidebarShown] = useState(true);
  // Simple Mode is the window as one page: no sidebar, no panes, and a toolbar with only
  // the More menu, whose ticked Simple Mode row is the way back (SettingsView.swift).
  const simple = switches.simple;

  return (
    <div
      className="thaw-window"
      data-mode={simple ? 'simple' : undefined}
      data-sidebar={sidebarShown ? undefined : 'hidden'}
      style={{ zoom: scale }}
    >
      {/* Out of reach while it is hidden, so Tab does not land on rows nobody can see. */}
      <div className="thaw-sidebar" inert={!sidebarShown} hidden={simple}>
        {panes.map(([id, label], index) => (
          <SidebarRow
            key={id}
            current={index === pane}
            onClick={() => setPane(index)}
            className="pl-9"
            style={{ position: 'absolute', left: 10, top: 52 + 32 * index, width: 190 }}
            icon={
              <Glyph
                name={id}
                left={5}
                top={3}
                width={28}
                height={26}
                // On the accent the glyph is dark in both appearances.
                opacity={index === pane ? 0.88 : 0.8}
                filter={index === pane ? 'invert(1)' : undefined}
              />
            }
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
        <div className="thaw-simple-title">Thaw: Simple Mode</div>
      ) : (
        <>
          <button
            type="button"
            aria-label={sidebarShown ? 'Hide Sidebar' : 'Show Sidebar'}
            onClick={() => setSidebarShown(!sidebarShown)}
            className="thaw-glass thaw-lead"
            style={{ left: 166, width: 36, background: 'var(--circle)' }}
          >
            <Glyph name="tb-sidebar" left={6} top={7} width={24} height={22} />
          </button>
          <div className="thaw-glass thaw-lead" style={{ left: 218, width: 73 }}>
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
            // The words start at 303; the room before them keeps a letter's overhang from being cut.
            style={{ left: 293, top: 12, paddingLeft: 10 }}
          />
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={toolbarMenu === 'profile'}
            onClick={() => setToolbarMenu(toolbarMenu === 'profile' ? null : 'profile')}
            className="thaw-glass"
            style={{ left: 490, width: 153 }}
          >
            <Glyph name="tb-profile" left={7} top={7} width={20} height={22} opacity={0.85} />
            <span style={{ left: 35 }}>No active profile</span>
            <Glyph name="tb-chevron" left={137} top={12} width={11} height={12} opacity={0.8} />
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={toolbarMenu === 'more'}
        onClick={() => setToolbarMenu(toolbarMenu === 'more' ? null : 'more')}
        className="thaw-glass"
        // The window is narrower in Simple Mode, and the button keeps to its right edge.
        style={{ left: simple ? 760 : 651, width: 36 }}
      >
        <Glyph name="tb-more" left={8} top={8} width={20} height={20} opacity={0.85} />
      </button>
      {toolbarMenu && (
        // The rows and their order are the app's (SettingsView.swift); a row with nothing
        // behind it here says so.
        <Menu
          align="left"
          // The profiles the app lists here are ticked, so their room is kept.
          inset
          style={{
            left: toolbarMenu === 'profile' ? 490 : simple ? 'auto' : 651,
            right: simple ? 8 : 'auto',
            top: 48,
            marginTop: 0,
          }}
          rows={(toolbarMenu === 'profile' ? profileRows : moreRows(switches)).map(
            (row) =>
              row && {
                label: row.label,
                disabled: row.disabled,
                checked: row.checked,
                onPick() {
                  if (row.pane) setPane(panes.findIndex(([id]) => id === row.pane));
                  else if (row.toggles) onSwitch(row.toggles);
                  else onInert(row.label.replace('…', ''));
                },
              },
          )}
          onClose={closeToolbarMenu}
        />
      )}
      <SearchField
        hidden={simple}
        onClick={() => onInert('Search')}
        icon={<Glyph name="tb-search" left={9} top={10} width={17} height={17} opacity={0.6} />}
        // The capture sets the word half a point above the capsule's middle.
        style={{
          position: 'absolute',
          left: 695,
          top: 8,
          width: 215,
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

      {!simple && pane > 0 && (
        <Pane
          pane={paneDefinitions[pane]}
          values={paneValues[paneId] ?? noValues}
          onChange={(index, value, item) => onPaneChange(paneId, index, value, item)}
          onInert={onInert}
          onNotice={onNotice}
          // Switching Always Hidden on adds a third bar and moves the rest down.
          shift={
            paneId === 'layout' && menuBar.alwaysHidden
              ? { after: 250, by: layoutBars.pitch }
              : undefined
          }
        >
          {paneId === 'layout' && <LayoutBars model={menuBar} dispatch={dispatchMenuBar} />}
        </Pane>
      )}

      {!simple && pane === 0 && (
        <div className="thaw-live thaw-pane-in">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="thaw-heading" style={{ top: section.titleTop }}>
                {section.title}
              </h3>
              <div className={`thaw-group ${group}`} style={{ top: section.top }}>
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="thaw-row"
                    style={{
                      height: row.height,
                      // The capture sets this row's contents above its middle.
                      paddingBottom: row.kind === 'language' ? 3.5 : undefined,
                    }}
                  >
                    <span style={row.kind === 'switch' && row.beta ? { flex: 'none' } : undefined}>
                      {row.label}
                    </span>
                    {row.kind === 'switch' && row.beta && <span className="thaw-beta">BETA</span>}
                    {row.kind === 'switch' && (
                      <Switch
                        on={switches[row.id]}
                        label={row.label}
                        onChange={() => {
                          onSwitch(row.id);
                          // These three move, and have nothing to change in this window.
                          if (['login', 'descriptions', 'live'].includes(row.id)) {
                            onInert(row.label);
                          }
                        }}
                        // The capture sets a switch a point under its row's middle.
                        className="mt-px"
                      />
                    )}
                    {row.kind === 'language' && (
                      <button
                        type="button"
                        aria-label="App language"
                        onClick={() => onInert('App language')}
                        className="thaw-popup"
                      >
                        <Glyph name="updown" left={4} top={3} width={12} height={14} />
                      </button>
                    )}
                    {row.kind === 'icon' && (
                      <>
                        <span
                          aria-hidden
                          style={{ marginRight: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <i
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: 'currentColor',
                            }}
                          />
                          Dot
                        </span>
                        <button
                          type="button"
                          aria-label="Thaw icon: Dot"
                          onClick={() => onInert('Thaw icon')}
                          className="thaw-popup"
                        >
                          <Glyph name="down" left={4.5} top={5} width={11} height={10} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolbarRow {
  label: string;
  disabled?: boolean;
  checked?: boolean;
  /** The pane this row opens. */
  pane?: string;
  /** The General switch this row flips. */
  toggles?: string;
}

/** The toolbar's two menus; null is a divider. */
const profileRows: (ToolbarRow | null)[] = [
  { label: 'No profiles saved', disabled: true },
  null,
  { label: 'Manage Profiles…', pane: 'profiles' },
];

const moreRows = (switches: ThawSwitches): (ToolbarRow | null)[] => [
  { label: 'Swap Shown and Hidden Items' },
  { label: 'Zen Mode' },
  null,
  { label: 'Zoom' },
  null,
  { label: 'Simple Mode', checked: switches.simple, toggles: 'simple' },
  { label: 'Show Descriptions', checked: switches.descriptions, toggles: 'descriptions' },
  null,
  { label: 'Customize Sidebar…' },
  null,
  { label: 'About Thaw', pane: 'about' },
  { label: 'What’s New…' },
  { label: 'Check for Updates…' },
];
