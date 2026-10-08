'use client';

import { useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { docsRoute } from '@/lib/shared';
import { Dock } from './dock';
import { hotkeyMatches } from './floe-controls';
import { defaultFloeData } from './floe-pages';
import { FloeWindow } from './floe-window';
import { Launcher } from './launcher';
import { MenuBar, ThawBar } from './menu-bar';
import { initialMenuBar, menuBarReducer } from './menu-bar-model';
import {
  type Appearance,
  type DesktopAction,
  defaultAppearance,
  defaultFloeSettings,
  defaultSwitches,
} from './model';
import { StatusMenu, type StatusMenuRow } from './status-menu';
import { labelBefore, type PaneItem, type PaneValues, paneDefinitions } from './thaw-pane';
import { ThawWindow } from './thaw-window';
import { usePresence } from './use-presence';
import { Window } from './window';

/**
 * The panes start as the real window was captured, with two corrections so
 * they agree with the menu bar's own starting state: Click reveals hidden
 * items, and the Thaw Bar is as the capture had it.
 */
const initialPaneValues: Record<string, PaneValues> = (() => {
  const at = (pane: string, match: (item: PaneItem, index: number, items: PaneItem[]) => boolean) =>
    paneDefinitions.find((definition) => definition.id === pane)?.items.findIndex(match) ?? -1;
  const click = at('visibility', (item) => item.t === 'segment' && item.text === 'Click');
  const thawBar = at(
    'thaw-bar',
    (item, index, items) => item.t === 'switch' && labelBefore(items, index) === 'Use Thaw Bar',
  );
  return {
    visibility: click >= 0 ? { [click]: true } : {},
    'thaw-bar': thawBar >= 0 ? { [thawBar]: initialMenuBar.thawBar } : {},
  };
})();

/** The settings window's real size in points, and the room to leave around it. */
const thawWindow = { width: 918, height: 652 };
const margin = { side: 12, top: 38, bottom: 8 };

/**
 * A mock Mac desktop: a menu bar Thaw tidies, Thaw's settings window copied
 * from the real one, Floe's launcher, and a Dock to open them from. None of
 * it is the real apps, and the page says so beside it.
 */
export function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const thawDockRef = useRef<HTMLButtonElement>(null);
  const floeSettingsRef = useRef<HTMLDivElement>(null);
  const floeDockRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const [menuBar, dispatchMenuBar] = useReducer(menuBarReducer, initialMenuBar);
  const [switches, setSwitches] = useState(defaultSwitches);
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [paneValues, setPaneValues] = useState(initialPaneValues);
  // A line shown when a control is used that has nothing behind it in the demo.
  const [notice, setNotice] = useState<string | null>(null);
  const onInert = useCallback((name: string) => {
    setNotice(name ? `${name} is not part of this demo.` : 'That is not part of this demo.');
  }, []);
  const onNotice = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  // On a phone the desktop is too small to work, so it is shown but not operable.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(narrow.matches);
    update();
    narrow.addEventListener('change', update);
    return () => narrow.removeEventListener('change', update);
  }, []);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  // Minimized is not closed: the window stays as it was left, out of sight in the Dock.
  const [settingsMinimized, setSettingsMinimized] = useState(false);
  // From the window's middle to Thaw's Dock icon, the way it shrinks and comes back.
  const [dockPull, setDockPull] = useState<{ x: number; y: number } | null>(null);
  const [floeSettingsOpen, setFloeSettingsOpen] = useState(false);
  const [floeSettingsMinimized, setFloeSettingsMinimized] = useState(false);
  const [floeDockPull, setFloeDockPull] = useState<{ x: number; y: number } | null>(null);
  const [floePage, setFloePage] = useState('general');
  const [floeSettings, setFloeSettings] = useState(defaultFloeSettings);
  const [floeData, setFloeData] = useState(defaultFloeData);
  // Where Floe's own menu hangs from its menu bar item, while it is open.
  const [floeMenu, setFloeMenu] = useState<{ x: number; y: number } | null>(null);
  const [front, setFront] = useState<'launcher' | 'settings' | 'floe-settings'>('settings');
  // The desktop's size, known only once it is on screen.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const desktop = desktopRef.current;
    if (!desktop) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: desktop.clientWidth, height: desktop.clientHeight }),
    );
    observer.observe(desktop);
    return () => observer.disconnect();
  }, []);

  // Revealed items tuck themselves away again after the time set on Visibility.
  const { hiddenShown, autoRehide, rehideSeconds } = menuBar;
  useEffect(() => {
    if (!hiddenShown || !autoRehide) return;
    const timer = setTimeout(() => dispatchMenuBar({ type: 'hide-hidden' }), rehideSeconds * 1000);
    return () => clearTimeout(timer);
  }, [hiddenShown, autoRehide, rehideSeconds]);

  const launcher = usePresence(launcherOpen);
  const settings = usePresence(settingsOpen);
  const settingsShown = usePresence(!settingsMinimized, 300);
  const floeWindow = usePresence(floeSettingsOpen);
  const floeWindowShown = usePresence(!floeSettingsMinimized, 300);

  const scale = size
    ? Math.min(
        1,
        (size.width - 2 * margin.side) / thawWindow.width,
        (size.height - margin.top - margin.bottom) / thawWindow.height,
      )
    : 1;

  function openMenu(point: { clientX: number; clientY: number }, source: 'icon' | 'bar') {
    // A right-click on the bar itself only counts while that setting is on.
    if (source === 'bar' && !switches['right-click']) return;
    const desktop = desktopRef.current;
    if (!desktop) return;
    const box = desktop.getBoundingClientRect();
    // Keep the menu inside the desktop's right edge.
    setMenu({ x: Math.min(point.clientX - box.left, box.width - 220), y: 32 });
  }

  const closeMenu = useCallback(() => setMenu(null), []);
  const closeFloeMenu = useCallback(() => setFloeMenu(null), []);

  function openFloeMenu(point: { clientX: number }) {
    const box = desktopRef.current?.getBoundingClientRect();
    if (box) setFloeMenu({ x: Math.min(point.clientX - box.left, box.width - 220), y: 32 });
  }

  function showThawSettings() {
    setSettingsOpen(true);
    setSettingsMinimized(false);
    setFront('settings');
  }

  function minimizeThawSettings() {
    const from = settingsRef.current?.getBoundingClientRect();
    const to = thawDockRef.current?.getBoundingClientRect();
    if (from && to) {
      setDockPull({
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
      });
    }
    setSettingsMinimized(true);
    // The button just pressed is about to vanish; its way back is the Dock icon.
    thawDockRef.current?.focus({ preventScroll: true });
  }

  function closeThawSettings() {
    setSettingsOpen(false);
    // The next time it opens it is a new window, with no Dock to come out of.
    setDockPull(null);
  }

  /** A row of a status menu that has nothing behind it here, and says so. */
  const inertRow = (label: string, said = label.replace('…', '')): StatusMenuRow => ({
    label,
    onPick: () => onInert(said),
  });

  function onPaneChange(
    pane: string,
    index: number,
    value: boolean | number | string,
    item: PaneItem,
  ) {
    setPaneValues((current) => ({ ...current, [pane]: { ...current[pane], [index]: value } }));

    // A switch has no name of its own; it is known by the label of its row.
    const items = paneDefinitions.find((definition) => definition.id === pane)?.items ?? [];
    const label = item.label || item.text || labelBefore(items, index);
    const set = (change: Parameters<typeof dispatchMenuBar>[0] & { type: 'set' }) =>
      dispatchMenuBar(change);

    if (pane === 'visibility') {
      if (item.t === 'segment' && item.multi) {
        const way = (item.text ?? '').toLowerCase() as 'click' | 'hover' | 'scroll';
        set({ type: 'set', change: { revealOn: { ...menuBar.revealOn, [way]: value === true } } });
      } else if (item.t === 'switch' && label === 'Automatically rehide') {
        set({ type: 'set', change: { autoRehide: value === true } });
      } else if (item.t === 'slider' && typeof value === 'number') {
        set({ type: 'set', change: { rehideSeconds: value } });
      }
    } else if (pane === 'layout' && item.t === 'switch' && label === 'Always Hidden') {
      set({ type: 'set', change: { alwaysHidden: value === true } });
    } else if (pane === 'thaw-bar' && item.t === 'switch' && label === 'Use Thaw Bar') {
      set({ type: 'set', change: { thawBar: value === true } });
    }
    if (pane !== 'appearance') return;

    // The Appearance pane restyles the menu bar above the window as it is edited.
    if (item.t === 'shape' && value === true) {
      setAppearance((current) => ({ ...current, shape: item.shape as Appearance['shape'] }));
    } else if (item.t === 'segment' && value === true) {
      setAppearance((current) => ({
        ...current,
        ends: item.text === 'Square' ? 'square' : 'round',
      }));
    } else if (item.t === 'popup' && label.startsWith('Shape fill') && typeof value === 'string') {
      // Glass and the adaptive fills take their colour from what is behind the bar,
      // which here is the plain blurred bar.
      const tint = value === 'Solid' ? 'solid' : value.includes('Gradient') ? 'gradient' : 'none';
      setAppearance((current) => ({ ...current, tint }));
    } else if (item.t === 'check' && item.label === 'Border') {
      setAppearance((current) => ({ ...current, border: value === true }));
    }
  }

  function showFloeSettings(page?: string) {
    // As in the app: the launcher steps aside for its settings.
    setLauncherOpen(false);
    if (page) setFloePage(page);
    setFloeSettingsOpen(true);
    setFloeSettingsMinimized(false);
    setFront('floe-settings');
  }

  function closeFloeSettings() {
    setFloeSettingsOpen(false);
    // The next time it opens it is a new window, with no Dock to come out of.
    setFloeDockPull(null);
  }

  // Floe's window shrinks into its Dock icon, or, while Floe is kept out of the Dock, into
  // the tile macOS gives a minimized window there. That tile only exists once the window is
  // minimized, so the way to it is measured after the Dock has drawn it.
  useLayoutEffect(() => {
    if (!floeSettingsMinimized) return;
    const from = floeSettingsRef.current?.getBoundingClientRect();
    const to = floeDockRef.current?.getBoundingClientRect();
    if (from && to) {
      setFloeDockPull({
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
      });
    }
    // The button just pressed is about to vanish; its way back is in the Dock.
    floeDockRef.current?.focus({ preventScroll: true });
  }, [floeSettingsMinimized]);

  function onAction(action: DesktopAction) {
    if (action === 'toggle-menu-bar') dispatchMenuBar({ type: 'toggle-hidden' });
    else if (action === 'open-floe-settings') showFloeSettings();
    else if (action === 'open-floe-about') showFloeSettings('about');
    else showThawSettings();
  }

  function toggleLauncher() {
    const open = !launcherOpen;
    setLauncherOpen(open);
    if (open) {
      setFront('launcher');
      // Wait for the panel to exist before putting the cursor in it.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }

  // The Dock's Floe icon opens the launcher, unless a settings window is waiting in it.
  function onFloeDock() {
    if (floeSettingsOpen && floeSettingsMinimized) showFloeSettings();
    else toggleLauncher();
  }

  function onFloeSetting(id: string, value: boolean | string | number) {
    setFloeSettings((current) => ({ ...current, [id]: value }));
    // Out of the Dock, Floe is still running, and this says where to find it.
    if (id === 'dock' && value === false) {
      onNotice('Floe has left the Dock. Its icon in the menu bar still opens it.');
    }
  }

  // Floe's shortcut opens and closes the launcher while the keyboard is on this desktop,
  // which is as global as a web page's shortcut can be.
  function onKeyDown(event: KeyboardEvent) {
    if (!hotkeyMatches(floeData.hotkeys.open, event)) return;
    event.preventDefault();
    toggleLauncher();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Floe's shortcut is heard wherever on the desktop the keyboard is, as a global one is on a Mac
    <div
      ref={desktopRef}
      inert={compact}
      onKeyDown={onKeyDown}
      // The shape of a 14-inch MacBook Pro's screen: 1512 by 982 points.
      className="desktop-wallpaper relative flex aspect-[1512/982] w-full flex-col overflow-hidden rounded-3xl border text-white"
    >
      <MenuBar
        model={menuBar}
        dispatch={dispatchMenuBar}
        appearance={appearance}
        showIcon={switches.icon}
        hideMenus={switches.menus}
        settingsOpen={settingsOpen}
        onMenu={openMenu}
        onFloeMenu={openFloeMenu}
      />
      <ThawBar model={menuBar} />

      {menu && (
        // The menu Thaw opens from its icon, or from a right-click on the menu bar. The rows
        // and their order are the app's; three of them do something here.
        <StatusMenu
          label="Thaw"
          at={menu}
          accent="#ffbf00"
          onAccent="#000"
          groups={[
            [
              { label: 'Settings…', onPick: showThawSettings },
              {
                label: 'What’s New…',
                onPick: () => router.push(`${docsRoute}/thaw/changelog`),
              },
            ],
            [inertRow('Search Items…'), inertRow('Show Swap Bar')],
            [
              {
                label: menuBar.hiddenShown ? 'Hide Hidden Items' : 'Show Hidden Items',
                onPick: () => dispatchMenuBar({ type: 'toggle-hidden' }),
              },
            ],
            [inertRow('Check for Updates…'), inertRow('Support Thaw…')],
            [inertRow('Quit Thaw')],
          ]}
          onClose={closeMenu}
        />
      )}

      {floeMenu && (
        // The menu under Floe's menu bar item, with the app's own rows in its order
        // (main.swift). It is how Floe is reached while it is kept out of the Dock.
        <StatusMenu
          label="Floe"
          at={floeMenu}
          accent="#1560e8"
          onAccent="#fff"
          groups={[
            [
              { label: 'Show Floe', onPick: () => !launcherOpen && toggleLauncher() },
              { label: 'About Floe', onPick: () => showFloeSettings('about') },
              inertRow('Check for Updates…'),
              { label: 'Settings…', onPick: () => showFloeSettings() },
            ],
            [inertRow('Quit', 'Quitting Floe')],
          ]}
          onClose={closeFloeMenu}
        />
      )}

      {launcher.mounted && (
        <div
          onPointerDownCapture={() => setFront('launcher')}
          className={`absolute inset-x-0 top-[14%] flex justify-center ${
            front === 'launcher' ? 'z-20' : 'z-10'
          }`}
        >
          {/* The panel keeps its real size and is scaled with the desktop, as the settings
              window is, so it stays in proportion on a smaller one. */}
          <div
            className="desktop-pop"
            data-closing={launcher.closing}
            style={{ width: 750 * scale, height: 474 * scale }}
          >
            <div style={{ scale: String(scale), transformOrigin: 'top left' }}>
              <Launcher
                inputRef={searchRef}
                onAction={onAction}
                onClose={() => setLauncherOpen(false)}
                settings={floeSettings}
                quicklinks={floeData.quicklinks}
                searches={floeData.searches}
                onRemember={(query) =>
                  setFloeData((current) => ({
                    ...current,
                    // The app keeps the last 50, and a search made again moves to the end.
                    searches: [...current.searches.filter((old) => old !== query), query].slice(
                      -50,
                    ),
                  }))
                }
                onInert={onInert}
              />
            </div>
          </div>
        </div>
      )}

      {settings.mounted && size && (
        <Window
          title="Thaw Settings"
          boundsRef={desktopRef}
          initial={{ x: (size.width - thawWindow.width * scale) / 2, y: margin.top }}
          front={front === 'settings'}
          hidden={!settingsShown.mounted}
          onFocus={() => setFront('settings')}
        >
          {(dragProps) => (
            <div
              ref={settingsRef}
              className="desktop-pop"
              data-closing={settings.closing}
              // Named only once the window has been to the Dock, so it first opens as any other.
              data-minimized={dockPull ? settingsMinimized : undefined}
              style={
                dockPull
                  ? ({
                      '--dock-x': `${dockPull.x}px`,
                      '--dock-y': `${dockPull.y}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <ThawWindow
                scale={scale}
                dragProps={dragProps}
                switches={switches}
                onInert={onInert}
                onNotice={onNotice}
                onSwitch={(id) => setSwitches((current) => ({ ...current, [id]: !current[id] }))}
                menuBar={menuBar}
                dispatchMenuBar={dispatchMenuBar}
                paneValues={paneValues}
                onPaneChange={onPaneChange}
                onClose={closeThawSettings}
                onMinimize={minimizeThawSettings}
              />
            </div>
          )}
        </Window>
      )}

      {floeWindow.mounted && size && (
        <Window
          title="Floe Settings"
          boundsRef={desktopRef}
          initial={{ x: (size.width - 820 * scale) / 2, y: margin.top + 40 * scale }}
          front={front === 'floe-settings'}
          hidden={!floeWindowShown.mounted}
          onFocus={() => setFront('floe-settings')}
        >
          {(dragProps) => (
            <div
              ref={floeSettingsRef}
              className="desktop-pop"
              data-closing={floeWindow.closing}
              // Named only once the window has been to the Dock, so it first opens as any other.
              data-minimized={floeDockPull ? floeSettingsMinimized : undefined}
              style={
                floeDockPull
                  ? ({
                      '--dock-x': `${floeDockPull.x}px`,
                      '--dock-y': `${floeDockPull.y}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <FloeWindow
                scale={scale}
                dragProps={dragProps}
                pageId={floePage}
                onPage={setFloePage}
                settings={floeSettings}
                onChange={onFloeSetting}
                data={floeData}
                onData={setFloeData}
                onInert={onInert}
                onNotice={onNotice}
                onClose={closeFloeSettings}
                onMinimize={() => setFloeSettingsMinimized(true)}
              />
            </div>
          )}
        </Window>
      )}

      {/* Announced as it appears, so a click that does nothing never goes unanswered. */}
      <p
        role="status"
        className={`pointer-events-none absolute bottom-24 left-1/2 z-40 max-w-[90%] -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-center text-[13px] text-white backdrop-blur transition-opacity duration-200 motion-reduce:transition-none ${
          notice ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {notice}
      </p>
      <Dock
        scale={scale}
        thawOpen={settingsOpen}
        thawMinimized={settingsOpen && settingsMinimized}
        thawRef={thawDockRef}
        floeOpen={launcherOpen || floeSettingsOpen}
        floeInDock={floeSettings.dock === true}
        floeMinimized={floeSettingsOpen && floeSettingsMinimized}
        floeRef={floeDockRef}
        onThaw={showThawSettings}
        onFloe={onFloeDock}
      />
    </div>
  );
}
