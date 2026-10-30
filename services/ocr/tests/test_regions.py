import asyncio
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace

from fastapi import UploadFile

from app.main import ocr, run_ocr
from app.region_plugin import RegionTesseractEngine
from app.regions import hocr_text_regions, pdf_text_regions


HOCR = '''<html><body><div class="ocr_page" title="bbox 0 0 1600 1000">
<span class="ocr_line" title="bbox 160 200 810 260">
<span class="ocrx_word">OWNER</span><span class="ocrx_word">SAMPLE</span>
</span></div></body></html>'''


def pdf_fixture(pages):
    objects = [b"", b"<< /Type /Catalog /Pages 2 0 R >>", b""]
    kids = []

    for page in pages:
        number = len(objects)
        kids.append(f"{number} 0 R")
        stream = page.get("stream", "BT /F1 12 Tf 100 700 Td (Owner Sample) Tj ET").encode()
        media = page.get("media", "0 0 612 792")
        extras = f" /Rotate {page.get('rotate', 0)}"
        if "crop" in page:
            extras += f" /CropBox [{page['crop']}]"
        objects.extend([
            (f"<< /Type /Page /Parent 2 0 R /MediaBox [{media}] {extras} "
             f"/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> >> >> "
             f"/Contents {number + 1} 0 R >>").encode(),
            f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
        ])

    objects[2] = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(kids)} >>".encode()
    data = b"%PDF-1.4\n"
    offsets = [0]
    for number, obj in enumerate(objects[1:], start=1):
        offsets.append(len(data))
        data += f"{number} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(data)
    data += f"xref\n0 {len(objects)}\n0000000000 65535 f \n".encode()
    data += b"".join(f"{offset:010} 00000 n \n".encode() for offset in offsets[1:])
    return data + f"trailer\n<< /Size {len(objects)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()


