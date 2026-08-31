# Jacqueline Tenges — Portfolio

Personal portfolio site for Jacqueline Tenges, Senior Product Designer. Built from the
Figma design [folio '26](https://www.figma.com/design/nFe2M3o0HuhkZcXnBJWFkG/folio--26--Copy-).

Static site — no build step, no dependencies.

## Pages

- `index.html` — hero that crossfades into the work grid as you scroll (parallax + de-blur)
- `case-fabra.html` — Fabra case study as a fixed-viewport, Apple Books-style pager
  (arrows, dots, side nav, keyboard, wheel and swipe)
- `about.html` — full-viewport pannable canvas (scroll or drag to look around) with
  clickable pointers that pop in description bubbles
- `contact.html` — contact hero with Email / LinkedIn / YouTube links

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Deploy (GitHub Pages)

Push to GitHub, then in the repo: **Settings → Pages → Deploy from a branch →
`main` / root**. The site is fully static, so no build configuration is needed.

## Notes

- Fonts are loaded from Google Fonts (Playfair Display, Crimson Text, Inter, Roboto).
- The LinkedIn and YouTube URLs in `about.html` and `contact.html` are placeholders —
  update them to the real profile URLs.
- All imagery is exported from the Figma file into `assets/`.
