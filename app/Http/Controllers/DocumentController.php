<?php

namespace App\Http\Controllers;

use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\DocumentSearcher;
use App\Services\Documents\UploadDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Request $request, DocumentSearcher $searcher): Response
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
            'field' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(Document::SEARCH_FIELDS))],
            'document' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $field = $validated['field'] ?? 'all';

        if (! is_string($field) || $field === '') {
            $field = 'all';
        }

        $documents = $searcher->paginate($search, $field);

        $selectedDocument = isset($validated['document'])
            ? Document::query()->with(Document::archiveRelations())->whereKey($validated['document'])->first()
            : null;

        return Inertia::render('documents/index', [
            'documents' => $documents,
            'archive' => $this->archivePlacementTree(),
            'filters' => [
                'q' => $search,
                'field' => $field,
            ],
            'searchFields' => Document::searchFieldOptions(),
            'mappingModels' => config('services.ollama.models'),
            'fieldSections' => DocumentFieldDefinitions::reviewSections(),
            'selectedDocument' => $selectedDocument === null ? null : (new DocumentResource($selectedDocument))->resolve(),
        ]);
    }

    public function store(StoreDocumentRequest $request, UploadDocument $upload): RedirectResponse|JsonResponse
    {
        $document = $upload->store($request->validated('file'), $request->integer('book_id'), $request->user(), $request->safe()->except(['file', 'book_id']));

        if ($request->wantsJson()) {
            return response()->json(['id' => $document->id]);
        }

        return to_route('documents.index');
    }

    /**
     * @return list<array{id: string, name: string, drawers: list<array{id: string, label: string, books: list<array{id: string, label: string, kind: string, coverTitle: string}>}>}>
     */
    private function archivePlacementTree(): array
    {
        $archive = [];

        foreach (Cabinet::query()->with('drawers.books')->orderBy('name')->get() as $cabinet) {
            $drawers = [];

            foreach ($cabinet->drawers as $drawer) {
                $books = [];

                foreach ($drawer->books as $book) {
                    $books[] = [
                        'id' => (string) $book->id,
                        'label' => $book->label,
                        'kind' => $book->kind,
                        'coverTitle' => $book->cover_title ?: Book::DEFAULT_COVER_TITLE,
                    ];
                }

                $drawers[] = ['id' => (string) $drawer->id, 'label' => $drawer->label, 'books' => $books];
            }

            $archive[] = ['id' => (string) $cabinet->id, 'name' => $cabinet->name, 'drawers' => $drawers];
        }

        return $archive;
    }
}
