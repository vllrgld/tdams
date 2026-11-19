<?php

namespace App\Services\Documents;

use App\Jobs\OcrDocument;
use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Throwable;

class DocumentOcrDispatcher
{
    public function __construct(private DocumentAuditRecorder $audit) {}

    public function dispatch(int $documentId): void
    {
        DB::afterCommit(function () use ($documentId): void {
            try {
                OcrDocument::dispatch($documentId);
            } catch (Throwable $exception) {
                (new OcrDocument($documentId))->failed($exception);
            }
        });
    }

    public function retry(Document $document): Document
    {
        DB::transaction(function () use ($document): void {
            $lockedDocument = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($lockedDocument->ocr_status !== 'failed') {
                return;
            }

            $lockedDocument->forceFill([
                'ocr_status' => 'pending',
                'ocr_error' => null,
                'ocr_completed_at' => null,
                'ocr_reviewed_at' => null,
                'ocr_reviewed_by' => null,
            ])->saveQuietly();

            $this->audit->record($lockedDocument, 'ocr_retried', ['ocr_status' => ['before' => 'failed', 'after' => 'pending']]);

            $this->dispatch($lockedDocument->id);
        });

        return $document->refresh();
    }
}
