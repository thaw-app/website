// The numbers the pages quote about the project: stars, downloads, who contributes and from
// where, and what outside bodies have verified. Each keeps its last value when its source
// cannot be reached, and the day it was last read.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { countCountries } from '../countries.mjs';
import { request } from '../request.mjs';
import { cacheFile, githubToken, libFile } from './config.mjs';

/**
 * The people with commits in a repo since a given day, most commits first.
 * GitHub's statistics give each contributor's commits week by week, which is
 * what lets a fork leave out those who only worked on the project it came from.
 * The last answer is kept in .cache, and used when GitHub cannot be reached.
 */
async function contributors({ repo, slug, contributorsSince, notPeople = [] }) {
  const cache = cacheFile(`contributors-${slug}.json`);
  const token = githubToken();
  // Weeks start on Sunday, so the week the day falls in counts from its start.
  const day = new Date(`${contributorsSince}T00:00:00Z`);
  const since = day.getTime() / 1000 - day.getUTCDay() * 86_400;
  try {
    let stats;
    // GitHub answers 202 while it works the numbers out, and has them a moment later.
    for (let attempt = 0; attempt < 5 && !stats; attempt++) {
      const response = await request(`https://api.github.com/repos/${repo}/stats/contributors`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.status === 202) await new Promise((resolve) => setTimeout(resolve, 3000));
      else if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      else stats = await response.json();
    }
    if (!Array.isArray(stats)) throw new Error('GitHub is still counting');
    const people = stats
      .filter(({ author }) => author?.type === 'User' && !notPeople.includes(author.login))
      .map(({ author, weeks }) => ({
        login: author.login,
        avatar: author.avatar_url,
        commits: weeks.filter((week) => week.w >= since).reduce((sum, week) => sum + week.c, 0),
      }))
      .filter((person) => person.commits > 0)
      .sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login));
    mkdirSync(join(cache, '..'), { recursive: true });
    writeFileSync(cache, JSON.stringify(people));
    return people;
  } catch (error) {
    if (existsSync(cache)) {
      console.warn(`${repo}: using the saved contributor list (${error.message}).`);
      return Object.assign(JSON.parse(readFileSync(cache, 'utf8')), { stale: true });
    }
    console.warn(`${repo}: no contributor list (${error.message}).`);
    return [];
  }
}

/**
 * The numbers on the community page, each fetched from where it is counted.
 * One that cannot be fetched keeps its last value, or is left off the page.
 */
/**
 * The translators named in a repo's CREDITS.md, by language. Crowdin has no
 * public list of a project's translators, and that file is the project's own
 * record of them: "- Display Name (username)" under a "### flags Language" heading.
 */
function translators(root) {
  const file = join(root, 'CREDITS.md');
  if (!existsSync(file)) return null;
  const section = readFileSync(file, 'utf8')
    .split(/^## Translators$/m)[1]
    ?.split(/^## /m)[0];
  if (!section) return null;
  return section
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const [heading, ...lines] = block.split('\n');
      const [, flags = '', language = heading] =
        heading.trim().match(/^((?:\p{RI}{2}\s*)+)(.*)$/u) ?? [];
      const people = lines
        .filter((line) => line.startsWith('- '))
        .map((line) => {
          const entry = line.slice(2).trim();
          // "Name (username)", or a username alone.
          const named = entry.match(/^(.*)\s\(([^()\s]+)\)$/);
          if (named) return { name: named[1], username: named[2] };
          // A bare username is its own name; anything with a space in it is not a username.
          return /\s/.test(entry) ? { name: entry } : { name: entry, username: entry };
        });
      return { language: language.trim(), flags: flags.trim(), people };
    })
    .filter((group) => group.people.length);
}

/**
 * Where the repo's stars, issues and pull requests come from, by country, from the location each gives on their GitHub profile (see countries.mjs for
 * how free text becomes a country). It reads every one of them, a hundred to a request,
 * so it needs a token and is done at most once a day; otherwise the last count stands.
 */
async function whereFrom(repo, before, token) {
  const today = new Date().toISOString().slice(0, 10);
  if (!token || before?.checked === today) return before ?? null;
  const [owner, name] = repo.split('/');
  const lists = {
    stargazers: ['stargazers', 'login location'],
    issues: ['issues', 'author { login ... on User { location } }'],
    pulls: ['pullRequests', 'author { login ... on User { location } }'],
  };
  try {
    const world = { checked: today };
    for (const [key, [field, node]] of Object.entries(lists)) {
      // A star is a person. An issue or a pull request is counted each time, for the
      // country of whoever opened it: someone with a hundred pull requests is a hundred.
      const places = [];
      for (let after = null; ; ) {
        const response = await request('https://api.github.com/graphql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${field}(first: 100, after: ${JSON.stringify(after)}) { pageInfo { hasNextPage endCursor } nodes { ${node} } } } }`,
          }),
        });
        if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
        const { data, errors } = await response.json();
        if (errors) throw new Error(errors[0].message);
        const page = data.repository[field];
        for (const entry of page.nodes) {
          const person = entry.author ?? entry;
          if (person?.login) places.push(person.location ?? null);
        }
        if (!page.pageInfo.hasNextPage) break;
        after = page.pageInfo.endCursor;
      }
      world[key] = countCountries(places);
    }
    return world;
  } catch (error) {
    console.warn(`Could not read where people are from (${error.message}).`);
    return before ?? null;
  }
}

/**
 * How often the app itself was fetched from a list of releases: its disk images and
 * archives, and the deltas its updater takes. The checksums, signatures and SBOMs
 * attached beside them are read by tools checking a download, and are not downloads.
 */
