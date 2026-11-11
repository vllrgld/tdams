<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\Documents\DocumentOcrDispatcher;
use App\Services\Documents\DocumentOcrEditor;
use App\Services\Ocr\OcrContentParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentOcrController extends Controller
{
    public function review(Request $request, Document $document, DocumentOcrEditor $editor, OcrContentParser $parser): JsonResponse
    {
        $validated = $request->validate([
            'reviewed' => ['required', 'boolean'],
            'revision' => ['required', 'string', 'size:64'],
        ]);

        return $this->show($editor->review($document, (bool) $validated['reviewed'], (int) $request->user()->getAuthIdentifier(), $validated['revision']), $parser);
    }

    public function update(Request $request, Document $document, int $region, DocumentOcrEditor $editor, OcrContentParser $parser): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:20000', 'not_regex:/\f/'],
            'revision' => ['required', 'string', 'size:64'],
        ]);

        return $this->show($editor->correct($document, $region, $validated['text'], $validated['revision']), $parser);
    }

    public function retry(Document $document, DocumentOcrDispatcher $dispatcher, OcrContentParser $parser): JsonResponse
    {
        return $this->show($dispatcher->retry($document), $parser);
    }

    public function show(Document $document, OcrContentParser $parser): JsonResponse
    {
        return response()->json([
            'revision' => DocumentOcrEditor::revision($document),
            'status' => $document->ocr_status,
            'reviewedAt' => $document->ocr_status === 'completed' ? $document->ocr_reviewed_at?->toIso8601String() : null,
            'regions' => $parser->regions($document->ocr_regions),
            'text' => $document->ocr_text,
            'pageContents' => $parser->pageContents($document->ocr_text, $document->ocr_regions),
            'error' => $document->ocr_error,
            'completedAt' => $document->ocr_completed_at?->toIso8601String(),
            'pdfUrl' => $document->previewUrl(),
            'mimeType' => $document->mime_type,
        ]);
    }
}
