# Jacqueline Tenges — Portfolio

Static site (plain HTML/CSS/JS, **no build step, no dependencies**) for Jacqueline Tenges,
Senior Product Designer. Live at **https://jxcquar.github.io/portfolio/** via GitHub Pages
(repo `jxcquar/portfolio`, branch `main`, root). Pushing to `main` redeploys in ~1 minute.

**The owner edits directly on GitHub (pencil icon) and uploads assets via the web UI.
Always `git pull --rebase` before pushing** — her commits land between yours.

Design source of truth: Figma files
- "folio '26 (Copy)" — `nFe2M3o0HuhkZcXnBJWFkG` (most pages)
- "folio '26" — `laPOdKOu37t23LaGuEX0m5` (newer work page + About canvas layout)
Case-study copy source: the owner's Google Docs; fetchable via
`https://docs.google.com/document/d/<ID>/export?format=txt`.

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
  light nav, Contents pill with progress % and a TOC sheet). Real copy + media.
- `case-zookal.html` — full case study (Zookal Exam Prep), same machinery. Light
  "dotted paper" collage theme (`body.case-light case-paper`) matching Figma node
  2068-407 in "folio '26 (Copy)": the dot grid is a repeating CSS tile
  (`assets/zookal-dots.png`) and each 3D prop/doodle is its own edge-anchored
  `.zk-deco` img (real Figma exports) so nothing crops off at odd window aspects;
  dashed-border paper TOC; overview spread = blank left page + intro right (serif title,
  `assets/zookal-wordmark.svg`, mission copy, SOLO-DESIGNER meta).
