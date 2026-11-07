/**
 * The macOS versions a release says it runs on, newest first: "macOS 14 and 15" is 15 and 14.
 * The changelog filters by one version at a time, and a release shows under each of its own.
 */
export function macosVersions(system?: string) {
  return [...(system?.matchAll(/\d+/g) ?? [])].map(Number).sort((a, b) => b - a);
}
