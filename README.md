# Uzma Digital Earth

Published website: https://uzma-geospatial-ai.github.io/GeoAI_MainWebsite/

The root redirects to `redesign/`, the complete deployable static website. The WordPress mirror, templates, scripts and scraper have been retired. Only the content and media have been carried into the new design.

## Development

- `npm ci`
- `npm start` serves the site at http://localhost:8080
- `npm run content:build` regenerates the 36 reading pages and library index from `content/pages.json`.
- `npm run check` validates local assets, imports and anchors throughout the linked site.
- `npm test` runs browser, motion, responsive and accessibility checks.
- `npm run images` regenerates optimized homepage imagery from retained original assets.

## Content

`content/pages.json` contains editorial content without WordPress layout or runtime dependencies. `content/migration-audit.json` records the 39 public sitemap URLs and the disposition of all 47 mirrored HTML files. The new library contains 18 news articles and 18 company/capability pages. Category listings are consolidated; the temporary maintenance page, 404 and unrelated restaurant template are excluded. Every retained source text node was checked against the converted page during migration.

Original images and video are retained under `redesign/assets/library/`. Five third-party reference images were unavailable (403, 404, timeout or connection failure); their original links remain in the relevant articles and are listed in the audit. Contact fields remain documented; enquiries use an email link, because this static deployment has no WordPress form backend.

The six current solutions are AGRO, ESTATE, ASSET, ENVIRO, URBAN and UzmaSATRIA. Product links open the supplied Digital Earth portal; project access requires sign-in. Earlier application descriptions remain in the capabilities library to preserve the requested content.

## Branding and spacecraft

See `redesign/BRAND-IMPLEMENTATION.md` for supplied brand sources, palette, logo usage and font licensing. The 3D satellite has shortened optics and exactly two matching side instruments on facing panels. It is a visual interpretation of the supplied references. The hero responds to scroll; the lower component explorer stays still until the visitor selects the camera, either side instrument, solar panels or the full satellite. Camera transitions respect the global pause control and reduced-motion preferences.

Motion can be paused and respects reduced-motion preferences. WebGL failure retains the original satellite image. GitHub Pages is the current publication target; WordPress and the custom domain have not been changed.

## Premium interface update

The bright interface uses restrained frosted surfaces, the original UZMA and Geospatial AI logos, and the supplied brand palette. The roadmap, service cards, image galleries, news and contact section have been redesigned. All 18 news stories are linked from the homepage, with 15 in an expandable archive. The original rotating product gallery and contact globe have been removed.

Appointment buttons open the existing Geospatial AI Calendly calendar in a modal, loaded only on request. Keyboard Escape and the close button return focus to the opener. A direct Calendly link remains available. Booking availability and confirmation are handled by Calendly; no appointment is created automatically.
