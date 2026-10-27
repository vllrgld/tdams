import asyncio
import base64
import os
import re
import tempfile
from pathlib import Path

import ocrmypdf
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from pdfminer.high_level import extract_text
from pdfminer.pdfpage import PDFPage

app = FastAPI()

ALLOWED_SUFFIXES = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}
SKIPPED_PAGE = re.compile(r"^\[OCR skipped on page\(s\) .+\]$")


def pages_from_sidecar(text: str) -> list[str]:
    if text == "":
        return []

    pages = text.split("\f")

    if pages[-1] == "":
        pages.pop()

    return pages


def page_has_text(text: str) -> bool:
    stripped = text.strip()

    return stripped != "" and SKIPPED_PAGE.match(stripped) is None and "".join(stripped.split()) != ""


def embedded_page_texts(path: Path) -> list[str]:
    with path.open("rb") as handle:
        page_count = sum(1 for _ in PDFPage.get_pages(handle))

    return [extract_text(path, page_numbers=[index]).strip() for index in range(page_count)]


def merge_skipped_pages(pages: list[str], embedded: list[str]) -> list[str]:
    merged: list[str] = []
    count = max(len(pages), len(embedded))

    for index in range(count):
        recognized = pages[index].strip() if index < len(pages) else ""
        existing = embedded[index].strip() if index < len(embedded) else ""

        if page_has_text(recognized):
            merged.append(recognized)
        elif page_has_text(existing):
            merged.append(existing)
        else:
            merged.append(recognized)

    return merged


def require_token(authorization: str | None) -> None:
    expected = os.environ.get("OCR_API_TOKEN", "")

    if expected == "" or authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def run_ocr(data: bytes, suffix: str, optimize: int = 3) -> tuple[str, list[str], bytes]:
    with tempfile.TemporaryDirectory() as temporary:
        source = Path(temporary) / f"input{suffix}"
        output = Path(temporary) / "output.pdf"
        sidecar = Path(temporary) / "sidecar.txt"
        source.write_bytes(data)
        embedded: list[str] = []

        if suffix == ".pdf":
            try:
                embedded = embedded_page_texts(source)
            except Exception:
                embedded = []

        options: dict[str, object] = {
            "sidecar": sidecar,
            "skip_text": True,
            "progress_bar": False,
            "language": "eng",
            "jobs": 1,
            "optimize": optimize,
        }

        if suffix != ".pdf":
            options["image_dpi"] = 300

        exit_code = ocrmypdf.ocr(source, output, **options)

        if exit_code != ocrmypdf.ExitCode.ok:
            raise RuntimeError(f"OCRmyPDF failed with exit code {int(exit_code)}")

        if not output.exists():
            raise RuntimeError("OCRmyPDF did not produce a PDF.")

        text = sidecar.read_text(encoding="utf-8", errors="replace") if sidecar.exists() else ""
        pages = merge_skipped_pages(pages_from_sidecar(text), embedded)

        return "\f".join(pages), pages, output.read_bytes()


def run_optimize(data: bytes, suffix: str, optimize: int = 3) -> bytes:
    with tempfile.TemporaryDirectory() as temporary:
        source = Path(temporary) / f"input{suffix}"
        output = Path(temporary) / "output.pdf"
        source.write_bytes(data)
        options: dict[str, object] = {
            "tesseract_timeout": 0,
            "skip_text": True,
            "progress_bar": False,
            "jobs": 1,
            "optimize": optimize,
        }

        if suffix != ".pdf":
            options["image_dpi"] = 300

        exit_code = ocrmypdf.ocr(source, output, **options)

        if exit_code != ocrmypdf.ExitCode.ok:
            raise RuntimeError(f"OCRmyPDF failed with exit code {int(exit_code)}")

        if not output.exists():
            raise RuntimeError("OCRmyPDF did not produce a PDF.")

        return output.read_bytes()


async def read_upload(file: UploadFile, optimize: int) -> tuple[bytes, str, int]:
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    if optimize not in (0, 1, 2, 3):
        raise HTTPException(status_code=422, detail="Compression level must be 0, 1, 2, or 3.")

    data = await file.read()

    if data == b"":
        raise HTTPException(status_code=422, detail="The uploaded file is empty")

    return data, suffix, optimize


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/ocr")
async def ocr(
    file: UploadFile = File(...),
    optimize: int = Form(3),
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    require_token(authorization)
    data, suffix, optimize = await read_upload(file, optimize)

    try:
        text, pages, pdf = await asyncio.to_thread(run_ocr, data, suffix, optimize)
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception)) from exception

    return {
        "text": text,
        "pages": pages,
        "page_count": len(pages),
        "pdf_base64": base64.b64encode(pdf).decode("ascii") if pdf else None,
    }


@app.post("/v1/pdf")
async def optimize_pdf(
    file: UploadFile = File(...),
    optimize: int = Form(3),
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    require_token(authorization)
    data, suffix, optimize = await read_upload(file, optimize)

    try:
        pdf_bytes = await asyncio.to_thread(run_optimize, data, suffix, optimize)
    except Exception as exception:
        raise HTTPException(status_code=500, detail=str(exception)) from exception

    return {
        "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
    }
