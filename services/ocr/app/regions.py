"""Read Tesseract geometry, with PDF text positions for already-searchable pages."""

import logging
import re
import xml.etree.ElementTree as ET
from collections.abc import Iterator
from math import isfinite
from pathlib import Path
from typing import NotRequired, TypedDict

from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams, LTContainer, LTTextLine
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfpage import PDFPage
from pdfminer.utils import Matrix, Rect, apply_matrix_pt

logger = logging.getLogger(__name__)
BBOX = re.compile(r"\bbbox\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)")


class OcrWord(TypedDict):
    text: str
    box: list[float]


class OcrRegion(TypedDict):
    page: int
    text: str
    box: list[float] | None
    pageWidth: float
    pageHeight: float
    words: NotRequired[list[OcrWord]]


def hocr_text_regions(directory: Path) -> tuple[set[int], list[OcrRegion]]:
    pages: set[int] = set()
    regions: list[OcrRegion] = []

    def bbox(element):
        match = BBOX.search(element.get("title", ""))
        return [float(value) for value in match.groups()] if match else None

    for path in sorted(directory.glob("*.hocr")):
        try:
            page_number = int(path.name.split("_", 1)[0])
            root = ET.parse(path).getroot()
            page = next(element for element in root.iter()
                        if "ocr_page" in element.get("class", "").split())
            bounds = bbox(page)
            if bounds is None or page_number < 1:
                continue
            left, top, right, bottom = bounds
            width, height = right - left, bottom - top
            if width <= 0 or height <= 0:
                continue

            page_regions: list[OcrRegion] = []

            def visible_box(value):
                if value is None:
                    return None
                x1, y1, x2, y2 = value
                result = [max(0.0, x1 - left), max(0.0, y1 - top),
                          min(width, x2 - left), min(height, y2 - top)]
                return result if result[2] > result[0] and result[3] > result[1] else None

            for line in page.iter():
                classes = set(line.get("class", "").split())
                if not classes.intersection({"ocr_line", "ocrx_line", "ocr_header", "ocr_caption", "ocr_textfloat"}):
                    continue
                elements = [word for word in line.iter()
                            if "ocrx_word" in word.get("class", "").split()
                            and "".join(word.itertext()).strip()]
                words = [{"text": "".join(word.itertext()).strip(),
                          "box": visible_box(bbox(word))} for word in elements]
                text = " ".join(word["text"] for word in words) if words else "".join(line.itertext()).strip()
                if not text:
                    continue
                box = visible_box(bbox(line))
                positioned_words = [word for word in words if word["box"] is not None]
                if positioned_words:
                    word_bounds = [min(word["box"][0] for word in positioned_words),
                                   min(word["box"][1] for word in positioned_words),
                                   max(word["box"][2] for word in positioned_words),
                                   max(word["box"][3] for word in positioned_words)]
                    box = word_bounds if box is None else [min(box[0], word_bounds[0]), min(box[1], word_bounds[1]),
                                                          max(box[2], word_bounds[2]), max(box[3], word_bounds[3])]
                region: OcrRegion = {"page": page_number, "text": text, "box": box,
                                     "pageWidth": width, "pageHeight": height}
                if words and len(positioned_words) == len(words):
                    region["words"] = positioned_words
                page_regions.append(region)

            if page_regions:
                pages.add(page_number)
                regions.extend(page_regions)
        except (OSError, ValueError, StopIteration, ET.ParseError):
            logger.exception("Could not read Tesseract text positions")

    return pages, regions


class RegionPageAggregator(PDFPageAggregator):
    def begin_page(self, page: PDFPage, ctm: Matrix) -> None:
        super().begin_page(page, ctm)

        # pdfminer applies page rotation and MediaBox offsets to the layout.
        # Apply that same transform to CropBox to match the page PDF.js displays.
        def bounds(box: Rect) -> Rect:
            x0, y0, x1, y1 = box
            points = [
                apply_matrix_pt(ctm, point)
                for point in ((x0, y0), (x0, y1), (x1, y0), (x1, y1))
            ]
            return (
                min(p[0] for p in points), min(p[1] for p in points),
                max(p[0] for p in points), max(p[1] for p in points),
            )

        media = bounds(page.mediabox)
        crop = bounds(page.cropbox)
        self.visible_box = (
            max(media[0], crop[0]), max(media[1], crop[1]),
            min(media[2], crop[2]), min(media[3], crop[3]),
        )


def text_lines(container: LTContainer) -> Iterator[LTTextLine]:
    for element in container:
        if isinstance(element, LTTextLine):
            yield element
        elif isinstance(element, LTContainer):
            yield from text_lines(element)


def pdf_text_regions(path: Path, exclude_pages: set[int] | None = None) -> list[OcrRegion]:
    resources = PDFResourceManager()
    device = RegionPageAggregator(
        resources, laparams=LAParams(all_texts=True, detect_vertical=True)
    )
    interpreter = PDFPageInterpreter(resources, device)
    regions: list[OcrRegion] = []

    try:
        with path.open("rb") as handle:
            for page_number, page in enumerate(PDFPage.get_pages(handle), start=1):
                if exclude_pages and page_number in exclude_pages:
                    continue
                interpreter.process_page(page)
                left, bottom, right, top = device.visible_box
                width, height = right - left, top - bottom

                if (
                    not all(isfinite(value) for value in (left, bottom, right, top))
                    or width <= 0 or height <= 0
                ):
                    continue

                for line in text_lines(device.get_result()):
                    text = line.get_text().strip()
                    box = [
                        max(0.0, line.x0 - left), max(0.0, top - line.y1),
                        min(width, line.x1 - left), min(height, top - line.y0),
                    ]

                    if (
                        not text or not all(isfinite(value) for value in box)
                        or box[2] <= box[0] or box[3] <= box[1]
                    ):
                        continue

                    regions.append(
                        {
                            "page": page_number,
                            "text": text,
                            "box": [round(value, 3) for value in box],
                            "pageWidth": round(width, 3),
                            "pageHeight": round(height, 3),
                        }
                    )
    finally:
        device.close()

    return regions