class PdfRegionTests(unittest.TestCase):
    def regions(self, pages):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "fixture.pdf"
            path.write_bytes(pdf_fixture(pages))
            return pdf_text_regions(path)

    def test_line_positions_use_top_left_page_coordinates(self):
        region, = self.regions([{}])
        self.assertEqual(region["text"], "Owner Sample")
        self.assertEqual((region["pageWidth"], region["pageHeight"]), (612, 792))
        self.assertEqual(region["box"][0], 100)
        self.assertAlmostEqual(region["box"][1], 82.484, places=3)
        self.assertAlmostEqual(region["box"][3] - region["box"][1], 12, places=3)

    def test_original_hocr_line_boxes_are_preserved(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            (directory / "000002_ocr_hocr.hocr").write_text(HOCR)
            pages, regions = hocr_text_regions(directory)
        self.assertEqual(pages, {2})
        self.assertEqual(regions, [{
            "page": 2, "text": "OWNER SAMPLE", "box": [160, 200, 810, 260],
            "pageWidth": 1600, "pageHeight": 1000,
        }])

    def test_plugin_copies_hocr_after_one_tesseract_call(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            output = directory / "000001_ocr_hocr.hocr"

            def generate(*args):
                output.write_text(HOCR)

            with patch("app.region_plugin.TesseractOcrEngine.generate_hocr", side_effect=generate) as engine:
                RegionTesseractEngine.generate_hocr(
                    directory / "input.png", output, directory / "text.txt",
                    SimpleNamespace(sidecar=directory / "sidecar.txt"),
                )
            engine.assert_called_once()
            self.assertEqual((directory / "regions" / output.name).read_text(), HOCR)

    def test_crop_box_matches_visible_page_and_excludes_hidden_lines(self):
        region, = self.regions([{"crop": "50 100 550 750", "stream":
            "BT /F1 12 Tf 100 700 Td (Owner Sample) Tj ET "
            "BT /F1 12 Tf 100 50 Td (Outside crop) Tj ET"}])
        self.assertEqual((region["pageWidth"], region["pageHeight"]), (500, 650))
        self.assertEqual(region["box"][0], 50)
        self.assertAlmostEqual(region["box"][1], 40.484, places=3)

    def test_rotated_cropped_page_has_rotated_dimensions_and_boxes(self):
        region, = self.regions([{"crop": "50 100 550 750", "rotate": 90}])
        self.assertEqual((region["pageWidth"], region["pageHeight"]), (650, 500))
        self.assertAlmostEqual(region["box"][0], 597.516, places=3)
        self.assertEqual(region["box"][1], 50)
        self.assertTrue(all(0 <= value <= 650 for value in region["box"][::2]))
        self.assertTrue(all(0 <= value <= 500 for value in region["box"][1::2]))

    def test_media_box_offsets_and_blank_pages_keep_page_numbers(self):
        region, = self.regions([{"stream": ""}, {"media": "20 30 632 822"}])
        self.assertEqual(region["page"], 2)
        self.assertEqual(region["box"][0], 80)
        self.assertAlmostEqual(region["box"][1], 112.484, places=3)

    def test_ocr_run_reuses_searchable_pdf_positions_without_second_ocr(self):
        data = pdf_fixture([{}])

        def fake_ocr(source, output, **options):
            output.write_bytes(source.read_bytes())
            Path(options["sidecar"]).write_text("[OCR skipped on page(s) 1]\f")
            return 0

        with patch("app.main.ocrmypdf.ocr", side_effect=fake_ocr) as engine:
            text, pages, pdf, regions = run_ocr(data, ".pdf", optimize=0)

        engine.assert_called_once()
        self.assertEqual(text, "Owner Sample")
        self.assertEqual(pages, ["Owner Sample"])
        self.assertEqual(pdf, data)
        self.assertEqual(regions[0]["text"], "Owner Sample")

    def test_mixed_pdf_uses_hocr_for_scans_and_pdf_positions_for_skipped_pages(self):
        def fake_ocr(source, output, **options):
            output.write_bytes(source.read_bytes())
            sidecar = Path(options["sidecar"])
            sidecar.write_text("OWNER SAMPLE\f[OCR skipped on page(s) 2]\f")
            directory = sidecar.parent / "regions"
            directory.mkdir()
            (directory / "000001_ocr_hocr.hocr").write_text(HOCR)
            return 0

        with patch("app.main.ocrmypdf.ocr", side_effect=fake_ocr):
            _, _, _, regions = run_ocr(pdf_fixture([{}, {}]), ".pdf", optimize=0)

        self.assertEqual(len(regions), 2)
        self.assertEqual(regions[0]["box"], [160, 200, 810, 260])
        self.assertEqual(regions[0]["text"], "OWNER SAMPLE")
        self.assertEqual(regions[1]["page"], 2)
        self.assertEqual(regions[1]["text"], "Owner Sample")

    def test_position_failure_keeps_successful_text_and_pdf(self):
        def fake_ocr(source, output, **options):
            output.write_bytes(source.read_bytes())
            Path(options["sidecar"]).write_text("Owner Sample\f")
            return 0

        with patch("app.main.ocrmypdf.ocr", side_effect=fake_ocr), \
                patch("app.main.pdf_text_regions", side_effect=ValueError("bad layout")), \
                self.assertLogs("app.main", level="ERROR"):
            text, _, pdf, regions = run_ocr(pdf_fixture([{}]), ".pdf", optimize=0)
        self.assertEqual(text, "Owner Sample")
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertEqual(regions, [])

    def test_api_includes_regions(self):
        region = {"page": 1, "text": "Owner", "box": [10, 20, 80, 40],
                  "pageWidth": 612, "pageHeight": 792}
        upload = UploadFile(file=io.BytesIO(b"fake pdf"), filename="scan.pdf")
        with patch.dict(os.environ, {"OCR_API_TOKEN": "test"}), \
                patch("app.main.run_ocr", return_value=("Owner", ["Owner"], b"pdf", [region])):
            result = asyncio.run(ocr(file=upload, optimize=0, authorization="Bearer test"))
        self.assertEqual(result["regions"], [region])
        self.assertEqual(result["page_count"], 1)

    @unittest.skipUnless(os.environ.get("OCR_INTEGRATION_TESTS") == "1", "requires Tesseract and Ghostscript")
    def test_real_image_ocr_returns_positioned_text(self):
        from PIL import Image, ImageDraw, ImageFont

        image = Image.new("RGB", (1600, 1000), "white")
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 80)
        ImageDraw.Draw(image).text((160, 200), "OWNER SAMPLE", font=font, fill="black", anchor="lt")
        upload = io.BytesIO()
        image.save(upload, format="PNG")

        text, pages, pdf, regions = run_ocr(upload.getvalue(), ".png", optimize=0)

        self.assertIn("OWNER SAMPLE", text)
        self.assertEqual(len(pages), 1)
        self.assertTrue(pdf.startswith(b"%PDF"))
        owner = next(region for region in regions if "OWNER" in region["text"])
        self.assertAlmostEqual(owner["box"][0] / owner["pageWidth"], 0.1, delta=0.02)
        self.assertAlmostEqual(owner["box"][1] / owner["pageHeight"], 0.2, delta=0.005)


if __name__ == "__main__":
    unittest.main()
