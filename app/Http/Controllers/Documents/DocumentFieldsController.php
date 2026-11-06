<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\SaveDocumentFieldsRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\Documents\DocumentWriter;
use App\Services\Ollama\OllamaClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class DocumentFieldsController extends Controller
{
    public function map(Request $request, Document $document, OllamaClient $client): JsonResponse
    {
        $models = config('services.ollama.models');
        $validated = $request->validate([
            'model' => ['required', 'string', Rule::in(is_array($models) ? $models : [])],
        ]);

        if ($document->ocr_status !== 'completed' || ! is_string($document->ocr_text) || trim($document->ocr_text) === '') {
            throw ValidationException::withMessages([
                'model' => 'OCR text is not ready to map.',
            ]);
        }

        try {
            $fields = $client->mapFields($validated['model'], $document->ocr_text);
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
