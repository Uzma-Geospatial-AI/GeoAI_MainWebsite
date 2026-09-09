# Brand implementation

Source: user-supplied UZMA BRAND GUIDE 2024 UPDATE (1).pdf (16 pages) and
UzmaDE Branding Guidelines.pdf (one page). The full internal guides are not
included in the public repository.

## Rules and implementation

| Source | Rule | Website implementation |
| --- | --- | --- |
| UZMA guide, p. 9 | Dominant orange and grey; web #E26F39 and #656567 | Explicit corporate tokens, orange CTAs/rules, neutral surfaces and grey text |
| UZMA guide, p. 10 | Calibri Regular and Bold | Calibri-first font stack; self-hosted Carlito Regular/Bold as a compatible fallback |
| UZMA guide, pp. 4–5 | Solid, serious, modern; rising diagonal motif | Clear type hierarchy, precise image frames, thin diagonal brand accent |
| Digital Earth guide, p. 1 | Official light and dark applications | Original full-color mark on matching light surface; original white mark on matching black footer |
| Digital Earth guide, p. 1 | No distortion, rotation, effects, outlines, recoloring, busy backgrounds | Logo images keep their aspect ratio, original colors and solid backgrounds; motion excludes the marks |
| Digital Earth guide, p. 1 | Orange, red, yellow, blue and charcoal palette | Original multicolor logo; supporting blue #083959 and charcoal #353535 in the interface |

Digital Earth hex equivalents are rounded from the PDF drawing fills, which do
not carry printed hex labels. UZMA corporate web hex values are explicit in the
guide and take precedence for interface orange and grey. Photographs and the
illustrative spacecraft retain their natural/material colors.

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

White/grey content sections alternate with an atmospheric dark hero and Digital
Earth blue services section. Rounded pastel tiles and angled photographs have
been replaced by aligned imagery, restrained borders and consistent small radii.
Original content, all ten Insights, contact routes, image controls and the three
3D scenes are preserved. The landscape scene uses attributed satellite imagery.
Scroll motion introduces the spacecraft, imagery scale and platform perspective;
all motion respects the page pause control and reduced-motion preferences.

The updated spacecraft has a 28% shorter exposed optical assembly and a rear-left
star-tracker-style baffle based on the latest supplied photo. It remains a visual
interpretation, not dimensionally certified hardware geometry.
