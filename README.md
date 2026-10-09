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
| `/changelog` | Every release of Thaw, with what each lists as new and fixed; a release is at `/changelog/<tag>`, and Floe's are under `/changelog/floe` |
| `/docs/thaw` | Thaw documentation |
| `/docs/floe` | Floe documentation |

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

The changelog is the site's own page, not part of the docs. Its pages are written
by the sync into `content/docs/<product>/changelog`, beside the docs, and served
under `/changelog` (`app/(home)/changelog`); the old docs addresses redirect.

Each release gets its own page, filed under its version number: `2.0.0` holds
the final release and, folded under it, the betas and release candidates that
led to it.

The notes come from `CHANGELOG.md` in the app repo, which lists every release.
Its sections are named `New`, `Changed`, `Fixed` and `Known issues`; the page sets
each name beside its list, and counts the items under New and Fixed for the
numbers at its top. The file's layout is otherwise not touched, since the release
workflows read it.

The changelog page writes out the newest three releases. Each older one is a line
that fetches its notes from that release's own page when opened
(`components/release-row.tsx`), so the page does not carry seventy sets of notes.

The repo's GitHub Releases give each release its link to the downloads, a date
where the file leaves one out, and the notes of any release the file does not
have yet.

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

## How it is put together

- `lib/project.json` says what each product is called, where its repo is, and
  the project's ids with outside services. The site and the sync scripts both
  read it, so a product or an address is written once.
- `lib/shared.ts` builds the site's list of products and outside links from
  it. A link that leaves the site belongs there, not in a component.
- `lib/site-pages.ts` holds each site page's name and headline, read by the
  page and by its picture for shared links.
- `lib/format.mjs` has the two small helpers the pages and the scripts both
  need: a name as an address, and a date as a person reads it.
- `scripts/sync-docs.mjs` fetches the repos and writes the pages. Its work is
  in `scripts/sync/`: `config` (what is read and written), `text` (the
  parsers, tested in `sync-docs.test.mjs`), `changelog`, `numbers` and
  `roadmap`.
- The one accent colour is `--product-tone` in `app/global.css`: Thaw's orange, and
  Floe's blue under Floe's docs. It marks what is current or the thing to look at (the
  roadmap's "Now", the page you are on in the docs, a stable release). The changelog's
  calendar uses the cube's three oranges, `--release-1` to `--release-3`.
- A note set apart in a doc (GitHub's `> [!NOTE]`, or `<Callout>`) is drawn by
  `components/callout.tsx`: a rule, its name at the left, its text beside it.
- On a page, a section is `<Section label="…">` and a ruled grid is
  `className="crossed"` plus its columns (`components/section-label.tsx`,
  `app/global.css`).

## Security headers

`next.config.mjs` sends a content security policy and five other headers with
every response. The policy lets a page load scripts, styles, fonts and data
from this site only, and pictures from any https address (the docs embed
them from GitHub). Scripts and styles written into the page are allowed,
because the pages are built once and served as files; a stricter policy would
need every page rendered on each request.

If something new stops loading, the browser's console names the rule that
refused it. A new outside source goes in that one list, with why.

## What loads later

Three things are kept off a page's first load, since most visits never need them at once:

- The search box and its code, fetched when it is first opened or a search button is
  pointed at (`components/providers.tsx`).
- The moving wordmark and the conure at the foot of the page, fetched when the footer is
  within a screen and a half (`components/footer-art.tsx`).
- The code font and the badge's serif, which are not preloaded (`app/layout.tsx`,
  `app/(home)/page.tsx`).

On a touch device the home page's cube redraws twelve times a second.

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
