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


## Cards / Orbit presentation (October 14)

The sports section has a visitor-facing Cards / Orbit toggle. Its existing cards are the authoritative source for headings, sport copy, photos and links. The introduction and view controls stay in one shared full-width stage outside the animated panels. View switches neither reparent the heading nor trigger global font resizing. Orbit opens by default on every page load; visitors can switch to Cards. No JavaScript leaves the original cards readable.

- `js/sports-switcher.js` owns the content adapter, lazy loading, accessible tabs and cancellable layout transition.
- `css/sports-switcher.css` scopes the integrated layout to `#sports`.
- `orbit/` contains the latest supplied Sport Orbit engine, optimized models and mapped textures bundled in `assets/sport-assets.js`, and the MIT-licensed Three.js runtime.
- Orbit loads only on first selection. Its selected sport photo crossfades behind the complete orbit with blur and a light overlay; a large clear sport photo appears above the details heading with a bottom-to-top entrance and quick outgoing/incoming copy motion.
- Hover or keyboard focus previews details. Desktop ball links and Explore links use the existing destinations. Touching a ball selects it; Explore opens the destination.
- The integrated camera zoom is 1.15 to reserve room for the longer homepage copy and thumbnail; other uploaded motion/model defaults are retained. The stage fills the shared sports section, with dark teal text on white, a teal orbit ring, and a rotated, faded Choose a ball heading on the lower right (hidden at 1024px and below). Mobile stacks the introduction, balls, and details to avoid overlap.
- Rendering pauses when Cards is active, offscreen or in a hidden tab. Reduced motion skips continuous rendering and entrance motion; selectors and links remain usable without WebGL. Asset-load failure offers Retry and Cards.

Validation: DOM simulations cover shared content/link/image parity, deferred loading, rapid toggle cancellation, default Orbit, stable shared-header ownership and no toggle-induced font refitting, detail animation cancellation, reduced motion, unavailable WebGL and failed assets. Camera projection calculations cover desktop and narrow mobile frames. Local asset references and JavaScript syntax checked. Browser/WebGL visual QA remains unavailable; these checks do not establish actual-device appearance or frame rate.

The original responsive section side padding is retained; at 1700px and up it uses max(5vw, calc((100vw - 1500px)/2)). The shared sports content uses the same gutter inside its full-width stage.
