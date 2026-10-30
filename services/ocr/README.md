# OCR service

Run `./run.sh` from Ubuntu/WSL to start the development API with automatic reload.

`POST /v1/ocr` returns `text`, `pages`, `page_count`, `pdf_base64`, and `regions`.
Each region contains `page` (starting at 1), `text`, `box` (`[left, top, right, bottom]`),
`pageWidth`, and `pageHeight`. Coordinates start at the top-left of the visible page.
Consumers scale boxes relative to those page dimensions; coordinates may be fractional.

For scanned pages, an OCRmyPDF plugin preserves Tesseract's original hOCR line boxes
from the existing OCR pass. It does not run Tesseract again or change the PDF renderer.
Pages skipped because they already contain text use PDF text positions instead, with
CropBox offsets and page rotation accounted for. Position extraction failures retain
the successful text/PDF result and are logged.

Laravel saves these regions in `documents.ocr_regions`, which the comparison viewer
already reads. Traditional Paddle uses that same shape, with rectangle or polygon
coordinates from its API. Older documents without saved positions need reprocessing.
Laravel labels Tesseract and traditional Paddle regions with `kind: "line"`, while
Paddle VL regions use `kind: "block"`. The viewer keeps line regions on a single row
and allows block regions to wrap. Existing unlabelled regions keep their earlier
rendering until the document is reprocessed.

Run the coordinate tests with:

```bash
.venv/bin/python -m unittest discover -s tests -v
OCR_INTEGRATION_TESTS=1 .venv/bin/python -m unittest discover -s tests -v
```

The integration test generates its own scan and requires the installed Tesseract,
Ghostscript, and DejaVu Sans font. It does not modify application documents or records.
