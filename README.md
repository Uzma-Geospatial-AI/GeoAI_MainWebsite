# Uzma Geospatial AI

A cinematic landing page built around **UZMA-Sat 1**, Malaysia's first commercial
very high-resolution Earth observation satellite. The experience combines a
scroll-driven 3D satellite and Earth scene, an interactive satellite imagery
explorer, industry applications and direct contact with the GeoAI team.

| Folder | Purpose |
| --- | --- |
| `redesign/` | Current landing page and all assets needed to host it. |
| `site/` | Reference mirror of the previous WordPress website at `uzmageoai.com`. |
| `scripts/` | Static-site validation and reproducible vendor asset refresh. |

## Run locally

```sh
npm start
```

Open **http://localhost:8080**. The development server uses Node.js built-ins and
needs no package installation. Serve the page over HTTP: opening `index.html`
directly with `file://` prevents browser ES modules from loading correctly.

Use `npm run mirror` to serve the reference website instead. Both servers use
port 8080 by default, so run one at a time.

## Experience

- UZMA-Sat 1 leads the page, with a 3D satellite illustration, Earth, orbital
  details and camera movement tied to scrolling.
- Motion respects `prefers-reduced-motion`, and visitors can pause it. A static
  satellite image remains available if WebGL cannot run.
- The imagery explorer switches between Pulau Bohayen, Giza and Ko Kradat, with
  keyboard-accessible controls and digital magnification.
- Applications connect satellite imagery with agriculture, environmental,
  infrastructure and urban decision-making.
- Enquiries use the team's real email, telephone and WhatsApp links. There is
  no contact form backend and no simulated submission confirmation.

Sample imagery is **© Satellogic**. These samples illustrate the partner imagery
network; they are not presented as verified UZMA-Sat 1 captures. Explorer zoom is
digital magnification, not a demonstration of native 50 cm resolution. Published
mission specifications link to the [official Uzma product page](https://uzmagroup.com/uzmasat-1/).

See [`redesign/README.md`](redesign/README.md) for implementation and hosting notes.

## Validation and dependencies

```sh
npm run check
```

The dependency-free validator checks local HTML references and anchors, CSS
URLs, explicit JavaScript module imports and document-relative asset literals,
plus the required runtime files. Computed JavaScript paths and remote URLs are
outside this static check; verify interactions in a browser before release.
GitHub Actions runs the same check for pushes and pull requests to `main`.

Browser regression tests cover scroll rotation, pause, keyboard controls, image
selection, mobile navigation, responsive overflow, reduced motion, WebGL fallback,
content without JavaScript, and desktop/mobile accessibility:

```sh
npm ci
npm test
```

Local tests use installed Google Chrome. CI installs Playwright Chromium.

Three.js, GSAP and ScrollTrigger are committed under `redesign/assets/vendor/`.
The deployed page loads these local copies. To reproduce them from the lockfile:

```sh
npm ci
npm run vendor
npm run check
```

`npm run vendor` minifies Three.js modules with esbuild and copies its MIT license,
plus the unmodified GSAP and ScrollTrigger distributions. License notices are retained;
GSAP's installed package does not include a separate `LICENSE` file.

`npm run images` regenerates the optimized WebP assets using Sharp and the original
images in this repository. The local server compresses text assets with gzip;
enable Brotli or gzip on the production host too. The scene starts after the
product image is decoded and only when its container approaches the viewport.

## Deployment

There is **no automatic deployment configured in this repository**. A GitHub push
updates the repository and runs validation; it does not publish the site.

Upload the contents of `redesign/` to a static host. There is no build step. Keep
the asset directory structure intact and serve `.js` files with a JavaScript MIME
type so the local ES modules can load. Relative URLs support both a domain root
and a repository subpath. GitHub Pages or another hosting service can be configured
separately when a deployment destination is chosen.

## Reference mirror tooling

The original scraper is retained for maintaining `site/`:

```sh
node scrape.js
node fixlinks.js
node audit.js
```

Install the locked dependencies before running the scraper. WordPress server-side
features in the mirror do not function on a static host.
