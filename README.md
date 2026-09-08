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

## Continuous integration

Every push and pull request to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml),
which checks that:

- `redesign/index.html` has a `<title>`
- every local `src`/`href` it references resolves to a real file
  (external, `data:`, `mailto:`, `tel:` and `#anchor` references are skipped, and
  percent-encoded paths are decoded first)
- the stylesheet and script exist and are non-empty

## Deployment

There is **no automated deploy step yet**. GitHub Pages is not enabled on this
repository, and Pages on a private repo requires a paid plan — so a deploy job
would only ever fail.

`redesign/` is a plain static site with **relative** asset paths, so it can be
dropped onto any host as-is (Netlify, Vercel, Cloudflare Pages, S3, cPanel), and it
works both at a domain root and under a `/<repo>/` subpath. Just upload the folder.

To publish via GitHub Pages later: enable **Settings → Pages → Source → GitHub
Actions**, then add a deploy job that uploads `redesign/` with
`actions/upload-pages-artifact` and publishes it with `actions/deploy-pages`.

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
