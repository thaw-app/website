'use client';

import { ArrowUpDown } from 'lucide-react';
import {
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { BarItemView } from './bar-item';
import { barItems, type MenuBarAction, type MenuBarModel, type SectionId } from './menu-bar-model';
import { Menu } from './thaw-ui';

/** Where each section's bar sits in the Layout pane, in points from its top. */
export const layoutBars = { top: 119.5, pitch: 85.5, height: 40 };

const names: Record<SectionId, string> = {
  visible: 'Visible',
  hidden: 'Hidden',
  alwaysHidden: 'Always Hidden',
};

/**
 * The Layout pane's section bars. Dragging an item along a bar or onto
 * another one, or moving it with the arrow keys, changes the shared model,
 * so the menu bar follows. Simple Mode shows the same editor `folded`: the
 * bars stacked on one surface, each with its section's name before it and its
 * sort menu after (FoldedMenuBar.swift).
 */
export function LayoutBars({
  model,
  dispatch,
  folded,
}: {
  model: MenuBarModel;
  dispatch: Dispatch<MenuBarAction>;
  folded?: boolean;
}) {
  // The section whose sort menu is open, in the folded bars.
  const [sorting, setSorting] = useState<SectionId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const hintId = useId();
  // The item to hand focus back to once a key press has moved it, since moving
  // it to another bar draws it afresh.
  const refocus = useRef<string | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each rearrangement
  useEffect(() => {
    if (!refocus.current) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-item="${refocus.current}"]`)?.focus();
    refocus.current = null;
  }, [model.sections]);
  const sections: SectionId[] = model.alwaysHidden
    ? ['visible', 'hidden', 'alwaysHidden']
    : ['visible', 'hidden'];

  // The same moves from the keyboard: left and right along a bar, up and down between bars.
  function onKeyDown(event: KeyboardEvent, id: string, section: SectionId) {
    const at = model.sections[section].indexOf(id);
    const row = sections.indexOf(section);
    let to = section;
    let index = at;
    if (event.key === 'ArrowLeft') index = at - 1;
    else if (event.key === 'ArrowRight') index = at + 1;
    else if (event.key === 'ArrowUp' && row > 0) to = sections[row - 1];
    else if (event.key === 'ArrowDown' && row < sections.length - 1) to = sections[row + 1];
    else return;
    event.preventDefault();
    if (to !== section) index = model.sections[to].length;
    if (index < 0 || (to === section && index >= model.sections[section].length)) return;
    refocus.current = id;
    dispatch({ type: 'move', id, to, index });
  }

  // Find the bar under the pointer, and how many of its items lie to the pointer's left.
  function drop(event: PointerEvent) {
    if (!dragging || !rootRef.current) return;
    const bars = [...rootRef.current.querySelectorAll<HTMLElement>('[data-bar]')];
    const bar =
      bars.find((candidate) => {
        const box = candidate.getBoundingClientRect();
        return event.clientY >= box.top - 12 && event.clientY <= box.bottom + 12;
      }) ?? null;
    if (!bar) return;
    const others = [...bar.querySelectorAll<HTMLElement>('[data-item]')].filter(
      (element) => element.dataset.item !== dragging,
    );
    const index = others.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.left + box.width / 2 < event.clientX;
    }).length;
    dispatch({ type: 'move', id: dragging, to: bar.dataset.bar as SectionId, index });
  }

  const bar = (section: SectionId, className: string, style?: CSSProperties) => (
    // biome-ignore lint/a11y/useSemanticElements: a strip of the menu bar, not a form group
    <div
      role="group"
      aria-label={`${names[section]} items`}
      data-bar={section}
      className={className}
      style={style}
    >
      {model.sections[section].map((id) => (
        <button
          key={id}
          type="button"
          data-item={id}
          aria-label={barItems[id]?.name}
          aria-describedby={hintId}
          title={barItems[id]?.name}
          onKeyDown={(event) => onKeyDown(event, id, section)}
          onPointerDown={(event) => {
            rootRef.current?.setPointerCapture(event.pointerId);
            setDragging(id);
          }}
          className={`thaw-layout-item ${dragging === id ? 'thaw-layout-item-dragging' : ''}`}
          // Each item gets the same room either side of its artwork, and the clock, which is
          // as wide as the time it tells, the same either side of that.
          style={
            barItems[id]?.kind === 'clock'
              ? { paddingInline: 6 }
              : { width: (barItems[id]?.w ?? 0) + 12 }
          }
        >
          <BarItemView id={id} />
        </button>
      ))}
    </div>
  );

  // By name, as the app sorts a section. One move at a time, which the model already knows.
  function sort(section: SectionId, descending: boolean) {
    const sorted = [...model.sections[section]].sort((a, b) =>
      (barItems[a]?.name ?? a).localeCompare(barItems[b]?.name ?? b),
    );
    if (descending) sorted.reverse();
    sorted.forEach((id, index) => {
      dispatch({ type: 'move', id, to: section, index });
    });
  }

  return (
    <div
      ref={rootRef}
      onPointerMove={drop}
      onPointerUp={() => setDragging(null)}
      onPointerCancel={() => setDragging(null)}
      className={folded ? 'thaw-folded' : undefined}
    >
      <p id={hintId} className="sr-only">
        Arrow keys move the focused item: left and right along its section, up and down to another
        section.
      </p>
      {sections.map((section, row) => {
        if (folded) {
          return (
            <div key={section} className="thaw-fold-row">
              <h3>{names[section]}</h3>
              {bar(section, 'thaw-layout-bar')}
              <span className="relative flex">
                <button
                  type="button"
                  aria-label={`Sort ${names[section]} items`}
                  title="Sort this section by name."
                  aria-haspopup="menu"
                  aria-expanded={sorting === section}
                  onClick={() => setSorting(sorting === section ? null : section)}
                  className="thaw-fold-sort thaw-ui-ring"
                >
                  <ArrowUpDown aria-hidden className="size-3.5" />
                </button>
                {sorting === section && (
                  <Menu
                    label={`Sort ${names[section]} items`}
                    rows={[
                      { label: 'Sort A–Z', onPick: () => sort(section, false) },
                      { label: 'Sort Z–A', onPick: () => sort(section, true) },
                    ]}
                    onClose={() => setSorting(null)}
                  />
                )}
              </span>
            </div>
          );
        }
        const top = layoutBars.top + layoutBars.pitch * row;
        return (
          <div key={section}>
            {/* The pane's own data labels the first two bars; the third appears only when switched on. */}
            {section === 'alwaysHidden' && (
              <h3
                className="thaw-el thaw-h"
                style={{
                  left: 24,
                  top: top - 23,
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: '13px',
                }}
              >
                {names[section]}
              </h3>
            )}
            {bar(section, 'thaw-el thaw-layout-bar', {
              left: 20,
              top,
              width: 668,
              height: layoutBars.height,
            })}
          </div>
        );
      })}
    </div>
  );
}
