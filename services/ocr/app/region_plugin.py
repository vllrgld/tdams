"""Preserve Tesseract's hOCR geometry during the normal OCRmyPDF run."""

import logging
import shutil
from pathlib import Path

from ocrmypdf import hookimpl
from ocrmypdf.builtin_plugins.tesseract_ocr import TesseractOcrEngine

logger = logging.getLogger(__name__)


class RegionTesseractEngine(TesseractOcrEngine):
    @staticmethod
    def generate_hocr(input_file, output_hocr, output_text, options):
        TesseractOcrEngine.generate_hocr(input_file, output_hocr, output_text, options)
        if not options.sidecar or not output_hocr.exists():
            return

        try:
            # sidecar lives in this request's private temporary directory.
            destination = Path(options.sidecar).parent / "regions"
            destination.mkdir(exist_ok=True)
            shutil.copyfile(output_hocr, destination / output_hocr.name)
        except OSError:
            logger.exception("Could not preserve Tesseract text positions")


@hookimpl(tryfirst=True)
def get_ocr_engine(options):
    if options is not None and options.ocr_engine in ("auto", "tesseract"):
        return RegionTesseractEngine()
    return None
