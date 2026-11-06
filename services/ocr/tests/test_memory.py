import asyncio
import io
import os
import threading
import unittest
from unittest.mock import patch

from fastapi import HTTPException, UploadFile

from app.main import ocr, optimize_pdf, process_upload, read_upload, thumbnail


def upload(data=b"pdf", filename="scan.pdf", size=None):
    return UploadFile(file=io.BytesIO(data), filename=filename, size=size)


class UploadMemoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_reads_in_bounded_chunks_and_accepts_exact_limit(self):
        file = upload(b"x" * 16)
        with patch("app.main.MAX_UPLOAD_BYTES", 16), \
                patch("app.main.UPLOAD_CHUNK_BYTES", 4), \
                patch.object(file, "read", wraps=file.read) as read:
            data, suffix, optimize = await read_upload(file, 2)

        self.assertEqual((data, suffix, optimize), (b"x" * 16, ".pdf", 2))
        self.assertTrue(all(0 < call.args[0] <= 4 for call in read.call_args_list))
        self.assertTrue(file.file.closed)

    async def test_rejects_oversized_upload_without_size_metadata(self):
        file = upload(b"x" * 17)
        with patch("app.main.MAX_UPLOAD_BYTES", 16), \
                patch("app.main.UPLOAD_CHUNK_BYTES", 4):
            with self.assertRaises(HTTPException) as error:
                await read_upload(file, 0)

        self.assertEqual(error.exception.status_code, 413)
        self.assertTrue(file.file.closed)

    async def test_rejects_known_oversized_upload_before_reading_it(self):
        file = upload(size=17)
        with patch("app.main.MAX_UPLOAD_BYTES", 16), \
                patch.object(file, "read", wraps=file.read) as read:
            with self.assertRaises(HTTPException) as error:
                await read_upload(file, 0)

        self.assertEqual(error.exception.status_code, 413)
        read.assert_not_called()
        self.assertTrue(file.file.closed)

    async def test_invalid_upload_releases_slot_for_next_request(self):
        with self.assertRaises(HTTPException) as error:
            await process_upload(upload(b""), 0, lambda *args: "unused")

        self.assertEqual(error.exception.status_code, 422)
        result = await process_upload(upload(), 0, lambda *args: "processed")
        self.assertEqual(result, "processed")

    async def test_failed_processor_releases_slot_for_next_request(self):
        def fail(*args):
            raise RuntimeError("Processing failed")

        with self.assertRaises(HTTPException) as error:
            await process_upload(upload(), 0, fail)

        self.assertEqual(error.exception.status_code, 500)
        result = await process_upload(upload(), 0, lambda *args: "processed")
        self.assertEqual(result, "processed")

    async def test_all_processing_endpoints_share_the_busy_limit(self):
        started = asyncio.Event()
        release = threading.Event()
        loop = asyncio.get_running_loop()

        def process(*args):
            loop.call_soon_threadsafe(started.set)
            release.wait(timeout=5)
            return "processed"

        request = asyncio.create_task(process_upload(upload(), 0, process))
        try:
            await asyncio.wait_for(started.wait(), 5)
            with patch.dict(os.environ, {"OCR_API_TOKEN": "test"}):
                for endpoint in (ocr, optimize_pdf, thumbnail):
                    with self.subTest(endpoint=endpoint.__name__):
                        file = upload()
                        arguments = {"file": file, "authorization": "Bearer test"}
                        if endpoint is not thumbnail:
                            arguments["optimize"] = 0
                        with self.assertRaises(HTTPException) as error:
                            await endpoint(**arguments)
                        self.assertEqual(error.exception.status_code, 503)
                        self.assertTrue(file.file.closed)
        finally:
            release.set()
            await request

    async def test_cancelled_request_keeps_slot_until_thread_finishes(self):
        started = asyncio.Event()
        finished = asyncio.Event()
        release = threading.Event()
        loop = asyncio.get_running_loop()

        def process(*args):
            loop.call_soon_threadsafe(started.set)
            release.wait(timeout=5)
            loop.call_soon_threadsafe(finished.set)
            return "processed"

        request = asyncio.create_task(process_upload(upload(), 0, process))
        try:
            await asyncio.wait_for(started.wait(), 5)
            request.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await request

            waiting = upload()
            with self.assertRaises(HTTPException) as error:
                await process_upload(waiting, 0, lambda *args: "overlap")
            self.assertEqual(error.exception.status_code, 503)
            self.assertEqual(error.exception.headers, {"Retry-After": "2"})
            self.assertTrue(waiting.file.closed)
        finally:
            release.set()
            await asyncio.wait_for(finished.wait(), 5)
            from app.main import processing_tasks
            await asyncio.gather(*processing_tasks)

        result = await process_upload(upload(), 0, lambda *args: "next")
        self.assertEqual(result, "next")


if __name__ == "__main__":
    unittest.main()
