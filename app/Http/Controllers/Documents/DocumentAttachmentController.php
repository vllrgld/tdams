<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Services\Documents\DocumentAttachments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentAttachmentController extends Controller
{
    public function store(Request $request, Document $document, DocumentAttachments $attachments): JsonResponse
    {
        $this->ensureMetadataDocument($document);
        $this->normalizeInput($request);

        $validated = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1', 'max:9999'],
        ]);

        $document = $attachments->store($document, $validated);

        return response()->json([
            'document' => (new DocumentResource($document))->resolve(),
        ]);
    }

    public function update(Request $request, Document $document, DocumentAttachment $attachment, DocumentAttachments $attachments): JsonResponse
    {
        $this->ensureMetadataDocument($document);
        abort_unless($attachment->document_id === $document->id, 404);
        $this->normalizeInput($request);

        $validated = $request->validate([
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:9999'],
        ]);

        $document = $attachments->update($document, $attachment, $validated);

        return response()->json([
            'document' => (new DocumentResource($document))->resolve(),
        ]);
    }

    public function destroy(Document $document, DocumentAttachment $attachment, DocumentAttachments $attachments): JsonResponse
    {
        $this->ensureMetadataDocument($document);
        abort_unless($attachment->document_id === $document->id, 404);

        $document = $attachments->destroy($document, $attachment);

        return response()->json([
            'document' => (new DocumentResource($document))->resolve(),
        ]);
    }

    private function ensureMetadataDocument(Document $document): void
    {
        abort_if($document->document_type_id !== null && $document->usesTaxDeclarationFields(), 404);
    }

    private function normalizeInput(Request $request): void
    {
        if ($request->exists('description') && is_string($request->input('description'))) {
            $request->merge([
                'description' => trim($request->input('description')),
            ]);
        }

        if ($request->exists('page') && ! $request->filled('page')) {
            $request->merge(['page' => null]);
        }
    }
}
