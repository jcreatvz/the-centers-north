# The Centers North

Responsive standalone homepage for The Centers North sports complex in St. Albert, Alberta.

## Preview locally

Serve this folder with any static web server, for example:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. No build step or package installation is required.

## Files

- `index.html` — homepage content and navigation.
- `css/home.css` — base layout and responsive styles.
- `css/motion.css` — scroll layouts, marquee, and component styling.
- `css/brand-refinements.css` — custom typography, brand colors, buttons, and location cards.
- `js/home.js` — navigation, hero video, and signup preview.
- `js/motion.js` — scroll reveals, card motion, and counters.
- `js/ambient-motion.js` — scroll-responsive icon rotation and location-card floating.
- `js/typography.js` — responsive heading fitting.
- `js/template-motion.js` — adapted interaction configuration from the supplied Webflow template.
- `fonts/` and `images/` — fonts, photography, and supplied brand SVGs.

The original Webflow styles/runtime and jQuery are retained locally.

## Hosting

Upload this folder to a static web host. For GitHub Pages, select the `main` branch and `/ (root)` in the repository's Pages settings. No hosting automation is configured in this repository.

## Current behavior

- The marquee uses `--marquee-bg: var(--deep)` and `--marquee-color: var(--paper)`.
- The hero film autoplays muted when allowed; it streams from its original Wix URL and has pause/play controls.
- SVG marquee icons react smoothly to scrolling, with capped rotation speeds.
- Animations respect reduced-motion settings.
- Sports, careers, and partner links lead to existing websites.
- Mailing-list submission is a preview only: no personal data is submitted or saved. Connect a mailing-list service before production use.

## Assets and verification

Brand SVGs and the Akira JC font were supplied for this project. Photography comes from the existing Centers website; template fonts and scripts come from the supplied Webflow export. Retain the applicable asset and template permissions when reusing this project.

Local asset references, JavaScript syntax, and targeted animation/media behavior have been checked. Desktop and mobile browser visual QA is still required before replacing the public website.
