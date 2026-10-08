# antislop audit 001, follow-up, 2026-10-06

The owner asked for every finding in audit 001 to be fixed. What was done:

| # | Finding | Outcome |
|---|---|---|
| 1 | Controls in the mock that do nothing | Fixed. Back and Forward now walk the panes visited. Every other control without a behaviour (pane buttons, pop-ups with no option list, menu rows, the sidebar and search controls, four General switches) answers with a line on the desktop: "… is not part of this demo." |
| 2 | Mock unusable on a phone | Fixed. Below 640 px the desktop is shown but not operable, and the text above it says to open the page on a Mac. |
| 3 | Dragging has no keyboard path | Fixed. In the Layout pane the arrow keys move the focused item along its section or to another one. Menu bar items other than Thaw's own are not controls, so they take no focus. |
| 4 | Contrast not measured | Measured. Light-mode muted text was 4.35:1 and is now 4.96:1. In the mock, faint text in the light window was 3.95:1 and is raised to clear 4.5:1, and the selected sidebar row's text is dark on yellow (12:1) where the capture has white (1.65:1). Everything else measured passes. |
| 5 | No written direction | Fixed. `DESIGN.md` transcribes the owner's instructions. The dials in it are a proposal awaiting the owner's confirmation. |
| 6 | Uppercase monospace labels | Fixed. Headings, tabs, buttons, the licence line and the footer are Innovator Grotesk in sentence case. Monospace is left for the install command. |
| 7 | Arrows on most links | Fixed. The only arrows left mark the two footer links that leave the site. |
| 8 | One icon library throughout | Reduced. The home page's own content has no library icons now, and the docs cards lost theirs. Two places keep them, each for a function: the site header (search, theme switch) and the docs sidebar, where they help find a page. |
| 9 | Nine identical feature cells | Fixed. The two features that are the product lead in larger type; the rest are a plain list. |
| 10 | Numbers on the features | Fixed. Removed. |
| 11 | Purple in the wallpaper | Fixed. Orange into blue only. |
| 12 | The cube animates forever | Fixed. It moves for six seconds after load and while the pointer is over it, then rests. |
| 13 | Structure is Better Auth's | Recorded in `DESIGN.md` as the owner's choice. No change. |
| 14 | Docs are stock Fumadocs | Partly fixed. True black, square corners and the site's type now apply to the docs. Their layout is still Fumadocs'. |
| 15 | Three radius languages | Fixed. The site's own chrome is square throughout; the mock keeps macOS's corners. |
| 16 | Two spellings of the Claude programme | Decided. The badge keeps "Claude Open Source Program", the wording on the maintainers' READMEs. |

Known departures from the real app, made for accessibility: finding 4's two
colour changes inside the mock.
