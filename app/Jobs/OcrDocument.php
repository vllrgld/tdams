<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\OcrSetting;
use App\Services\Ocr\LocalThumbnailClient;
use App\Services\Ocr\OcrManager;
use App\Services\Ocr\OcrPdfOptimizer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class OcrDocument implements ShouldQueue
{
    use Queueable;

    public int $timeout = 360;

    public int $tries = 1;

    public function __construct(public int $documentId) {}

    public function handle(OcrManager $manager, OcrPdfOptimizer $pdfOptimizer, LocalThumbnailClient $thumbnails): void
    {
        $document = Document::query()->find($this->documentId);

        if ($document === null) {
            return;
        }

        $document->forceFill([
            'ocr_status' => 'processing',
            'ocr_error' => null,
        ])->save();

        try {
            $contents = Storage::disk('local')->get($document->storage_path);

            if (! is_string($contents)) {
                throw new RuntimeException('The stored document could not be read.');
            }

            if ($document->mime_type === 'application/pdf') {
                $this->renderThumbnail($document, $thumbnails, $contents, $document->original_filename);
            }

            $setting = OcrSetting::current();
            $result = $manager->extractor($setting)->extract(
                $contents,
                $document->original_filename,
            );

            $pdfPath = $document->ocr_pdf_path;
            $pdfSize = $document->ocr_pdf_size;

            try {
                $pdf = $pdfOptimizer->optimize($contents, $document->original_filename, $setting->optimize);
                $pdfPath = $this->storePreviewPdf($document, $pdf);
                $pdfSize = strlen($pdf);

                if ($document->mime_type !== 'application/pdf') {
                    $name = pathinfo($document->original_filename, PATHINFO_FILENAME);
                    $this->renderThumbnail($document, $thumbnails, $pdf, ($name !== '' ? $name : 'document').'.pdf');
                }
            } catch (Throwable $exception) {
                Log::warning('Document preview PDF could not be compressed.', [
                    'document_id' => $document->id,
                    'message' => $exception->getMessage(),
                ]);
            }

            Document::withoutSyncingToSearch(function () use ($document, $result, $pdfPath, $pdfSize): void {
                $document->forceFill([
                    'ocr_status' => 'completed',
                    'ocr_text' => $result['text'],
                    'ocr_pages' => $result['pages'],
                    'ocr_regions' => $result['regions'] === [] ? null : $result['regions'],
                    'ocr_pdf_path' => $pdfPath,
                    'ocr_pdf_size' => $pdfSize,
                    'ocr_error' => null,
                    'ocr_completed_at' => now(),
                ])->save();
            });

            try {
                $document->searchable();
            } catch (Throwable $exception) {
                Log::warning('Document search index update failed.', [
                    'document_id' => $document->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        } catch (Throwable $exception) {
            $document->forceFill([
                'ocr_status' => 'failed',
                'ocr_error' => mb_substr($exception->getMessage(), 0, 500),
                'ocr_completed_at' => null,
            ])->save();

            Log::warning('Document OCR failed.', [
                'document_id' => $document->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function storePreviewPdf(Document $document, string $pdf): string
    {
        $previousPath = $document->ocr_pdf_path;

        $path = 'documents/ocr/'.$document->id.'.pdf';
        $stored = Storage::disk('local')->put($path, $pdf);

        if ($stored !== true) {
            throw new RuntimeException('The preview PDF could not be saved.');
        }

        if (is_string($previousPath) && $previousPath !== '' && $previousPath !== $path) {
            Storage::disk('local')->delete($previousPath);
        }

        return $path;
    }

    private function renderThumbnail(Document $document, LocalThumbnailClient $thumbnails, string $contents, string $filename): void
    {
        try {
            $jpeg = $thumbnails->render($contents, $filename);
            $this->storeThumbnail($document, $jpeg);
        } catch (Throwable $exception) {
            Log::warning('Document thumbnail could not be rendered.', [
                'document_id' => $document->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function storeThumbnail(Document $document, string $jpeg): void
    {
        $path = 'documents/thumbnails/'.$document->id.'.jpg';
        $stored = Storage::disk('local')->put($path, $jpeg);

        if ($stored !== true) {
            throw new RuntimeException('The document thumbnail could not be saved.');
        }

        $document->forceFill([
            'thumbnail_path' => $path,
        ])->save();
    }
}
