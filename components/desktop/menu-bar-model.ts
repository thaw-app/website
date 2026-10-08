import catalogue from './thaw-items.json';

/** One of the three places Thaw keeps a menu bar item. */
export type SectionId = 'visible' | 'hidden' | 'alwaysHidden';

export const sectionIds: SectionId[] = ['visible', 'hidden', 'alwaysHidden'];

export interface BarItem {
  name: string;
  /** Size of the item's artwork in points, without the slack around it. */
  w: number;
  h: number;
  /** thaw is Thaw's own icon, clock the time, system one of Apple's, marker the New Items slot. */
  kind?: string;
}

/** Every item by id, read from the real menu bar by reference/build-panes.cjs. */
export const barItems = catalogue.items as Record<string, BarItem>;

/**
 * Everything the menu bar does, in one place. The menu bar draws it, and the
 * Layout, Visibility and Thaw Bar panes edit it.
 */
export interface MenuBarModel {
  /** Item ids in each section, left to right. */
  sections: Record<SectionId, string[]>;
  hiddenShown: boolean;
  alwaysHiddenShown: boolean;
  /** Whether the Always Hidden section exists at all. */
  alwaysHidden: boolean;
  revealOn: { click: boolean; hover: boolean; scroll: boolean };
  autoRehide: boolean;
  rehideSeconds: number;
  /** Show hidden items in a bar under the menu bar, not in it. */
  thawBar: boolean;
}

export const initialMenuBar: MenuBarModel = {
  sections: catalogue.sections as Record<SectionId, string[]>,
  hiddenShown: false,
  alwaysHiddenShown: false,
  alwaysHidden: false,
  revealOn: { click: true, hover: false, scroll: false },
  autoRehide: true,
  rehideSeconds: 13,
  thawBar: false,
};

export type MenuBarAction =
  | { type: 'toggle-hidden' }
  | { type: 'show-hidden' }
  | { type: 'hide-hidden' }
  | { type: 'toggle-always-hidden' }
  | { type: 'move'; id: string; to: SectionId; index: number }
  | { type: 'set'; change: Partial<Omit<MenuBarModel, 'sections'>> };

export function menuBarReducer(model: MenuBarModel, action: MenuBarAction): MenuBarModel {
  switch (action.type) {
    case 'toggle-hidden':
      // Hiding the hidden section takes the always-hidden one with it.
      return model.hiddenShown
        ? { ...model, hiddenShown: false, alwaysHiddenShown: false }
        : { ...model, hiddenShown: true };
    case 'show-hidden':
      return model.hiddenShown ? model : { ...model, hiddenShown: true };
    case 'hide-hidden':
      return { ...model, hiddenShown: false, alwaysHiddenShown: false };
    case 'toggle-always-hidden':
      return model.alwaysHiddenShown
        ? { ...model, alwaysHiddenShown: false }
        : { ...model, hiddenShown: true, alwaysHiddenShown: true };
    case 'move': {
      const from = sectionIds.find((section) => model.sections[section].includes(action.id));
      if (!from) return model;
      // Thaw's own icon marks the edge of the visible section and stays in it.
      if (barItems[action.id]?.kind === 'thaw' && action.to !== 'visible') return model;
      const sections = {
        ...model.sections,
        [from]: model.sections[from].filter((id) => id !== action.id),
      };
      const target = [...sections[action.to]];
      target.splice(Math.min(action.index, target.length), 0, action.id);
      sections[action.to] = target;
      if (sections[from].join() === model.sections[from].join() && from === action.to) return model;
      return { ...model, sections };
    }
    case 'set': {
      const next = { ...model, ...action.change };
      // Turning the Always Hidden section off returns its items to Hidden.
      if (!next.alwaysHidden && model.sections.alwaysHidden.length > 0) {
        next.sections = {
          ...model.sections,
          hidden: [...model.sections.alwaysHidden, ...model.sections.hidden],
          alwaysHidden: [],
        };
        next.alwaysHiddenShown = false;
      }
      return next;
    }
  }
}
