<?php

namespace App\Http\Controllers;

use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentType;
use App\Services\Documents\DeleteDocument;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\DocumentFieldMapper;
use App\Services\Documents\DocumentSearcher;
use App\Services\Documents\DocumentUploadOptions;
use App\Services\Documents\SharedDocumentFields;
use App\Services\Documents\UploadDocument;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function destroy(Document $document, DeleteDocument $delete): JsonResponse
    {
        return response()->json(['cleanupPending' => ! $delete->handle($document)]);
    }

    public function index(Request $request, DocumentSearcher $searcher, DocumentUploadOptions $uploadOptions, DocumentFieldMapper $mapper, CurrentOffice $currentOffice): Response
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
            'field' => ['sometimes', 'nullable', 'string', Rule::in(array_keys([...Document::SEARCH_FIELDS, ...Document::OTHER_SEARCH_FIELDS]))],
            'document' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'sort' => ['sometimes', 'nullable', 'string', Rule::in(['created_at', 'declaration_date'])],
            'direction' => ['sometimes', 'nullable', 'string', Rule::in(['asc', 'desc'])],
            'ocr_review' => ['sometimes', 'nullable', 'string', Rule::in(['all', 'reviewed', 'unreviewed'])],
            'status' => ['sometimes', 'nullable', 'string', Rule::in(['all', ...array_keys(Document::STATUS_LABELS)])],
            'search_mode' => ['sometimes', 'nullable', 'string', Rule::in(['all', 'tax'])],
            'type' => [
                'sometimes',
                'nullable',
                Rule::when(
                    fn (): bool => $request->filled('type') && $request->input('type') !== 'all',
                    ['integer', Rule::exists('document_types', 'id')],
                ),
            ],
            'declaration_date_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'date_field' => ['sometimes', 'nullable', 'string', Rule::in(['letter_date', 'declaration_date'])],
            'letter_date_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'letter_date_to' => [
                'sometimes', 'nullable', 'date_format:Y-m-d',
                Rule::when($request->filled('letter_date_from'), ['after_or_equal:letter_date_from']),
            ],
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
            'status.in' => 'Choose an available document status.',
            'status.string' => 'Choose an available document status.',
            'search_mode.in' => 'Choose all or tax search fields.',
            'search_mode.string' => 'Choose all or tax search fields.',
            'type.integer' => 'Choose a document type.',
            'type.exists' => 'Choose a document type.',
            'sort.string' => 'Choose date added or declaration date.',
            'direction.in' => 'Choose ascending or descending order.',
            'direction.string' => 'Choose ascending or descending order.',
            'declaration_date_from.date_format' => 'Enter a valid declaration start date in YYYY-MM-DD format.',
            'date_field.in' => 'Choose Date of Letter or Declaration date.',
            'date_field.string' => 'Choose Date of Letter or Declaration date.',
            'letter_date_from.date_format' => 'Enter a valid letter start date in YYYY-MM-DD format.',
            'letter_date_to.date_format' => 'Enter a valid letter end date in YYYY-MM-DD format.',
            'letter_date_to.after_or_equal' => 'The end date must be on or after the start date.',
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

        $dateField = (string) ($validated['date_field'] ?? (
            $request->filled('declaration_date_from') || $request->filled('declaration_date_to')
                ? 'declaration_date' : 'letter_date'
        ));
        $declarationFrom = $dateField === 'declaration_date' ? (string) ($validated['declaration_date_from'] ?? '') : '';
        $declarationTo = $dateField === 'declaration_date' ? (string) ($validated['declaration_date_to'] ?? '') : '';
        $letterFrom = $dateField === 'letter_date' ? (string) ($validated['letter_date_from'] ?? '') : '';
        $letterTo = $dateField === 'letter_date' ? (string) ($validated['letter_date_to'] ?? '') : '';
        $dateFrom = $dateField === 'declaration_date' ? $declarationFrom : $letterFrom;
        $dateTo = $dateField === 'declaration_date' ? $declarationTo : $letterTo;
        $addedFrom = (string) ($validated['date_added_from'] ?? '');
        $addedTo = (string) ($validated['date_added_to'] ?? '');
        $dateTimezone = (string) ($validated['date_timezone'] ?? 'UTC');
        $direction = (string) ($validated['direction'] ?? 'desc');
        $sort = (string) ($validated['sort'] ?? 'created_at');
        $ocrReview = (string) ($validated['ocr_review'] ?? 'all');
        $status = (string) ($validated['status'] ?? 'all');
        $type = $validated['type'] ?? 'all';
        $documentTypeId = is_numeric($type) ? (int) $type : null;
        $searchMode = (string) ($validated['search_mode'] ?? 'all');

        if ($searchMode === '') {
            $searchMode = 'all';
        }

        if ($documentTypeId !== null) {
            $usesTaxSearch = DocumentType::query()
                ->whereKey($documentTypeId)
                ->where('uses_tax_declaration_fields', true)
                ->exists();
            $searchMode = $usesTaxSearch ? 'tax' : 'all';
            if ($usesTaxSearch) {
                $status = 'all';
            }
        } else {
            $usesTaxSearch = $searchMode === 'tax';
        }

        if (! in_array($field, Document::allowedSearchFields($usesTaxSearch), true)) {
            $field = 'all';
        }

        $documents = $searcher->paginate(
            $search, $field, dateFrom: $dateFrom, dateTo: $dateTo,
            addedFrom: $addedFrom, addedTo: $addedTo, dateTimezone: $dateTimezone,
            sort: $sort, direction: $direction, ocrReview: $ocrReview,
            documentTypeId: $documentTypeId,
            usesTaxFields: $usesTaxSearch,
            status: $status,
            dateField: $dateField,
        );

        $selectedDocument = null;

        if (isset($validated['document'])) {
            $selectedQuery = Document::query()->with(Document::archiveRelations())->whereKey($validated['document']);
            $currentOffice->constrain($selectedQuery);
            $selectedDocument = $selectedQuery->first();
        }

        return Inertia::render('documents/index', [
            'documents' => $documents,
            'archive' => fn (): array => $uploadOptions->archivePlacementTree(),
            'recentArchiveItemIds' => fn (): array => $uploadOptions->recentArchiveItemIds($request->user()),
            'filters' => [
                'q' => $search,
                'field' => $field,
                'direction' => $direction,
                'sort' => $sort,
                'ocr_review' => $ocrReview,
                'status' => $status,
                'search_mode' => $searchMode,
                'type' => $documentTypeId === null ? 'all' : (string) $documentTypeId,
                'date_field' => $dateField,
                'declaration_date_from' => $declarationFrom,
                'declaration_date_to' => $declarationTo,
                'letter_date_from' => $letterFrom,
                'letter_date_to' => $letterTo,
                'date_added_from' => $addedFrom,
                'date_added_to' => $addedTo,
                'date_timezone' => $dateTimezone,
            ],
            'searchFields' => Document::searchFieldOptions($usesTaxSearch),
            'mappingModels' => $mapper->models(),
            'documentTypes' => DocumentType::query()
                ->withCount(['documents' => function (Builder $query) use ($currentOffice): void {
                    $currentOffice->constrain($query);
                }])
                ->orderBy('name')
                ->get()
                ->map(fn (DocumentType $type): array => $type->toOptionArray())
                ->values(),
            'fieldSections' => DocumentFieldDefinitions::reviewSections(),
            'metadataFieldSections' => SharedDocumentFields::metadataReviewSections(),
            'selectedDocument' => $selectedDocument === null ? null : (new DocumentResource($selectedDocument))->resolve(),
        ]);
    }

    public function uploadOptions(Request $request, DocumentUploadOptions $uploadOptions, DocumentFieldMapper $mapper): JsonResponse
    {
        return response()->json([
            'archive' => $uploadOptions->archivePlacementTree(),
            'recentArchiveItemIds' => $uploadOptions->recentArchiveItemIds($request->user()),
            'mappingModels' => $mapper->models(),
            'documentTypes' => DocumentType::query()->orderBy('name')->get()->map(fn (DocumentType $type): array => $type->toOptionArray())->values(),
            'fieldSections' => DocumentFieldDefinitions::reviewSections(),
            'metadataFieldSections' => SharedDocumentFields::metadataReviewSections(),
        ]);
    }

    public function store(StoreDocumentRequest $request, UploadDocument $upload, CurrentOffice $currentOffice): RedirectResponse|JsonResponse
    {
        $bookId = $request->validated('filing_path') === Document::FILING_ROUTE ? null : $request->integer('book_id');
        $document = $upload->store($request->validated('file'), $bookId, $request->user(), $request->safe()->except(['file', 'book_id']));

        $switchedOffice = $document->office_id !== $currentOffice->id();

        if ($switchedOffice) {
            $currentOffice->switch($document->office);
        }

        if ($request->wantsJson()) {
            $office = $document->office;

            return response()->json([
                'id' => $document->id,
                'switchedOffice' => $switchedOffice,
                'office' => $switchedOffice ? [
                    'officeId' => $office->id,
                    'officeName' => $office->name,
                    'officePermissions' => [
                        'canManageRouting' => $office->can_manage_routing,
                        'canRouteDocuments' => $office->can_route_documents,
                        'canUploadToReceiving' => $office->can_upload_to_receiving,
                        'canManageDocumentTypes' => $office->can_manage_document_types,
                    ],
                ] : null,
            ]);
        }

        return to_route('documents.index');
    }
}
