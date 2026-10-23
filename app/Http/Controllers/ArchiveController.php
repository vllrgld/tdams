<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArchiveController extends Controller
{
    public function index(): Response
    {
        $cabinets = Cabinet::query()
            ->with([
                'drawers.books' => fn ($query) => $query->withCount('documents'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Cabinet $cabinet): array => $cabinet->toFilingArray())
            ->values()
            ->all();

        return Inertia::render('archive/index', [
            'cabinets' => $cabinets,
        ]);
    }

    public function book(Book $book): JsonResponse
    {
        $documents = $book->documents
            ->map(fn (Document $document): array => $document->toArchiveArray())
            ->values()
            ->all();

        return response()->json([
            'documents' => $documents,
        ]);
    }

    public function locate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'number' => ['required', 'string', 'max:100'],
        ]);

        $number = trim($validated['number']);

        if ($number === '') {
            return response()->json([
                'document' => null,
            ]);
        }

        $document = Document::query()
            ->with(['book.drawer'])
            ->whereNotNull('book_id')
            ->whereRaw('LOWER(tax_declaration_number) = ?', [mb_strtolower($number)])
            ->latest('id')
            ->first();

        $book = $document?->book;
        $drawer = $book?->drawer;

        if ($document === null || $book === null || $drawer === null) {
            return response()->json([
                'document' => null,
            ]);
        }

        return response()->json([
            'document' => $document->toArchiveArray(),
            'cabinetId' => (string) $drawer->cabinet_id,
            'drawerId' => (string) $drawer->id,
            'bookId' => (string) $book->id,
        ]);
    }
}
