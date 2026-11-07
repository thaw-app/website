'use client';

import { type ReactNode, useState } from 'react';
import { channelGroup, channelKey, channels } from '@/lib/channels';
import { macosVersions } from '@/lib/macos';
import { Choice } from './choice';

/**
 * Buttons that narrow the changelog: to one macOS, and to one channel, such as the stable
 * releases most people install or the betas. The entries are drawn on the server, each
 * marked with its macOS and its channel, and this hides the ones that do not match.
 */
export function ReleaseFilter({
  systems,
  entries,
  children,
}: {
  /** The macOS versions any release runs on, newest first. */
  systems: number[];
  /** What each entry is, in the order drawn: enough to know when a choice leaves none. */
  entries: { os?: string; channel: string }[];
  children: ReactNode;
}) {
  const [system, setSystem] = useState<string | null>(null);
  const [chosen, setChannel] = useState<string | null>(null);
  const onSystem = (entry: { os?: string }) =>
    !system || macosVersions(entry.os).includes(Number(system));
  // Only the channels a release is on for the macOS chosen are offered: not every macOS has
  // had an alpha. A channel chosen before the macOS changed is let go when that macOS has none.
  const present = channels.filter((name) =>
    entries.some((entry) => onSystem(entry) && channelGroup(entry.channel) === name),
  );
  const channel = chosen && present.includes(chosen) ? chosen : null;
  const left = entries.filter(
    (entry) => onSystem(entry) && (!channel || channelGroup(entry.channel) === channel),
  ).length;
  const hidden = [
    // An entry carries its versions as a list ("15 26"), and shows under each of them.
    system && `.release-entry:not([data-os~="${system}"])`,
    channel && `.release-entry:not([data-channel="${channelKey(channel)}"])`,
  ].filter(Boolean);

  return (
    <>
      {(systems.length > 1 || present.length > 1) && (
        <div className="not-prose mb-10 flex flex-wrap gap-x-8 gap-y-3">
          {systems.length > 1 && (
            <Choice
              legend="Show releases for"
              options={[
                { id: null, label: 'Every macOS' },
                ...systems.map((version) => ({
                  id: String(version) as string | null,
                  label: `macOS ${version}`,
                })),
              ]}
              value={system}
              onChange={setSystem}
            />
          )}
          {present.length > 1 && (
            <Choice
              legend="Which releases to show"
              options={[
                { id: null, label: 'Every release' },
                ...present.map((name) => ({ id: name as string | null, label: name })),
              ]}
              value={channel}
              onChange={setChannel}
            />
          )}
        </div>
      )}
      {hidden.length > 0 && <style>{`${hidden.join(', ')} { display: none; }`}</style>}
      {left === 0 ? (
        <p className="not-prose border-t py-10 text-fd-muted-foreground">
          No {channel ? `${channel.toLowerCase()} ` : ''}release
          {system ? ` for macOS ${system}` : ''} yet. The others are under “Every release”.
        </p>
      ) : (
        children
      )}
    </>
  );
}
