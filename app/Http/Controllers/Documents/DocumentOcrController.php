<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\Documents\DocumentOcrDispatcher;
use Illuminate\Http\JsonResponse;

class DocumentOcrController extends Controller
{
    public function retry(Document $document, DocumentOcrDispatcher $dispatcher): JsonResponse
    {
        return $this->show($dispatcher->retry($document));
    }

    public function show(Document $document): JsonResponse
    {
        return response()->json([
            'status' => $document->ocr_status,
            'regions' => $document->ocr_regions ?? [],
            'text' => $document->ocr_text,
            'error' => $document->ocr_error,
            'completedAt' => $document->ocr_completed_at?->toIso8601String(),
            'pdfUrl' => $document->previewUrl(),
            'mimeType' => $document->mime_type,
        ]);
    }
}
