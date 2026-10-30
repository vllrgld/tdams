<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);
        $query = trim((string) ($validated['q'] ?? ''));

        if (mb_strlen($query) < 2) {
            return response()->json(['data' => [], 'hasMore' => false]);
        }

        $matches = Document::query()
            ->select(['id', 'book_id', 'tax_declaration_id', 'original_filename'])
            ->with([...Document::archiveRelations(), 'book.drawer.cabinet'])
            ->search($query)
            ->latest('id')
            ->limit(9)
            ->get();

        return response()->json([
            'data' => $matches->take(8)->map(function (Document $document): array {
                $book = $document->book;
                $drawer = $book?->drawer;
                $cabinet = $drawer?->cabinet;

                return [
                    'id' => $document->id,
                    'title' => $document->tax_declaration_number ?: $document->original_filename,
                    'owner' => $document->registered_owner,
                    'propertyLocation' => implode(', ', array_filter([
                        $document->barangay,
                        $document->municipality,
                    ])),
                    'url' => route('documents.index', ['document' => $document->id], absolute: false),
                    'location' => $cabinet ? [
                        'cabinet' => $cabinet->name,
                        'drawer' => $drawer->label,
                        'book' => $book->label,
                        'url' => route('archive.index', [
                            'cabinet' => $cabinet->id,
                            'drawer' => $drawer->id,
                            'book' => $book->id,
                        ], absolute: false),
                    ] : null,
                ];
            })->values(),
            'hasMore' => $matches->count() > 8,
        ]);
    }
}
