# Design direction

Transcribed from the project owner's instructions while the site was built
(October 2026). The owner is the author; edit this file to change the
direction. The audits made against it are kept locally in `anti-slop/`, which
is not committed.

## What the site is

The home of Thaw, the open source menu bar manager for macOS, with Floe, the
launcher, as a second product. One domain: a home page, and docs for both.

## Identity

- **The cube.** Thaw's icon is an ice cube. On the home page it is drawn in
  text characters, in the logo's own colours, and it is the page's one
  showpiece.
- **Colour.** Thaw is the orange of its icon, Floe the blue of its own. Those
  two, on neutral ground. No other hues. One exception, at the owner's
  request: the bars under the Verified values are the gold and green of the
  badges they stand for.
- **Dark mode is true black**, with barely visible rules. Light mode is the
  alternative, and both must work.
- **Type.** Innovator Grotesk for text and headings. Geist Mono for commands
  and code only. No uppercase monospace labels.
- **Corners.** Square on the site's own pages.

## Signature

Two things carry the identity, and the rest stays quiet around them.

- **Type as picture.** The cube drawn in characters on the home page, and at
  the foot of every page "thaw & floe" drawn the same way, each name in its
  product's colour, where a conure comes by. It is the owner's own bird, drawn from photographs,
  and it has things to do: it sidles along a letter, eats pieces out of the
  ampersand, climbs down it, looks at a pointer that comes near, and bobs its
  head at whoever is watching before it goes.
- **The header is a menu bar that Thaw manages.** Its icons (Raycast, Droppy,
  GitHub) sit before Thaw's dot, and clicking the dot hides them and brings
  them back, the way the app does on a Mac.

Display type is Innovator Grotesk pulled tight (the larger, the tighter).
A section is named by a small quiet label with its rule running on from it to
the edge, the same on every page. Ruled grids carry a small plus where their
lines cross.

Every page but the home page and the docs shares one frame and one width.

## Structure

- The home page follows Better Auth's shape, at the owner's request: a fixed
  left column that says what Thaw is, and a right column that is Thaw's real
  README, synced from its repository without the badges and the screenshots
  (the owner finds those old). This is a chosen reference, not an accident.
- "Try it" is the mock desktop, under the home page at its full width: Thaw
  rebuilt in the browser so people can use it before downloading.
- The changelog is a timeline after Cossistant's: number and date on the left,
  notes on the right, under a calendar of releases. The roadmap is a board
  after ArkEnv's: up next by area, shipped by release, each with a count. It is a
  page of its own at /roadmap, beside Community and Built with, not a docs page:
  it is about the project, and it is written here.
- The docs have a user side and a developers side, the latter modelled on
  Zen Browser's.

- Under the README, "Verified" shows what outside bodies say about how Thaw is
  built (SLSA, OpenSSF, test coverage) as cells with the value large and a bar
  for how far up its scale it sits. Every value is read from its source when
  the site is built, and the page says when.
- In light mode the cube is drawn solid, in the logo's oranges: faint
  characters on a light page read as white.

- Features are a sheet to read down: ten numbered cells of one size, then
  everything else by name under what it is for. No pictures of the app there;
  the demo is where it is shown.
- The site's search is drawn as Floe's launcher, round corners included: the
  one place outside the demo that is not square, because it is Floe's panel.
- The community page shows where the project's stars, issues and pull requests
  come from on a dotted map of the world, as shares and not counts. People are
  listed without numbers beside them: one commit can be a whole feature.

- "Built with" is a page of its own: the languages, frameworks and runtimes each once
  with who uses them, the services the project runs on, the licences, the thanks, and
  every package. Tools that only check the code stay in the package lists.
- The footer is a map of the site in three columns, after Vercel's, at the owner's
  request. Every link in it is real.

## The mock desktop

- It should look like macOS and like the real Thaw, one to one: rebuilt from
  captures and measurements of the running app, not drawn from memory.
- It is a recreation, not a set of pictures. Controls work, or say plainly
  that they are not part of the demo.
- The notch opens the way Droppy's does, as a nod to a partner.
- Thaw's settings window is captured from the running app. Floe's launcher and
  settings window are written from Floe's source, to its measurements and with
  its own wording, and what Floe's Appearance page sets is what its launcher on
  the desktop wears.

## Voice

Plain. Say what the thing does. No slogans, no invented numbers, no
testimonials. Nothing that reads as generated.

## Partners and programmes

Raycast and Droppy are shown by their own menu bar glyphs. The Vercel OSS
Program and the Claude Open Source Program are credited beside the headline.

## Dials

ENERGY 2 / RHYTHM 2 / MOTION 2. Proposed by the assistant from the above; the
owner has not confirmed them.
