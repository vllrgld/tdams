<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\LinkDocumentRequest;
use App\Models\Document;
use App\Services\Documents\DeclarationChain;
use App\Services\Documents\DocumentWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DocumentLinkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:100'],
            'exclude' => ['nullable', 'integer', 'exists:documents,id'],
        ]);

        $term = '%'.addcslashes(mb_strtolower($validated['q']), '%_\\').'%';

        $documents = Document::query()
            ->with(Document::archiveRelations())
            ->whereHas('taxDeclaration', function ($query) use ($term): void {
                $query->whereNotNull('tax_declaration_number')
                    ->where('tax_declaration_number', '!=', '')
                    ->whereRaw('LOWER(tax_declaration_number) LIKE ?', [$term]);
            })
            ->when(
                isset($validated['exclude']),
                fn ($query) => $query->where('id', '!=', (int) $validated['exclude']),
            )
            ->latest('id')
            ->limit(15)
            ->get();

        return response()->json($documents->map(fn (Document $document): array => [
            'id' => $document->id,
            'taxDeclarationNumber' => $document->tax_declaration_number,
            'registeredOwner' => $document->registered_owner,
            'lotNumber' => $document->lot_number,
            'municipality' => $document->municipality,
            'declarationDate' => $document->declaration_date?->toDateString(),
            'createdAt' => $document->created_at?->toIso8601String(),
        ])->values());
    }

    public function history(Document $document, DeclarationChain $chain): JsonResponse
    {
        return response()->json($chain->previous($document));
    }

    public function show(Document $document, DeclarationChain $chain): JsonResponse
    {
        return response()->json($chain->full($document));
    }

    public function update(LinkDocumentRequest $request, Document $document, DocumentWriter $writer): RedirectResponse
    {
        $writer->linkPrevious($document, $request->validated());

        return to_route('documents.index');
    }
}
