import { skillCatalog } from '@/lib/agent-skills';
import { siteUrl } from '@/lib/shared';

// Everything the site offers AI agents, in one catalog (Agentic Resource Discovery, in
// the AI Catalog format: ai-catalog.io): the search API and the Agent Skills. Served at
// /.well-known/ard.json, and at /.well-known/ai-catalog.json, the name it had first.

const host = new URL(siteUrl).hostname.replace(/^www\./, '');

// What someone would ask for each skill: a catalog's search is built from these.
const askedFor: Record<string, string[]> = {
  'install-thaw': ['install Thaw on a Mac', 'which Thaw for my macOS version'],
  'troubleshoot-thaw': ['Thaw is not working', 'menu bar items are missing or moving'],
  'thaw-url-scheme': ['control Thaw with thaw:// links', 'automate the menu bar with Thaw'],
};

export function aiCatalog() {
  return {
    specVersion: '1.0',
    host: { displayName: 'Thaw', identifier: `did:web:${host}` },
    entries: [
      {
        identifier: `urn:air:${host}:api:search`,
        displayName: 'Thaw site search',
        description: 'Search the docs and release notes of Thaw and Floe. Read-only, no key.',
        type: 'application/vnd.oai.openapi+json',
        url: `${siteUrl}/openapi.json`,
        representativeQueries: ['search the Thaw docs', 'Thaw and Floe release notes'],
      },
      ...skillCatalog().map((skill) => ({
        identifier: `urn:air:${host}:skill:${skill.name}`,
        displayName: skill.title,
        description: skill.description,
        type: 'text/markdown; profile="urn:air:agent-skills"',
        url: `${siteUrl}/.well-known/agent-skills/${skill.name}/SKILL.md`,
        representativeQueries: askedFor[skill.name],
      })),
    ],
  };
}
