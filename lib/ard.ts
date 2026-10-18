import { skillCatalog } from '@/lib/agent-skills';
import { siteUrl } from '@/lib/shared';

// Everything the site offers AI agents, in one catalog (Agentic Resource Discovery, in
// the AI Catalog format: ai-catalog.io): the search API and the Agent Skills. Served at
// /.well-known/ard.json, and at /.well-known/ai-catalog.json, the name it had first.

const host = new URL(siteUrl).hostname.replace(/^www\./, '');

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
      },
      ...skillCatalog().map((skill) => ({
        identifier: `urn:air:${host}:skill:${skill.name}`,
        displayName: skill.title,
        description: skill.description,
        type: 'text/markdown',
        url: `${siteUrl}/.well-known/agent-skills/${skill.name}/SKILL.md`,
      })),
    ],
  };
}