function appDownloads(releases) {
  let total = 0;
  for (const release of releases) {
    for (const asset of release.assets ?? []) {
      if (/\.(dmg|zip|pkg|delta)$/i.test(asset.name)) total += asset.download_count;
    }
  }
  return total;
}

/**
 * What was just read, laid over what was known, with the day each was last really read.
 * A source that could not be reached keeps its last value and its last day with it, so
 * the pages can say how old a number is and never date a kept one today.
 */
function settle(fresh, before = {}, beforeDays = {}, today) {
  const values = {};
  const days = {};
  for (const [key, value] of Object.entries(fresh)) {
    const read = value !== null && value !== undefined;
    values[key] = read ? value : before[key];
    days[key] = read ? today : values[key] === undefined ? undefined : beforeDays[key];
  }
  return { values, days };
}

async function communityNumbers(product, published, people, root) {
  const file = libFile('community.json');
  const before = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const token = githubToken();
  const github = token ? { Authorization: `Bearer ${token}` } : {};
  const read = async (url, headers = {}) => {
    try {
      const response = await request(url, { headers });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  const { discordInvite, cask, updatesRepo, team = [], bestPractices } = product.community;
  // Every release of a repo, however many pages that takes.
  const downloadsOf = async (name) => {
    let total = 0;
    for (let page = 1; ; page++) {
      const batch = await read(
        `https://api.github.com/repos/${name}/releases?per_page=100&page=${page}`,
        github,
      );
      if (!Array.isArray(batch)) return null;
      total += appDownloads(batch);
      if (batch.length < 100) return total;
    }
  };
  const [repo, fromReleases, fromUpdates, discord, brew] = await Promise.all([
    read(`https://api.github.com/repos/${product.repo}`, github),
    downloadsOf(product.repo),
    updatesRepo ? downloadsOf(updatesRepo) : 0,
    read(`https://discord.com/api/v9/invites/${discordInvite}?with_counts=true`),
    read(`https://formulae.brew.sh/api/cask/${cask}.json`),
  ]);
  // Only a full count replaces the last one: half of it would read as a drop.
  const downloads =
    fromReleases === null || fromUpdates === null ? null : fromReleases + fromUpdates;
  // Each team member as their GitHub profile shows them; one that cannot be read keeps
  // the last copy, or falls back to the bare login.
  const profiles = await Promise.all(
    team.map(async (login) => {
      const profile = await read(`https://api.github.com/users/${login}`, github);
      const kept = before.team?.find((member) => member.login === login);
      return profile
        ? { login, name: profile.name ?? undefined, avatar: profile.avatar_url }
        : (kept ?? { login, avatar: `https://github.com/${login}.png?size=200` });
    }),
  );
  // What outside bodies say about how the project is run, read from them directly.
  const [practices, scorecard, everyProject, coverage] = await Promise.all([
    bestPractices ? read(`https://www.bestpractices.dev/projects/${bestPractices}.json`) : null,
    read(`https://api.securityscorecards.dev/projects/github.com/${product.repo}`),
    // How many projects hold each badge, to say how common Thaw's are.
    read('https://www.bestpractices.dev/project_stats.json', { Accept: 'application/json' }),
    read(
      `https://sonarcloud.io/api/measures/component?component=${product.repo.replace('/', '_')}&metricKeys=coverage`,
    ),
  ]);
  // The newest day's count: every project on the list, those with Gold, and those that
  // meet every Baseline control at its top level.
  const newest = Array.isArray(everyProject) ? everyProject.at(-1) : null;
  const field = newest?.percent_2_ge_100
    ? {
        projects: newest.percent_ge_0,
        gold: newest.percent_2_ge_100,
        baseline3: newest.percent_baseline_3_ge_100,
      }
    : null;
  const covered = Number(coverage?.component?.measures?.[0]?.value);
  const baseline = practices
    ? [3, 2, 1].find((level) => practices[`badge_percentage_baseline_${level}`] === 100)
    : undefined;
  const today = new Date().toISOString().slice(0, 10);
  // A file from before each number had its own day has one day for all of them.
  const beforeDays = before.readOn ?? {};
  const dayOf = (key) => beforeDays[key] ?? before.checked;
  const counts = settle(
    {
      stars: repo?.stargazers_count,
      downloads: downloads || null,
      homebrewYear: brew?.analytics?.install?.['365d']?.[cask],
      discord: discord?.approximate_member_count,
      // A list from .cache is the last one read, not today's.
      contributors: people.stale ? null : people.length || null,
      releases: published.stale ? null : published.length || null,
    },
    before,
    Object.fromEntries(
      ['stars', 'downloads', 'homebrewYear', 'discord', 'contributors', 'releases'].map((key) => [
        key,
        dayOf(key),
      ]),
    ),
    today,
  );
  const outside = settle(
    {
      bestPractices: practices?.badge_level,
      baseline,
      scorecard: scorecard?.score,
      coverage: Number.isFinite(covered) ? covered : null,
      field,
    },
    before.assurance,
    Object.fromEntries(
      ['bestPractices', 'baseline', 'scorecard', 'coverage', 'field'].map((key) => [
        key,
        dayOf(key),
      ]),
    ),
    today,
  );
  const numbers = {
    ...counts.values,
    // The day each number above and each Verified value below was last read from its source.
    readOn: { ...counts.days, ...outside.days },
    people: people.length ? people : (before.people ?? []),
    team: profiles,
    assurance: outside.values,
    translators: translators(root) ?? before.translators ?? [],
    world: await whereFrom(product.repo, before.world?.checked ? before.world : null, token),
  };
  writeFileSync(file, `${JSON.stringify(numbers, null, 2)}\n`);
}

export { appDownloads, communityNumbers, contributors, settle, translators, whereFrom };
