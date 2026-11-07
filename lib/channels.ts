/** The channels the changelog filters by, from the most finished to the least. */
export const channels = ['Stable', 'Beta', 'Alpha'];

/**
 * The channel a release is filtered under. Release candidates are the last betas, and the
 * early previews were alphas in all but name, so each is shown with those rather than given
 * a choice of its own.
 */
export function channelGroup(channel: string) {
  if (channel === 'Release candidate') return 'Beta';
  if (channel === 'Preview') return 'Alpha';
  return channel;
}

/** A channel as an entry carries it in data-channel, by its group: "Preview" is "alpha". */
export function channelKey(channel: string) {
  return channelGroup(channel).toLowerCase().replace(/\s+/g, '-');
}
