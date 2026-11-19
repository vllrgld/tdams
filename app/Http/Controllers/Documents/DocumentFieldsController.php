<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\SaveDocumentFieldsRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\Documents\DocumentAuditRecorder;
use App\Services\Documents\DocumentFieldMapper;
use App\Services\Documents\DocumentFieldSchema;
use App\Services\Documents\DocumentWriter;
use App\Services\Ocr\OcrContentParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class DocumentFieldsController extends Controller
{
    public function map(Request $request, Document $document, DocumentFieldMapper $mapper, OcrContentParser $parser, DocumentAuditRecorder $audit): JsonResponse
    {
        $validated = $request->validate([
            'model' => ['required', 'string', Rule::in($mapper->models())],
            'tax_fields' => ['sometimes', 'boolean'],
        ]);

        $fields = $this->mappedFields($document, $validated['model'], $mapper, $parser, $audit, $validated['tax_fields'] ?? null);
        $suggestions = DocumentFieldSchema::normalizeTitleSuggestions($fields[DocumentFieldSchema::TITLE_SUGGESTIONS] ?? null);
        unset($fields[DocumentFieldSchema::TITLE_SUGGESTIONS]);

        return response()->json([
            'fields' => $fields,
            'titleSuggestions' => $suggestions,
        ]);
    }

    public function suggestTitles(Request $request, Document $document, DocumentFieldMapper $mapper, OcrContentParser $parser, DocumentAuditRecorder $audit): JsonResponse
    {
        $validated = $request->validate([
            'model' => ['required', 'string', Rule::in($mapper->models())],
            'tax_fields' => ['sometimes', 'boolean'],
        ]);

        if ($validated['tax_fields'] ?? ($document->document_type_id !== null && $document->usesTaxDeclarationFields())) {
            throw ValidationException::withMessages(['title' => 'AI title suggestions are available for non-tax documents.']);
        }

        $fields = $this->mappedFields($document, $validated['model'], $mapper, $parser, $audit, false);
        $suggestions = DocumentFieldSchema::normalizeTitleSuggestions($fields[DocumentFieldSchema::TITLE_SUGGESTIONS] ?? null);

        if (count($suggestions) !== 2) {
            throw ValidationException::withMessages(['title' => 'Two distinct title suggestions could not be generated. Try again.']);
        }

        return response()->json(['titleSuggestions' => $suggestions]);
    }

    /** @return array<string, mixed> */
    private function mappedFields(Document $document, string $model, DocumentFieldMapper $mapper, OcrContentParser $parser, DocumentAuditRecorder $audit, ?bool $taxFields = null): array
    {

        if ($document->ocr_status !== 'completed' || ! is_string($document->ocr_text) || trim($document->ocr_text) === '') {
            throw ValidationException::withMessages([
                'model' => 'OCR text is not ready to map.',
            ]);
        }

        try {
            $fields = $mapper->mapFields(
                $model,
                $parser->mappingText($document->ocr_text, $document->ocr_regions),
                $taxFields ?? $document->usesTaxDeclarationFields(),
            );
        } catch (RuntimeException $exception) {
            $audit->record($document, 'mapping_failed', context: ['model' => $model]);
            throw ValidationException::withMessages([
                'model' => $exception->getMessage(),
            ]);
        }

        $audit->record($document, 'mapping_generated', context: [
            'model' => $model,
            'suggestedFields' => array_keys(array_filter($fields, fn (mixed $value): bool => $value !== null && $value !== '' && $value !== [])),
        ]);

        return $fields;
    }

    public function update(SaveDocumentFieldsRequest $request, Document $document, DocumentWriter $writer): JsonResponse
    {
        $document = $writer->updateFields($document, $request->validated());

        return response()->json([
            'document' => (new DocumentResource($document))->resolve(),
        ]);
    }
}
