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

/**
 * Whether a release's tag already says its channel: "2.2.0-beta.2" is a beta, "2.0.0-rc.1" a
 * release candidate. Such a release is not told its channel a second time beside its number.
 */
export function tagSaysChannel(tag: string, channel: string) {
  const word = channel === 'Release candidate' ? 'rc' : channel.toLowerCase();
  return new RegExp(`[-.]${word}\\b`, 'i').test(tag);
}

/** A channel as an entry carries it in data-channel, by its group: "Preview" is "alpha". */
export function channelKey(channel: string) {
  return channelGroup(channel).toLowerCase().replace(/\s+/g, '-');
}
