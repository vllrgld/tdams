<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\SaveDocumentFieldsRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\Documents\DocumentFieldMapper;
use App\Services\Documents\DocumentWriter;
use App\Services\Ocr\OcrContentParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class DocumentFieldsController extends Controller
{
    public function map(Request $request, Document $document, DocumentFieldMapper $mapper, OcrContentParser $parser): JsonResponse
    {
        $validated = $request->validate([
            'model' => ['required', 'string', Rule::in($mapper->models())],
        ]);

        if ($document->ocr_status !== 'completed' || ! is_string($document->ocr_text) || trim($document->ocr_text) === '') {
            throw ValidationException::withMessages([
                'model' => 'OCR text is not ready to map.',
            ]);
        }

        try {
            $fields = $mapper->mapFields($validated['model'], $parser->mappingText($document->ocr_text, $document->ocr_regions));
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'model' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'fields' => $fields,
        ]);
    }

    public function update(SaveDocumentFieldsRequest $request, Document $document, DocumentWriter $writer): JsonResponse
    {
        $document = $writer->updateFields($document, $request->validated());

        return response()->json([
            'document' => (new DocumentResource($document))->resolve(),
        ]);
    }
}
