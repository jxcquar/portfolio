# Jacqueline Tenges — Portfolio

Static site (plain HTML/CSS/JS, **no build step, no dependencies**) for Jacqueline Tenges,
Senior Product Designer. Live at **https://jxcquar.github.io/portfolio/** via GitHub Pages
(repo `jxcquar/portfolio`, branch `main`, root). Pushing to `main` redeploys in ~1 minute.

Design source of truth: Figma files
- "folio '26 (Copy)" — `nFe2M3o0HuhkZcXnBJWFkG` (most pages)
- "folio '26" — `laPOdKOu37t23LaGuEX0m5` (newer work-page design)
Case-study copy source: the owner's Google Doc (ID `1XTZ0HUMd0bMsZ_PEj1d78FpmyWCy1QlJ`);
fetchable via `https://docs.google.com/document/d/<ID>/export?format=txt`.

## Run locally

```bash
python3 -m http.server 4173
```
(A `.claude/launch.json` entry named `portfolio` exists for the browser-preview tool.)

## Pages

- `index.html` — hero that crossfades into the work grid on scroll (JS-driven parallax:
  bg blur/opacity, nav pill glides bottom→top, "Work" underlines past 65% progress).
  Clicking About plays a sky-veil exit transition. Arriving at `index.html#work` skips
  the intro (`body.no-intro`).
- `case-fabra.html` — the flagship case study: a fixed-viewport "book" pager on desktop
  (arrows, dots, yellow sticky-note section nav, page-flip leaf with two-sided content
  preview), and an Apple-Books-style scrolling reader on mobile (≤900px: white page,
  light nav, Contents pill with progress % and a TOC sheet).
- `case-freelancer.html`, `case-fitfocus.html` — same machinery with scaffold copy
  (prompts describing what to write); awaiting real case studies.
- `about.html` — pannable canvas "world" (drag/wheel with fling momentum), pulsing
  pointers opening glass bubbles; on mobile bubbles re-parent to <body> as fixed
  popovers (position:fixed is defeated inside the transformed world).
- `contact.html` — hero with Email/LinkedIn/YouTube pills.

## Key systems & gotchas (js/main.js, css/style.css)

- **Book pagination** (desktop case pages): content flows continuously like a real
  book. `paginateBook()` in main.js flattens sections into blocks, fills fixed-height
  pages, starts each chapter on the next fresh page, and adds "· continued" eyebrows
  on spreads that begin mid-section. It runs after fonts are force-loaded
  (`document.fonts.load(...)` — `fonts.ready` alone resolves too early) and returns a
  section→slide map used by nav/hash/dots. **Flow pages have fixed 50% width**
  (`.book-page--flow`) — a lone page would otherwise stretch full-width and
  under-measure (the historic overflow bug). Pages are hard-capped
  (`height:100%; overflow:hidden`; stage has `contain:paint`), so worst case clips,
  never spills. Major window resizes reload to repaginate.
- **Cache-busting**: every HTML file references `css/style.css?v=N` and
  `js/main.js?v=N`. **Bump N in all six HTML files whenever CSS/JS change** — the
  owner's browsers cache aggressively and stale mixes have caused ghost bugs.
- **iOS quirks already handled** (don't regress): nav glass lives on `.pill-nav::before`
  (backdrop-filter directly on a fixed element breaks position:fixed on iOS);
  About page body is `position:fixed` (an overflowing world otherwise makes iOS zoom
  the layout out); hover styles are wrapped in `@media (hover:hover)`.
- **Work cards**: frosted glass is a per-card blurred moss layer (`::before`), NOT
  backdrop-filter (adjacent live backdrops smear each other in Chromium on hover).
  901–1340px turns the grid into a horizontal snap carousel; ≤900px a taller one.
- Case pages use the light "collage" theme (`body.case-light`, `assets/collage.jpg`
  exported from Figma with book/nav/TOC layers hidden).

## Verification notes

The embedded browser pane and headless `--screenshot` both fail to repaint after
programmatic scrolls, and the pane sometimes reports `innerWidth: 0` when hidden —
blank/black captures there are usually tooling artifacts, not site bugs. Trust DOM
measurements (dump-dom with an injected measuring script) or fresh renders at the top
of a page.

## Open TODOs

- LinkedIn/YouTube URLs are placeholders (`linkedin.com/in/jacquelinetenges`,
  `youtube.com/@jacquelinetenges`) in about.html + contact.html + case-fabra.html.
- Case-study `[Image]` slots (`.img-slot`) await real screenshots.
- Freelancer.com and FitFocus case studies await real copy.
