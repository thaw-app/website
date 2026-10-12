// Vercel's ignored build step (vercel.json). It runs before a deploy, and its exit status
// decides: 0 skips the build, anything else lets it run. A commit that changes nothing the
// site is built from has no reason to deploy.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/** Paths the site is not built from: workflows, Dependabot's config, issue templates. */
const notTheSite = [/^\.github\//];

/**
 * Whether a deploy can be skipped. `files` are the paths the commit changed, or null when
 * that could not be worked out, in which case the build runs.
 */
export function canSkip({ branch, files }) {
  // CI builds the site and runs the end-to-end tests on Dependabot's pull requests already.
  if (branch?.startsWith('dependabot/')) return true;
  if (!files || files.length === 0) return false;
  return files.every((file) => notTheSite.some((pattern) => pattern.test(file)));
}

/** The paths changed since the last deploy, or null when git cannot say. */
function changedFiles(previous) {
  if (!previous) return null;
  try {
    const out = execFileSync(
      'git',
      ['-c', 'core.quotePath=false', 'diff', '--name-only', previous, 'HEAD'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return out.split('\n').filter(Boolean);
  } catch {
    // The clone is shallow, so the last deployed commit is not always in it.
    return null;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const skip = canSkip({
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    files: changedFiles(process.env.VERCEL_GIT_PREVIOUS_SHA),
  });
  console.log(skip ? 'Nothing the site is built from changed; skipping.' : 'Building.');
  process.exit(skip ? 0 : 1);
}
