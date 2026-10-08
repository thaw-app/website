/**
 * The options behind each pop-up in Thaw's settings, in the app's order, by
 * pane and by the pop-up's name. null is a divider. A pop-up that is not
 * listed here is shown with its current value and does not open.
 */
// Placeholders: a MacBook's own notched screen, and one plugged into it.
const displays = ['Built-in Display', 'External Display'];
const automaticUpdates = ['Off', 'Check only', 'Check and download'];

// Read from Thaw's source: each list is the enum or the picker rows the app shows.
const options: Record<string, Record<string, (string | null)[]>> = {
  layout: {
    'Item arrangement': ['Automatic', 'Manual'],
    'Section divider style': ['None', 'Chevron'],
  },
  visibility: {
    'Where the panel opens': ['Where you left it', 'Centered', 'At the pointer'],
  },
  appearance: {
    'Shape fill': ['None', 'Solid', 'Gradient', 'Glass', 'Adaptive', 'Adaptive Gradient'],
    Background: ['None', 'Solid', 'Gradient', 'Glass', 'Adaptive'],
    'Glass Style': ['Match System', 'Regular', 'Clear', 'Liquid Glass', 'Dynamic Glass'],
  },
  'thaw-bar': {
    // In the app this lists whichever displays are connected.
    Display: displays,
    Location: ['Dynamic', 'Mouse pointer', 'Thaw icon', 'Left aligned', 'Right aligned'],
    Arrangement: ['Horizontal', 'Vertical', 'Grid'],
  },
  displays: {
    'When applying spacing': [
      'Apply spacing immediately (restarts menu bar apps)',
      'Wait until next restart (no apps restarted)',
    ],
  },
  privacy: {
    Display: displays,
    'Automatic updates': automaticUpdates,
  },
  about: {
    'Update channel': ['Beta', 'Nightly'],
    'Automatic updates': automaticUpdates,
  },
};

export function optionsFor(pane: string, label: string) {
  // Some pop-ups report their name twice, as "Shape fill, Shape fill".
  return options[pane]?.[label.split(', ')[0]] ?? null;
}
