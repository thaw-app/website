# website

The website for Thaw and Floe: a home page and the documentation for both, on
one domain. Built with [Fumadocs](https://fumadocs.dev) on Next.js.

| Path | What it is |
|---|---|
| `/` | Home page: install, features, what has been verified, and Thaw rebuilt in the browser to try |
| `/community` | The project in numbers, where its people are, the team, contributors and translators |
| `/verified` | What each security badge on the home page means, and who vouches for it |
| `/built-with` | The stack, the services, the licences and every package, with thanks |
| `/roadmap` | What is being worked on, what is next and what has shipped; written in `content/site/roadmap.mdx` |
| `/docs/thaw` | Thaw documentation and changelog |
| `/docs/floe` | Floe documentation and changelog |

## Where the content lives

The docs are written in the app repos, next to the code they describe.
`scripts/sync-docs.mjs` copies them into `content/docs/<product>` before every
build, so those `.md` files are not committed here.

| Product | Repo | Files synced |
|---|---|---|
| Thaw | `thaw-app/Thaw` | `docs/*.md`, `CHANGELOG.md`, `FREQUENT_ISSUES.md` |
| Floe | `thaw-app/Floe` | `docs/*.md`, `CHANGELOG.md` |

**To change a synced page, open a pull request in the app repo.** The site
picks it up on its next build.

Two files per product are written here and committed: `index.mdx` (the landing
page) and `meta.json` (sidebar order). A page with no home in an app repo can
be added beside them as `.mdx`.

## Shared pages

The picker at the top of the sidebar switches between Thaw's docs and Floe's.
Some pages are the same on both sides: how to contribute, the Code of
Conduct, translations, how these docs work and the security policy. Each
product's docs carry a copy, so the sidebar and the picker stay where the
reader is.

- The policies come from `thaw-app/.github`, like any other synced page.
- The rest are written here, in `content/shared`. Edit them there; the sync
  copies them into `content/docs/<product>`, which git ignores.

Search engines are pointed at Thaw's copy of each shared page.

## The changelog

Each release gets its own page, filed under its version number: `2.0.0` holds
the final release and, folded under it, the betas and release candidates that
led to it.

The notes come from two places, merged by the sync script:

- `CHANGELOG.md` in the app repo, for every release it lists. Its format is
  not touched, since the release workflows read it.
- The repo's GitHub Releases, for releases older than the changelog file and
  for any date the file leaves out.

The list of releases is one unauthenticated call to GitHub's API. Set
`GITHUB_TOKEN` in Vercel to keep it clear of the shared rate limit. If the
call fails, the last list saved in `.cache/` is used, and without one the
changelog file alone.

## Numbers and lists read at build time

Besides the docs, the sync fetches what the pages state as fact, so none of it
is typed in by hand. Each is saved under `lib/` and committed, and one that
cannot be read keeps its last value, so a source being down never breaks a
build or blanks a number.

| File | What | From |
|---|---|---|
| `lib/community.json` | Stars, downloads, contributors, translators, the Verified values | GitHub, Homebrew, Discord, OpenSSF, SonarQube Cloud, `CREDITS.md` |
| `lib/community.json` (`world`) | Stars, issues and pull requests by country | Every stargazer's and author's GitHub profile location |
| `lib/roadmap-issues.json` | Whether each issue the roadmap links is open | GitHub |
| `lib/roadmap-requests.json` | The open feature requests, most thumbs-up first | GitHub |
| `lib/built-with.json` | Every package and its licence | The three projects' manifests, GitHub, npm, crates.io |

These are optional, and the pages are not. `bun run sync` does both, pages first, and
is what a build runs. `bun run sync:content` fetches the pages alone, and is what
`bun run dev` and CI run, so neither waits on a source it does not need. No request
is waited on for more than twenty seconds.

`lib/community.json` keeps the day each number was last read from its source
(`readOn`). A number kept from an earlier run keeps its day, and the pages say so
beside it. Downloads count the app's disk images, archives and update deltas, not
the checksums, signatures and SBOMs attached to a release; they are fetches, not
people.

`GITHUB_TOKEN` matters for two of these. Without it the country counts are
not refreshed at all (they take about 130 requests, and run at most once a
day), and the package licences are limited to sixty lookups an hour.

How a free-text location becomes a country is in `scripts/countries.mjs`: a
country's name, a US state, or a town on its list. Add a town there when a
common one is going uncounted.

Three files are made by hand-run scripts and committed, not built each time:

- `assets/desktop-still.png`, the picture of the demo a phone is shown in its place,
  by `node scripts/capture-demo.mjs` against a running site. Take it again when the
  demo changes.
- `lib/world-map.json`, the dotted map, by `node scripts/build-world-map.mjs`
  from the outline in `scripts/data/`.
- `components/desktop/thaw-panes.json`, Thaw's settings panes in the demo, by
  `node reference/build-panes.cjs` from captures of the running app. Those
  captures hold the capturing Mac's own details and are not in the repo
  (`reference/` is ignored), so only someone with their own captures can
  regenerate it.

## Running it

    bun install
    bun run dev      # syncs the docs, then serves http://localhost:3000

By default the sync fetches each repo's default branch from GitHub
(`development` for Thaw, `main` for Floe). To
preview docs you have not pushed, point it at a local checkout in `.env.local`:

    THAW_DOCS_DIR=/path/to/Thaw
    FLOE_DOCS_DIR=/path/to/Floe

`THAW_DOCS_REF` and `FLOE_DOCS_REF` pick another branch or tag to fetch.

To test it:

    bun run test       # the parsers, the counts and the Verified values
    bun run build      # then, against the built site:
    bun run test:e2e   # install tabs, search, navigation, the demo on a phone

The browser tests need Chromium once: `bunx playwright install chromium`. CI runs
all of it, with a production build, on every push.

## Fonts

Text is set in Schibsted Grotesk and code in Fragment Mono. Both are under the SIL Open
Font License. `next/font` fetches them when the site is built and serves them
from the site itself, so no visitor's browser calls Google.

The pictures a shared link shows (`lib/og.tsx`) are drawn at build time and
cannot use those, so two static weights of Schibsted Grotesk are kept in
`assets/fonts/` with their licence.

## Adding a page

- **A new doc in an app repo:** add the `.md` file under `docs/` there. It
  appears at the bottom of the sidebar; list its slug in
  `content/docs/<product>/meta.json` to place it.
- **A file outside `docs/`:** add it to that product's `extraPages` in
  `scripts/sync-docs.mjs`.
- **A third product:** add an entry to `products` in both
  `scripts/sync-docs.mjs` and `lib/shared.ts`, and a folder with `index.mdx`
  and `meta.json` under `content/docs`.

## Deploying

Import the repo in Vercel. It detects Next.js and Bun, and `bun run build`
runs the sync first. Set `SITE_URL` if the production domain differs from the
one Vercel assigns.

Set `GITHUB_TOKEN` as well: see the section on what is read at build time.

A docs change in an app repo does not rebuild the site by itself. Trigger a
redeploy, or add a Vercel deploy hook to the app repos' release workflows.
