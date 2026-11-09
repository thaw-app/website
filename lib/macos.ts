/**
 * The macOS versions a release says it runs on, newest first: "macOS 14 and 15" is 15 and 14.
 * The changelog filters by one version at a time, and a release shows under each of its own.
 */
export function macosVersions(system?: string) {
  return [...(system?.matchAll(/\d+/g) ?? [])].map(Number).sort((a, b) => b - a);
}

/**
 * A release summary's macOS part ("macOS 27 only", "macOS 15 and 26", "macOS 26 and later"),
 * and not a name that merely starts with the word.
 */
export const macosPart = /^macOS [\d ,and]+(?:only|later)?$/i;
