# Uzma Geospatial AI — Redesign (Glass / Apple-style)

A ground-up redesign of the Uzma Geospatial AI homepage: modern, animated, and clean,
built around an Apple-style **"liquid glass"** language on a deep-space field.
All copy, imagery, contact details and partner logos are the **real content** taken
from the live site — nothing is placeholder text.

## Run it

```bash
npm start          # from the project root  ->  http://localhost:8080
```
or

```bash
node redesign/serve.js
```

You can also open `redesign/index.html` directly in a browser.

## Design language

| Element | Treatment |
|---|---|
| **Background** | Deep space gradient with three slowly drifting aurora blobs + a live twinkling star canvas |
| **Glass** | `backdrop-filter: blur(22px) saturate(150%)`, translucent white fill, 1px light border, soft inner top highlight |
| **Accent** | Brand orange `#ff6a1e` → `#ff9147`, with `#49b6ff` space-blue and `#7c8cff` violet |
| **Type** | Inter, tight tracking, large confident headings |
| **Shape** | Generous radii (14 / 20 / 28px), pill buttons, airy spacing |

## Animations

- **Scroll reveal** — sections fade/slide/un-blur in on entry (IntersectionObserver), with stagger delays
- **Glass navbar** — transparent at rest, frosts and lifts once you scroll
- **Hero tilt** — the satellite panel tilts subtly toward the cursor (3D perspective)
- **Count-up stats** — figures animate from 0 when scrolled into view
- **Card spotlight** — a soft light follows the cursor across glass cards
- **Hover choreography** — solution cards lift, image zooms, description expands, arrow slides
- **Partner marquee** — seamless infinite scroll, pauses on hover
- **Floating cards** — gentle drift on the hero panel
- Full `prefers-reduced-motion` support — all motion disabled for users who ask for it

## Sections

1. **Hero** — UzmaSAT-1 launch badge, headline, CTAs, key figures, glass satellite panel
2. **Stats strip** — 50cm resolution · 7× daily revisits · founded 2021 · 14+ partners
3. **About** — company story, Vision & Mission, Uzma Digital Earth platform visual
4. **Solutions** — 6 industry cards on real satellite imagery (agriculture, plantation, ground movement, infrastructure, forestry, urban)
5. **Services** — the 4 core services
6. **UzmaSAT-1** — the launch story with spec tiles
7. **Awards** — MTEA 2024 and both Solar Week Malaysia awards
8. **Partners** — scrolling logo marquee
9. **Blog** — three latest posts with real dates and categories
10. **Contact** — real contact details + enquiry form
11. **Footer** — full navigation, socials, legal line

## Notes

- The **contact form is visual only** — it does not submit anywhere yet (as agreed).
  To make it live, point it at a service such as Formspree or your own endpoint.
- Nav links currently scroll to sections on this single page. When the inner pages
  (Blog, individual Solutions/Services) are built, swap the `#anchors` for real URLs.
- Add `?reveal=1` to the URL to force all animations to their final state — useful
  for screenshots and print.
- The original mirrored site is untouched in `../site/` (run it with `npm run mirror`).

## Deploying

`redesign/` is a plain static site. Upload its contents to any static host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, cPanel). No build step.
