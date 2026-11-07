/** The channels the changelog filters by, from the most finished to the least. */
export const channels = ['Stable', 'Release candidate', 'Beta', 'Alpha'];

/**
 * The channel a release is filtered under. The early previews were alphas in all but name,
 * so they are shown with the alphas rather than given a choice of their own.
 */
export function channelGroup(channel: string) {
  return channel === 'Preview' ? 'Alpha' : channel;
}

/** A channel as an entry carries it in data-channel: "Release candidate" is "release-candidate". */
export function channelKey(channel: string) {
  return channelGroup(channel).toLowerCase().replace(/\s+/g, '-');
}
