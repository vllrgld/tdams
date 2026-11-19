<?php

namespace App\Http\Controllers;

use App\Http\Resources\DocumentResource;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArchiveController extends Controller
{
    public function index(CurrentOffice $currentOffice): Response
    {
        $cabinets = Cabinet::query()
            ->forOffice($currentOffice->id())
            ->with([
                'drawers.books' => fn ($query) => $query->withCount([
                    'documents' => fn (Builder $documents) => $currentOffice->constrain($documents),
                ]),
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

    public function book(Book $book, CurrentOffice $currentOffice): JsonResponse
    {
        $officeId = $currentOffice->id();
        $documents = $book->documents()
            ->with(Document::archiveRelations());

        if ($officeId !== null) {
            $documents->forOffice($officeId);
        }

        $documents = $documents
            ->get()
            ->map(fn (Document $document): array => (new DocumentResource($document))->resolve())
            ->values()
            ->all();

        return response()->json([
            'documents' => $documents,
        ]);
    }

    public function locate(Request $request, CurrentOffice $currentOffice): JsonResponse
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

        $documentQuery = Document::query()
            ->with(['book.drawer', ...Document::archiveRelations()]);
        $currentOffice->constrain($documentQuery);
        $document = $documentQuery
            ->whereNotNull('book_id')
            ->whereHas('book', fn (Builder $books) => $books->forOffice($currentOffice->id()))
            ->whereHas('taxDeclaration', function ($query) use ($number): void {
                $query->whereRaw('LOWER(tax_declaration_number) = ?', [mb_strtolower($number)]);
            })
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
            'document' => (new DocumentResource($document))->resolve(),
            'cabinetId' => (string) $drawer->cabinet_id,
            'drawerId' => (string) $drawer->id,
            'bookId' => (string) $book->id,
        ]);
    }
}
