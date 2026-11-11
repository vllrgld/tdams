<?php

namespace App\Http\Controllers;

use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\DocumentFieldMapper;
use App\Services\Documents\DocumentSearcher;
use App\Services\Documents\DocumentUploadOptions;
use App\Services\Documents\UploadDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Request $request, DocumentSearcher $searcher, DocumentUploadOptions $uploadOptions, DocumentFieldMapper $mapper): Response
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
            'field' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(Document::SEARCH_FIELDS))],
            'document' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'sort' => ['sometimes', 'nullable', 'string', Rule::in(['created_at', 'declaration_date'])],
            'direction' => ['sometimes', 'nullable', 'string', Rule::in(['asc', 'desc'])],
            'ocr_review' => ['sometimes', 'nullable', 'string', Rule::in(['all', 'reviewed', 'unreviewed'])],
            'declaration_date_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'declaration_date_to' => [
                'sometimes', 'nullable', 'date_format:Y-m-d',
                Rule::when($request->filled('declaration_date_from'), ['after_or_equal:declaration_date_from']),
            ],
            'date_added_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'date_added_to' => [
                'sometimes', 'nullable', 'date_format:Y-m-d',
                Rule::when($request->filled('date_added_from'), ['after_or_equal:date_added_from']),
            ],
            'date_timezone' => ['sometimes', 'nullable', 'string', 'timezone'],
        ], [
            'sort.in' => 'Choose date added or declaration date.',
            'ocr_review.in' => 'Choose all documents, reviewed, or not reviewed.',
            'ocr_review.string' => 'Choose all documents, reviewed, or not reviewed.',
            'sort.string' => 'Choose date added or declaration date.',
            'direction.in' => 'Choose ascending or descending order.',
            'direction.string' => 'Choose ascending or descending order.',
            'declaration_date_from.date_format' => 'Enter a valid declaration start date in YYYY-MM-DD format.',
            'declaration_date_to.date_format' => 'Enter a valid declaration end date in YYYY-MM-DD format.',
            'declaration_date_to.after_or_equal' => 'The end date must be on or after the start date.',
            'date_added_from.date_format' => 'Enter a valid date added start date in YYYY-MM-DD format.',
            'date_added_to.date_format' => 'Enter a valid date added end date in YYYY-MM-DD format.',
            'date_added_to.after_or_equal' => 'The date added end date must be on or after the start date.',
            'date_timezone.timezone' => 'Choose a valid timezone for the date added filter.',
            'date_timezone.string' => 'Choose a valid timezone for the date added filter.',
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $field = $validated['field'] ?? 'all';

        if (! is_string($field) || $field === '') {
            $field = 'all';
        }

        $dateFrom = (string) ($validated['declaration_date_from'] ?? '');
        $dateTo = (string) ($validated['declaration_date_to'] ?? '');
        $addedFrom = (string) ($validated['date_added_from'] ?? '');
        $addedTo = (string) ($validated['date_added_to'] ?? '');
        $dateTimezone = (string) ($validated['date_timezone'] ?? 'UTC');
        $direction = (string) ($validated['direction'] ?? 'desc');
        $sort = (string) ($validated['sort'] ?? 'created_at');
        $ocrReview = (string) ($validated['ocr_review'] ?? 'all');
        $documents = $searcher->paginate(
            $search, $field, dateFrom: $dateFrom, dateTo: $dateTo,
            addedFrom: $addedFrom, addedTo: $addedTo, dateTimezone: $dateTimezone,
            sort: $sort, direction: $direction, ocrReview: $ocrReview,
        );

        $selectedDocument = isset($validated['document'])
            ? Document::query()->with(Document::archiveRelations())->whereKey($validated['document'])->first()
            : null;

        return Inertia::render('documents/index', [
            'documents' => $documents,
            'archive' => fn (): array => $uploadOptions->archivePlacementTree(),
            'filters' => [
                'q' => $search,
                'field' => $field,
                'direction' => $direction,
                'sort' => $sort,
                'ocr_review' => $ocrReview,
                'declaration_date_from' => $dateFrom,
                'declaration_date_to' => $dateTo,
                'date_added_from' => $addedFrom,
                'date_added_to' => $addedTo,
                'date_timezone' => $dateTimezone,
            ],
            'searchFields' => Document::searchFieldOptions(),
            'mappingModels' => $mapper->models(),
            'fieldSections' => DocumentFieldDefinitions::reviewSections(),
            'selectedDocument' => $selectedDocument === null ? null : (new DocumentResource($selectedDocument))->resolve(),
        ]);
    }

    public function uploadOptions(DocumentUploadOptions $uploadOptions, DocumentFieldMapper $mapper): JsonResponse
    {
        return response()->json([
            'archive' => $uploadOptions->archivePlacementTree(),
            'mappingModels' => $mapper->models(),
            'fieldSections' => DocumentFieldDefinitions::reviewSections(),
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
}
