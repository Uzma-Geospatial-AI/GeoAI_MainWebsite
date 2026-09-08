# GeoAI Main Website

Website work for **Uzma Geospatial AI** (Geospatial AI Sdn Bhd, a subsidiary of Uzma Berhad).

This repository holds two things:

| Folder | What it is |
|---|---|
| **`redesign/`** | **The new site.** A ground-up redesign of the homepage in an Apple-style "liquid glass" language — animated, responsive, and built from the real site content. This is what gets deployed. |
| **`site/`** | A complete static mirror of the existing WordPress site (`uzmageoai.com`), captured for reference and as a fallback. 47 pages, all assets. |

## Quick start

```bash
npm install        # only needed if you want to re-run the scraper

npm start          # serve the REDESIGN  -> http://localhost:8080
npm run mirror     # serve the MIRROR    -> http://localhost:8080
```

Both servers are zero-dependency Node scripts. You can also open
`redesign/index.html` directly in a browser.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which validates that every asset referenced by the redesign exists, then publishes
`redesign/` to **GitHub Pages**.

The redesign uses relative asset paths, so it works both at a domain root and at a
`/<repo>/` project subpath.

> **First-time setup:** in the repository go to **Settings → Pages** and set
> **Source** to **GitHub Actions**. The workflow handles everything after that.

## The redesign

Deep-space gradient with drifting aurora glows and a live star canvas; frosted glass
panels; brand orange `#ff6a1e` with space-blue `#49b6ff`; Inter type.

Animations: scroll reveals, a navbar that frosts on scroll, cursor-tilt on the hero
satellite panel, count-up stats, cursor spotlight on glass cards, hover choreography
on solution cards, and a seamless partner marquee — all disabled under
`prefers-reduced-motion`.

Sections: Hero → stats → About (Vision/Mission) → 6 Solutions → 4 Services →
UzmaSAT-1 → Awards → Partners → Blog → Contact → Footer.

Full detail in [`redesign/README.md`](redesign/README.md).

## Known limitations

- The **contact form is visual only** — it does not submit anywhere yet. Point it at
  Formspree or a custom endpoint to make it live.
- Redesign nav links scroll to sections on the single homepage. When inner pages
  (Blog, individual Solutions/Services) are built, swap the `#anchors` for real URLs.
- The mirror in `site/` is a static snapshot: WordPress server-side features
  (form submission, search, `wp-admin`) do not run.

## Tooling

| Script | Purpose |
|---|---|
| `serve.js` | Static server for the mirror (pretty URLs redirect to the flat files). |
| `redesign/serve.js` | Static server for the redesign. |
| `scrape.js` | Crawler that produced the mirror. |
| `fixlinks.js` | Rewrites internal links in the mirror to point at local files. |
| `audit.js` | Verifies every local asset reference in the mirror resolves. |

Refresh the mirror with:

```bash
node scrape.js && node fixlinks.js && node audit.js
```
