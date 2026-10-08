// What the roadmap page shows beside its own text: whether each issue it links is open, and
// the feature requests people have asked for.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { request } from '../request.mjs';
import { contentDir, githubToken, libFile } from './config.mjs';

/**
 * Whether each issue the roadmap links to is open or closed, so the page can
 * say so beside the link. One that cannot be read keeps what was known before.
 */
async function roadmapIssues(product) {
  const page = join(contentDir, '..', 'site', 'roadmap.mdx');
  const file = libFile('roadmap-issues.json');
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const numbers = existsSync(page)
    ? [
        ...new Set(
          [...readFileSync(page, 'utf8').matchAll(/<Issue n=\{(\d+)\}/g)].map((hit) => hit[1]),
        ),
      ]
    : [];
  const token = githubToken();
  const states = {};
  await Promise.all(
    numbers.map(async (number) => {
      try {
        const response = await request(
          `https://api.github.com/repos/${product.repo}/issues/${number}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!response.ok) throw new Error(String(response.status));
        const issue = await response.json();
        states[number] = { state: issue.state, reason: issue.state_reason ?? null };
      } catch {
        if (before[number]) states[number] = before[number];
      }
    }),
  );
  writeFileSync(file, `${JSON.stringify(states, null, 2)}\n`);
}

/**
 * The feature requests open in the project's repository, most thumbs-up first, for the
 * roadmap's "Asked for". GitHub's issue type tells a request from a bug. If they cannot be
 * read, the last list stays.
 */
async function roadmapRequests(product) {
  const file = libFile('roadmap-requests.json');
  const token = githubToken();
  const query = new URLSearchParams({
    q: `repo:${product.repo} is:issue is:open type:Feature`,
    sort: 'reactions-+1',
    order: 'desc',
    per_page: '12',
  });
  try {
    const response = await request(`https://api.github.com/search/issues?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error(String(response.status));
    const found = (await response.json()).items
      // A request about how the project is run is not one for the app.
      .filter((issue) => !issue.labels.some((label) => label.name === 'ops'))
      .map((issue) => ({
        number: issue.number,
        // The issue form puts what kind of issue it is in front of every title.
        title: issue.title.replace(/^\s*\[[^\]]*\]\s*/, '').trim(),
        votes: issue.reactions?.['+1'] ?? 0,
      }));
    writeFileSync(file, `${JSON.stringify(found, null, 2)}\n`);
  } catch (error) {
    console.warn(`  could not read ${product.repo}'s feature requests (${error.message})`);
    if (!existsSync(file)) writeFileSync(file, '[]\n');
  }
}

export { roadmapIssues, roadmapRequests };
