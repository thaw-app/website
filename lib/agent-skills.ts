import { createHash } from 'node:crypto';
import { installWays } from '@/lib/install';
import { repoUrl, siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

// The skills an AI agent can learn from this site, listed at
// /.well-known/agent-skills/index.json as the Agent Skills Discovery RFC describes
// (github.com/cloudflare/agent-skills-discovery-rfc). Each is a short guide on how to
// help, then the synced docs pages it rests on, in full, so it says what the docs say.

interface Skill {
  name: string;
  description: string;
  title: string;
  guide: string;
  /** The docs pages the skill carries, by their slugs under content/docs. */
  pages: string[][];
}

const commands = installWays
  .map((way) =>
    'command' in way
      ? `- ${way.label}: ${way.about} \`${way.command}\``
      : `- ${way.label}: ${way.note} ${way.href}`,
  )
  .join('\n');

const skills: Skill[] = [
  {
    name: 'install-thaw',
    description:
      'Install Thaw, the free macOS menu bar manager, on the right version for the Mac, and get its permissions granted. Use it when someone asks how to install, update or uninstall Thaw, or which Thaw runs on their macOS.',
    title: 'Installing Thaw',
    guide: `Thaw is a free, open source menu bar manager for macOS (${siteUrl}). Which Thaw to install depends on the macOS:

1. Find out which macOS the Mac runs: Apple menu, then About This Mac, or \`sw_vers -productVersion\` in Terminal.
2. Pick the matching way to install:

${commands}
- macOS 14 or 15: Thaw 1. The versions page below says where to get it.

3. Open Thaw. It asks for Accessibility, which it needs to move menu bar items. On macOS 27 it also asks for Menu Bar Layout Access. Screen Recording is optional.
4. Updates come by themselves. The update channel is in Thaw’s Settings, under About.

Someone who has never opened Terminal can use the disk image from the releases page instead of Homebrew. Run a Terminal command for someone only after they say yes to it.`,
    pages: [
      ['thaw', 'versions'],
      ['thaw', 'getting-started'],
      ['thaw', 'permissions'],
      ['thaw', 'reset-and-uninstall'],
    ],
  },
  {
    name: 'troubleshoot-thaw',
    description:
      'Work out what is wrong when Thaw, the macOS menu bar manager, misbehaves: missing or wandering items, a missing Thaw icon, permission prompts, known macOS 27 limits. Use it when someone says Thaw or a menu bar item is not working.',
    title: 'Troubleshooting Thaw',
    guide: `Thaw is a free, open source menu bar manager for macOS (${siteUrl}). When it misbehaves:

1. Find out which Thaw and which macOS. Thaw’s version is in its Settings, under About. Thaw 3 runs on macOS 27 and Thaw 2 on macOS 26, and their problems are listed separately below.
2. Look for the problem in the frequent issues below. Some are limits of macOS 27 that Thaw can’t get round yet, and need no report.
3. Try the fix the docs give. A reset or a Terminal command, such as \`tccutil\` or removing a cache, changes the person’s setup: say what it does and ask before running it.
4. If nothing here fits, help them open an issue at ${repoUrl('thaw')}/issues with their Thaw and macOS versions, what they did, and what they saw.`,
    pages: [
      ['thaw', 'frequent-issues'],
      ['thaw', 'reset-and-uninstall'],
    ],
  },
  {
    name: 'thaw-url-scheme',
    description:
      'Drive Thaw, the macOS menu bar manager, through thaw:// links: show hidden items, open search or settings, and read or change settings. Use it when someone on a Mac with Thaw asks to show, hide or rearrange their menu bar items.',
    title: 'Driving Thaw with thaw:// links',
    guide: `Thaw is a free, open source menu bar manager for macOS (${siteUrl}). It answers \`thaw://\` links, which you can open with \`open "thaw://…"\` in a shell, or from Shortcuts, Raycast or Alfred.

Before you start:

1. Thaw has to be installed and running. If it isn’t, point the person to ${siteUrl} to install it.
2. Actions such as \`thaw://toggle-hidden\` and \`thaw://search\` work with no setup.
3. Reading and changing settings is off until the person turns on the Settings URI in Thaw’s Settings, under Automation, and approves the app sending the links. Ask them to do this, and never try to get round it.`,
    pages: [['thaw', 'uri-schemes']],
  },
];

export const skillNames = skills.map((skill) => skill.name);

/** A skill as a SKILL.md: what it is for and how to help, then its docs pages in full. */
export async function skillMarkdown(name: string) {
  const skill = skills.find((entry) => entry.name === name);
  if (!skill) return undefined;
  const pages = await Promise.all(
    skill.pages.map(async (slugs) => {
      const page = source.getPage(slugs);
      if (!page) throw new Error(`${slugs.join('/')} was not synced; run scripts/sync-docs.mjs.`);
      return `## ${page.data.title}\n\nFrom ${siteUrl}${page.url}\n\n${await page.data.getText('processed')}`;
    }),
  );
  return `---
name: ${skill.name}
description: ${JSON.stringify(skill.description)}
---

# ${skill.title}

${skill.guide}

What follows is Thaw’s own documentation.

${pages.join('\n\n')}
`;
}

/** The discovery index: each skill with where it is and the SHA-256 of what is there. */
export async function skillsIndex() {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: await Promise.all(
      skills.map(async ({ name, description }) => ({
        name,
        type: 'skill-md',
        description,
        url: `${siteUrl}/.well-known/agent-skills/${name}/SKILL.md`,
        digest: `sha256:${createHash('sha256')
          .update((await skillMarkdown(name)) ?? '')
          .digest('hex')}`,
      })),
    ),
  };
}
