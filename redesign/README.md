# UZMA-Sat 1 landing page

A product-focused, cinematic website for Uzma Geospatial AI. A dark orbital scene
introduces UZMA-Sat 1, followed by clear mission specifications, an imagery explorer,
industry applications, the company story and direct enquiry links.

## Local preview

From the repository root:

```sh
npm start
```

Visit **http://localhost:8080**. The Node.js server requires no dependencies.
Use an HTTP server instead of opening the HTML file directly: the 3D scene uses
ES modules, which browsers restrict on `file://` URLs.

## Files and runtime

| File or folder | Role |
| --- | --- |
| `index.html` | Content, navigation, accessible controls and fallback imagery. |
| `assets/css/style.css` | Layout, responsive styling and reduced-motion treatment. |
| `assets/js/main.js` | Page interactions, scroll choreography and scene integration. |
| `assets/js/space-scene.js` | Three.js satellite and Earth illustration. |
| `assets/vendor/` | Local Three.js, GSAP and ScrollTrigger distributions. |
| `assets/fonts/` | Self-hosted typeface. |
| `assets/img/` | Satellite artwork, sample imagery, application images and logos. |

The 3D spacecraft and orbital presentation are illustrative, not an engineering
model or live position feed. The product image remains visible if WebGL is
unavailable. The page respects the operating system's `prefers-reduced-motion`
setting and provides a pause control for motion.

The imagery explorer supports selecting a location and magnifying the displayed
sample. Its keyboard controls should remain usable when changing the layout.
Preserve visible focus styles, semantic buttons, descriptive image text and
the page's skip link when editing.

## Content and attribution

Published specifications are linked to the [official Uzma product page](https://uzmagroup.com/uzmasat-1/).
Keep qualifying wording such as **up to 50 cm per pixel**. The launch date is
15 January 2025, aboard SpaceX Falcon 9 Transporter-12. Orbital numbers describe
published specifications rather than current telemetry.

Pulau Bohayen, Giza and Ko Kradat are **sample imagery © Satellogic** from the
existing company asset collection. They represent the satellite partner network;
do not describe them as confirmed UZMA-Sat 1 captures. The zoom control performs
digital magnification and does not establish the samples' native ground resolution.

Contact destinations are `geospatial.ai@uzmagroup.com`, `+6011 5677 0921` and the
team's WhatsApp account. The site has no enquiry form backend. Email and WhatsApp
links open the visitor's chosen communication service.

## Check and refresh vendor files

From the repository root:

```sh
npm run check
```

This checks local HTML `src`/`href`/`srcset` references, anchor destinations, CSS
URLs, explicit JavaScript imports, quoted `assets/...` mappings and required
runtime files. It does not execute JavaScript, resolve computed paths or check
remote link availability. Review the desktop and mobile layouts, scrolling,
navigation, imagery controls, reduced motion and WebGL fallback in a browser.

To refresh the local vendor files reproducibly:

```sh
npm ci
npm run vendor
npm run check
```

The refresh script minifies `three.module.js` and `three.core.js` using esbuild,
and copies Three.js's MIT license, `gsap.min.js` and `ScrollTrigger.min.js` from
the installed packages. GSAP's package has no separate license file; its distribution headers
retain the copyright and license link. Commit vendor changes alongside lockfile
changes when updating dependency versions.

Run `npm run images` to regenerate WebP assets from the original repository images.
Run `npm test` for the browser regression and accessibility checks (installed Chrome
locally, Playwright Chromium in CI). Runtime image and code assets are local; no
third-party font or JavaScript CDN is required. The scene waits for the product
image and a visible container before loading. The preview server uses gzip for
text assets; enable gzip or Brotli when configuring production hosting.

## Hosting

This is a static site with **no build step and no automatic deployment**. Pushing
to GitHub validates the committed files but does not publish a website.

Upload this folder's contents to a static host and retain the directory structure.
Use a host that serves `.js` as JavaScript and `.woff2` as a font. Assets use relative
paths so hosting at a domain root or under a repository subpath both work.
The previous WordPress mirror is kept separately in `../site/`.
