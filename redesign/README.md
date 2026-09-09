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

The renewed landing page retains the original [Geospatial AI website](https://www.uzmageoai.com/)
content and brand palette, checked on 9 September 2026: navy `#2A3E58`, orange
`#F26522`, secondary text `#646266`, body text `#112222`, and backgrounds
`#FFFBF7`, `#F2F2FF` and `#FCFCFC`. The orbital hero uses a darker space background.
The satellite illustration follows the supplied reference views: a copper optical
barrel, open baffled telescope, compact body-mounted solar panels and gold instrument patches.

The page includes all seven solutions and four services, company introduction,
vision and mission, three award entries, fourteen partners, seven clients, selected
news stories and the original contact directory. Copy and images come from the
existing `site/` mirror and official homepage, About, Services, Solutions, Blog and
Contact pages. Detailed articles and service pages continue to link to the original
domain. The short film, Calendly booking and WhatsApp appointment links are retained.

Ground movement uses the dedicated service's InSAR description, and mapping/AI
service descriptions follow the dedicated pages rather than swapped homepage text.
The past Map Your Route campaign links to community updates because its original
registration destination is unavailable; it is not presented as open registration.

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

This is a static site with **no application build step**. GitHub Pages is enabled
in the repository settings and publishes through GitHub's Pages workflow after a
push to the publishing branch. The repository root `index.html` forwards to this
folder. The public URL is https://uzma-geospatial-ai.github.io/GeoAI_MainWebsite/.
Check the deployment workflow to confirm the latest version is published.

Upload this folder's contents to a static host and retain the directory structure.
Use a host that serves `.js` as JavaScript and `.woff2` as a font. Assets use relative
paths so hosting at a domain root or under a repository subpath both work.
The previous WordPress mirror is kept separately in `../site/`.
