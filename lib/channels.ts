/** The channels a release can be on, from the most finished to the least. */
export const channels = ['Stable', 'Release candidate', 'Beta', 'Alpha', 'Preview'];

/** A channel as an entry carries it in data-channel: "Release candidate" is "release-candidate". */
export function channelKey(channel: string) {
  return channel.toLowerCase().replace(/\s+/g, '-');
}
