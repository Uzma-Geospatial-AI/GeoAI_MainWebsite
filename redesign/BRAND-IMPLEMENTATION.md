# Brand implementation

Source: user-supplied UZMA BRAND GUIDE 2024 UPDATE (1).pdf (16 pages) and
UzmaDE Branding Guidelines.pdf (one page). The full internal guides are not
included in the public repository.

## Rules and implementation

| Source | Rule | Website implementation |
| --- | --- | --- |
| UZMA guide, p. 9 | Dominant orange and grey | One orange (#F26623, the Digital Earth swatch) for CTAs, rules and accents; #656567 for secondary text; neutral surfaces |
| UZMA guide, p. 10 | Calibri Regular and Bold | Calibri-first font stack; self-hosted Carlito Regular/Bold as a compatible fallback. Only 400 and 700 are used, so nothing is synthesised |
| UZMA guide, pp. 4–5 | Solid, serious, modern; rising diagonal motif | Clear type hierarchy, precise image frames, thin diagonal brand accent |
| Digital Earth guide, p. 1 | Official light and dark applications | Original full-color mark on matching light surface; original white mark on matching black footer |
| Digital Earth guide, p. 1 | No distortion, rotation, effects, outlines, recoloring, busy backgrounds | Logo images keep their aspect ratio, original colors and solid backgrounds; motion excludes the marks |
| Digital Earth guide, p. 1 | Orange, red, yellow, blue and charcoal palette | Original multicolor logo; supporting blue #083959 and charcoal #353535 in the interface |

Digital Earth hex equivalents are rounded from the PDF drawing fills, which do
not carry printed hex labels. Photographs and the illustrative spacecraft retain
their natural/material colors.

### One palette, one type scale

Earlier passes left three oranges in the stylesheets (#E26F39, #F26522,
#F26623), two heading inks (#172B3A, #353535) and two secondary greys (#56636C,
#656567). They now all resolve to the supplied swatches, declared once as tokens
at the top of `colour.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--de-orange` | #F26623 | CTAs, eyebrow rules, active states, focus rings |
| `--de-blue` | #083959 | Second headline line, display figures, nav pill, dark sections |
| `--de-red` / `--de-yellow` | #ED2028 / #FECD03 | Spec-card accents only |
| `--de-charcoal` | #353535 | Headlines and body ink |
| `--de-grey` | #656567 | Secondary text and labels |
| `--surface-0`…`--surface-3` | #FFFFFF to #EEF2F5 | Section surfaces; no tinted peach or slate |

CTA labels sit at #212121 on the orange fill, which clears 5.1:1. Brand charcoal
alone would only reach 3.9:1, and white would reach 3.1:1.

Type is two weights and one ramp: every heading and display figure is Bold, all
running text is Regular, labels are Bold uppercase at 12px/0.14em. Tracking
tightens as size grows (-0.045em hero, -0.04em h2, -0.035em h3/h4). The hero and
every section headline share the same two-tone treatment: charcoal first line,
brand navy second line.

## Assets

- `assets/img/brand/uzma-digital-earth-light.png`: unchanged logo region from the
  top official logo on the Digital Earth sheet, rendered at 3x.
- `assets/img/brand/uzma-digital-earth-dark.png`: unchanged white logo region from
  the approved dark application, rendered at 3x.
- `assets/fonts/carlito-regular.woff2`, `carlito-bold.woff2`: converted from the
  Google Fonts Carlito distribution. License: `Carlito-OFL.txt`.
  Source: https://github.com/google/fonts/tree/main/ofl/carlito

The fallback is used only when the visitor does not have Calibri. Logo lettering
is embedded in the original artwork and never substituted with a web font.

## Visual and motion decisions

White/grey content sections alternate with a light brand hero and a Digital
Earth blue collection section. Rounded pastel tiles and angled photographs have
been replaced by aligned imagery, restrained borders and consistent small radii.
Original content, all ten Insights, contact routes, image controls and the full content library are preserved. The landscape scene uses attributed satellite imagery.
Scroll motion introduces the spacecraft, imagery scale and platform perspective;
all motion respects the page pause control and reduced-motion preferences.

The updated spacecraft has a 28% shorter exposed optical assembly and exactly two matching side instruments on facing panels. The hero rotates with scroll. The lower model is a still, selectable component explorer with camera focus transitions. It remains a visual interpretation, not dimensionally certified hardware geometry.

## Current product presentation

The user requested UZMA and Geospatial AI marks in place of the Digital Earth masthead. `assets/img/brand/uzma-group.png` is a direct 4x raster export of the logo on page 4 of the supplied UZMA guide (clip 279,280 to 568,346 PDF points). The Geospatial AI mark is the original `assets/library/Logo-GeoAI_300px.png`. Both appear unmodified on white backgrounds. Digital Earth remains the linked product portal.

`premium.css` applies bright surfaces and selected frosted panels, with solid fallbacks for reduced transparency. The Calibri/Carlito font stack and corporate orange remain in place. The news, roadmap, component explorer and appointment calendar replace the previous layouts; the full content library is preserved.
