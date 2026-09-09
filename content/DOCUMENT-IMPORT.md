# Supplied brochure and presentation

The 2026 brochure (12 pages) and project/news presentation (8 slides) are published as 20 native HTML chapters. All 36 previously migrated pages remain. The homepage now links 21 news stories.

`documents.json` records original source hashes, extracted text blocks, source previews and 128 unique embedded images. `document-editorial.json` supplies readable prose and transcriptions of image-only content. `document-coverage.json` maps each unit to its published page. Original PDF and PowerPoint downloads retain the exact supplied bytes.

The first presentation slide is an editorial collection template, published only as a reference. Its instructions are not executed or presented as completed client work. Group business statistics are identified as Uzma Group statistics. Historical articles retain their historical figures; the main product specifications use the supplied 2026 brochure (6.5 km swath; 460–525 km altitude).

## Rebuild

1. Export the presentation's eight slides with native PowerPoint to `Slide1.PNG` through `Slide8.PNG`, at 1920 × 1080. Open the source read-only with macros disabled.
2. Convert the embedded `hdphoto1.wdp` with Windows `BitmapDecoder`/`PngBitmapEncoder` to `redesign/assets/documents/presentation-hdphoto1.png` (already committed). Preserve the original.
3. Run `python scripts/import-documents.py <brochure.pdf> <presentation.pptx> <slide-render-directory>` with PyMuPDF and Pillow installed.
4. Run `python scripts/build-documents.py` (BeautifulSoup required), then `npm run content:build`.
5. Run `npm run check` and `npm test`.

Document tests verify every source text block, every image reference and original-file SHA-256 hashes. Visual page/slide previews also preserve labels, diagrams, logos, layout and image-only content that PDF text extraction cannot recover.