- `case-freelancer.html` — full case study (profiles revamp, "Optimising user profiles
  to attract more projects and hires"), default dark theme. Sections: Overview /
  01 The problem / 02 The solution / 03 The result. One `.img-slot` remains
  ("Example of a current user profile") awaiting a screenshot from the owner.
  Work-grid order on index.html is Fabra > Zookal > Freelancer (owner's request).
- `about.html` — pannable canvas "world" (drag/wheel with fling momentum), pulsing
  pointers opening glass cards (`bio-card` / compact `bio-card--mini`, one per item);
  on mobile the cards re-parent to <body> as fixed popovers (position:fixed is defeated
  inside the transformed world). Desktop scatter: personal items left of Jacqueline,
  work items right. Mobile uses its own scatter in the ≤900px block (nth-of-type
  positioned — **image order in the HTML matters**); Figma/Redbubble icons sit outside
  the initial viewport there, discovered by panning.
- `showcase.html` — "Showcase": a 3D fanned deck of "journal pages" (Pinterest-pin
  reference the owner supplied — the *paper* journal app look). Light grey stage,
  glassmorphism cards; each
  `.deck-card` is a paper-mounted image + italic caption, images never cropped
  (object-fit: contain). All card transforms come from JS (`data-page === "showcase"`
  block in main.js): fractional-position render → drag follows the finger, then snaps.
  Flip via arrows, ←/→ keys, trackpad wheel, drag/swipe, or tapping a side page.
  To add a page: copy a `.deck-card` block in the HTML (order = deck order), point it
  at a ~1400px-wide JPEG (`assets/sc-*.jpg` are deck-optimised copies of larger PNGs);
  the page count and counter update themselves.
- `contact.html` — hero with Email/LinkedIn/YouTube pills.

Every page's pill nav is Home / Work / Showcase / About (add new nav items to all
seven HTML files — and the cache-bust bump below applies to all seven too).

## Media pipeline (videos & images)

**Videos**: never commit raw exports. Encode with ffmpeg + libx264. No ffmpeg on this
Mac natively — a bundled binary lives at
`~/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1`
(installed via `pip3 install --user imageio-ffmpeg`). The recipe:

```bash
ffmpeg -i input.mov \
  -vf "scale=1440:-2,fps=30" \
  -c:v libx264 -crf 23 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an \
  output.mp4
```

- `crf 23` = quality-targeted (21 if soft, 26 if too big); `preset slow` = smaller file
- `scale=1440:-2` ≈ 2× displayed size → Retina-sharp; 30fps is plenty for UI recordings
- `faststart` makes it stream immediately; `-an` strips audio (everything plays muted)
- Typical results: 37–104MB masters → 2.4–4.8MB. Ask the owner for the biggest master
  she has; never use gif for motion (5× the size, 256 colours).

Video markup (autoplay loop, excluded from the zoom system):

```html
<video class="case-video" style="aspect-ratio: W / H" src="assets/name.mp4"
       autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
```
`.hero-video` (overview page) fills its page with object-fit:cover; `.case-video`
shows the whole frame. The `aspect-ratio` matters: pagination measures before video
metadata loads. main.js nudges paused autoplay videos on first tap (iOS Low Power Mode).

**Images**: resize to 1600px wide, JPEG quality ~88 for anything photographic
(PNG only for flat graphics). Set real `width`/`height` attrs — pagination reserves
space from them. Case-study images use the zoom pattern (hover magnify cue, click
opens a centred lightbox; 2x pannable on mobile):

```html
<figure class="zoomable"><img class="case-figure" src="assets/name.jpg"
  width="1600" height="900" alt="..." /></figure>
```

## Key systems & gotchas (js/main.js, css/style.css)

- **Book pagination** (desktop case pages): content flows continuously like a real
  book. `paginateBook()` in main.js flattens sections into blocks (figures/videos are
  blocks too), fills fixed-height pages, starts each chapter on the next fresh page
  (chapter titles appear once — no "continued" headers). It runs after fonts are
  force-loaded (`document.fonts.load(...)` — `fonts.ready` alone resolves too early)
  and returns a section→slide map used by nav/hash/dots. **Flow pages have fixed 50%
  width** (`.book-page--flow`) — a lone page would otherwise stretch full-width and
  under-measure. Pages are hard-capped (`height:100%; overflow:hidden`; stage has
  `contain:paint`) so worst case clips, never spills — **and the ≤900px block must
  fully unwind those caps** (height/max-height/overflow/flex/contain) or the mobile
  reader collapses into one clipped screen (a real bug we shipped once). `.zoomable`
  has `flex-shrink:0` so flex can never squash figures to fit a page. Major window
  resizes reload; crossing the 900px boundary also reloads (in-app browsers settle
  their viewport after scripts run).
- **Cache-busting**: every HTML file references `css/style.css?v=N` and
  `js/main.js?v=N`. **Bump N in all six HTML files whenever CSS/JS change** — the
  owner's browsers cache aggressively and stale mixes have caused ghost bugs.
- **Lightbox**: built in main.js for `.zoomable` figures. `display:flex` on `.lightbox`
  would override the `hidden` attribute — `.lightbox[hidden]{display:none!important}`
  keeps it closed (another shipped bug). It stops wheel/touch propagation so zooming
  never flips book pages. **The mobile 2x pan is transform-driven, never a native
  scroller**: a 200vw image inside an overflow:auto overlay made iOS (in-app
  browsers especially) widen the layout viewport — the page came back shoved
  sideways with fixed elements offset (a third shipped bug). Pointer events move
  the image via translate, touch gestures in the overlay are preventDefault-ed,
  the page is scroll-locked while open (`html.lb-open`), and scroll position is
  restored on close. A drag-release is not a tap-to-close (`panMoved` guard).
- **iOS quirks already handled** (don't regress): nav glass lives on `.pill-nav::before`
  (backdrop-filter directly on a fixed element breaks position:fixed on iOS);
  About page body is `position:fixed` (an overflowing world otherwise makes iOS zoom
  the layout out); hover styles are wrapped in `@media (hover:hover)`; work cards get
  an iOS-only `-webkit-mask-image` (WebKit won't clip filtered children to rounded
  corners). When judging phone layouts, remember Safari's toolbars eat ~180px —
  test at ~390×660, not full height.
- **Work cards**: frosted glass is a per-card blurred moss layer (`::before`), NOT
  backdrop-filter (adjacent live backdrops smear each other in Chromium on hover).
  Card titles are owner-supplied brand SVGs (`assets/fabra-logo.svg` white,
  `zookal-logo.svg` orange, `freelancer-logo.svg` white text + blue bird), sized
  via `.card-logo--*` heights. Gotcha: Figma-exported SVGs wrapping paths in
  `<g clip-path="url(#...)">` painted zero pixels when loaded as an `<img>` —
  strip the clipPath/defs wrapper.
  901–1340px turns the grid into a horizontal snap carousel; ≤900px a taller one.
- Fabra uses the light "collage" theme (`body.case-light`, `assets/collage.jpg`).

## Getting designs out of Figma without the MCP

The Figma MCP rate-limits fast on the owner's View seat. Reliable fallback for a
frame render: headless Chrome on the public embed (works for link-shared files,
no login) —

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --screenshot=out.png --window-size=3840,2160 --hide-scrollbars \
  --virtual-time-budget=40000 --enable-unsafe-swiftshader \
  --use-gl=angle --use-angle=swiftshader \
  "https://embed.figma.com/proto/<fileKey>/x?node-id=<id>&scaling=contain&embed-host=share&hide-ui=1&hotspot-hints=0"
```

SwiftShader flags are required (the WebGL canvas renders black without them); a
3840×2160 window gives a 16:9 frame at ~1.83x. Crop the letterbox bars, then cut
what you need in PIL. When the MCP quota is available, prefer get_design_context:
it hands you every layer as a downloadable PNG/SVG asset plus exact geometry
(the Zookal props in assets/zookal-*.png|svg came from it).

## Verification notes

The embedded browser pane and headless `--screenshot` both fail to repaint after
programmatic scrolls, and the pane sometimes reports `innerWidth: 0` when hidden —
blank/black captures there are usually tooling artifacts, not site bugs. Trust DOM
measurements: copy the page to a scratch `_verify.html`, append a measuring
`<script>` (count pages where `scrollHeight > clientHeight + 2`, etc.), render with
`chrome --headless=new --virtual-time-budget=15000 --dump-dom` at several
window sizes, and grep the marker. Delete the scratch file before committing.

## Open TODOs

- Remaining case-study `[Image]` slots (`.img-slot`) in case-fabra.html await real
  screenshots (structure flow, properties panel, entry-point grid, prioritisation
  framework, OKR excerpt, plan tiers, stats callout, closing shot).
- Freelancer case: `.img-slot` in #problem awaits a "current user profile" screenshot.
- Unplaced owner uploads: `assets/freelancer-share.png` (referral-page laptop mockup),
  `assets/scape-field-services.png` + `-2.png` (5760px masters — compress before placing).
- `assets/overview.png` was uploaded by the owner but is not yet placed anywhere.
- Figma/Redbubble About cards carry drafted copy the owner may want to rewrite.
