// fetch, with an end to its patience. None of what the sync reads is worth holding a build
// or `next dev` up for: a source that has not answered in this long is given up on, and
// whoever asked falls back to the copy it kept from last time.
export const requestTimeout = 20_000;

export function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(requestTimeout) });
}
