# Supplied brochure and presentation

The 2026 brochure (12 pages) and project/news presentation (8 slides) are published as 20 native HTML chapters. All 36 previously migrated pages remain. The homepage now links 21 news stories.

`documents.json` records original source hashes, extracted text blocks, source previews and 128 unique embedded images. `document-editorial.json` supplies readable prose and transcriptions of image-only content. `document-coverage.json` maps each unit to its published page. The original PDF and PowerPoint files are not published or offered for download. Source hashes remain in the audit manifest; all native chapters, text blocks, previews and extracted images remain published.

The first presentation slide is an editorial collection template, published only as a reference. Its instructions are not executed or presented as completed client work. Group business statistics are identified as Uzma Group statistics. Historical articles retain their historical figures; the main product specifications use the supplied 2026 brochure (6.5 km swath; 460–525 km altitude).

The latest colour direction follows the five swatches in the supplied UzmaDE Branding Guidelines: #F26623 orange, #ED2028 red, #FECD03 yellow, #083959 navy and #353535 charcoal. Navy, orange, charcoal and their light tints dominate; red and yellow provide smaller accents. This hierarchy is a design choice, not a ratio specified by the guide. Existing UZMA and Geospatial AI logos remain original.

The 3D explorer includes 10 exterior component views plus the full satellite view. Undocumented external panels are named by visible appearance. General star-tracker orientation principles link to NASA's small-spacecraft guidance reference; no NASA specifications are attributed to UZMASAT-1.

## Rebuild

1. Export the presentation's eight slides with native PowerPoint to `Slide1.PNG` through `Slide8.PNG`, at 1920 × 1080. Open the source read-only with macros disabled.
2. Convert the embedded `hdphoto1.wdp` with Windows `BitmapDecoder`/`PngBitmapEncoder` to `redesign/assets/documents/presentation-hdphoto1.png` (already committed). Preserve the original.
3. Run `python scripts/import-documents.py <brochure.pdf> <presentation.pptx> <slide-render-directory>` with PyMuPDF and Pillow installed.
4. Run `python scripts/build-documents.py` (BeautifulSoup required), then `npm run content:build`.
5. Run `npm run check` and `npm test`.

Document tests verify every source text block, every image reference and extracted-image SHA-256 hashes, and confirm source document downloads are absent. Visual page/slide previews also preserve labels, diagrams, logos, layout and image-only content that PDF text extraction cannot recover.
