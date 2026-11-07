// What the roadmap page shows beside its own text: whether each issue it links is open, and
// the feature requests people have asked for.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { request } from '../request.mjs';
import { contentDir, githubHeaders, libFile } from './config.mjs';

/**
 * Whether each issue the roadmap links to is open or closed, so the page can
 * say so beside the link. One that cannot be read keeps what was known before.
 */
async function roadmapIssues(product) {
  const page = join(contentDir, '..', 'site', product.roadmap.page);
  const file = libFile(product.roadmap.issues);
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const numbers = existsSync(page)
    ? [
        ...new Set(
          [...readFileSync(page, 'utf8').matchAll(/<Issue n=\{(\d+)\}/g)].map((hit) => hit[1]),
        ),
      ]
    : [];
  const states = {};
  await Promise.all(
    numbers.map(async (number) => {
      try {
        const response = await request(
          `https://api.github.com/repos/${product.repo}/issues/${number}`,
          { headers: githubHeaders() },
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
 * roadmap's "Asked for". A request is told from a bug by GitHub's issue type, or, where an
 * issue has no type set, by the "[Feature Request]" the issue form puts before its title.
 * If they cannot be read, the last list stays.
 */
async function roadmapRequests(product) {
  const file = libFile(product.roadmap.requests);
  const search = async (filter) => {
    const query = new URLSearchParams({
      q: `repo:${product.repo} is:issue is:open ${filter}`,
      sort: 'reactions-+1',
      order: 'desc',
      per_page: '12',
    });
    const response = await request(`https://api.github.com/search/issues?${query}`, {
      headers: githubHeaders(),
    });
    if (!response.ok) throw new Error(String(response.status));
    return (await response.json()).items;
  };
  try {
    const [typed, titled] = await Promise.all([
      search('type:Feature'),
      search('in:title "Feature Request"'),
    ]);
    const seen = new Set();
    const found = [...typed, ...titled]
      .filter((issue) => !seen.has(issue.number) && seen.add(issue.number))
      // A request about how the project is run is not one for the app.
      .filter((issue) => !issue.labels.some((label) => label.name === 'ops'))
      .map((issue) => ({
        number: issue.number,
        // The issue form puts what kind of issue it is in front of every title.
        title: issue.title.replace(/^\s*\[[^\]]*\]\s*/, '').trim(),
        votes: issue.reactions?.['+1'] ?? 0,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 12);
    writeFileSync(file, `${JSON.stringify(found, null, 2)}\n`);
  } catch (error) {
    console.warn(`  could not read ${product.repo}'s feature requests (${error.message})`);
    if (!existsSync(file)) writeFileSync(file, '[]\n');
  }
}

export { roadmapIssues, roadmapRequests };
