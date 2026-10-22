/**
 * The options behind each pop-up in Thaw's settings, in the app's order, by
 * pane and by the pop-up's name. null is a divider. A pop-up that is not
 * listed here is shown with its current value and does not open.
 */
// Placeholders: a MacBook's own notched screen, and one plugged into it.
const displays = ['Built-in Display', 'External Display'];
const automaticUpdates = ['Off', 'Check only', 'Check and download'];

// Read from the app's own pop-ups (Thaw 3.0.0-beta.4), with the placeholders above for the
// displays and profile of the Mac they were read on.
const options: Record<string, Record<string, (string | null)[]>> = {
  layout: {
    'Item arrangement': ['Automatic', 'Manual'],
    'Section divider style': ['None', 'Chevron', 'Line', 'Dot', 'Slash', 'Custom'],
  },
  visibility: {
    'Where the panel opens': ['Where you left it', 'Centered', 'At the pointer'],
  },
  appearance: {
    'Shape fill': ['None', 'Solid', 'Gradient', 'Glass', 'Adaptive', 'Adaptive Gradient'],
    Background: ['None', 'Solid', 'Gradient', 'Glass', 'Adaptive'],
    'Glass Style': [
      'Match System',
      'Regular',
      'Clear',
      'Liquid Glass',
      'Dynamic Glass',
      'Invert (Experimental)',
      'Edge (Experimental)',
      'Sheer (Experimental)',
      'Dim (Experimental)',
    ],
  },
  'thaw-bar': {
    // In the app this lists whichever displays are connected.
    Display: displays,
    Location: ['Dynamic', 'Mouse pointer', 'Thaw icon', 'Left aligned', 'Right aligned'],
    Arrangement: ['Horizontal', 'Vertical', 'Grid'],
  },
  displays: {
    'When spacing changes': [
      'Ask before restarting menu bar apps',
      'Restart menu bar apps right away',
      'Wait until the apps restart',
    ],
  },
  profiles: {
    'On this display': ['None', ...displays],
  },
  automation: {
    Profile: ['Desk'],
  },
  privacy: {
    Display: displays,
    'Automatic updates': automaticUpdates,
  },
};

export function optionsFor(pane: string, label: string) {
  // Some pop-ups report their name twice, as "Shape fill, Shape fill".
  return options[pane]?.[label.split(', ')[0]] ?? null;
}
