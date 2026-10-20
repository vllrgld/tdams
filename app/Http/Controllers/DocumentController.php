<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
            'field' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(Document::SEARCH_FIELDS))],
        ]);

        $search = trim((string) ($validated['q'] ?? ''));
        $field = $validated['field'] ?? 'all';

        if (! is_string($field) || $field === '') {
            $field = 'all';
        }

        $documents = Document::query()
            ->when($search !== '', fn ($query) => $query->search($search, $field))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Document $document): array => $document->toArchiveArray());

        return Inertia::render('documents/index', [
            'documents' => $documents,
            'filters' => [
                'q' => $search,
                'field' => $field,
            ],
            'searchFields' => Document::searchFieldOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,tif,tiff', 'max:51200'],
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'declaration_date' => ['nullable', 'date'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'registered_owner' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:150'],
            'barangay' => ['nullable', 'string', 'max:150'],
            'previous_tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'previous_declaration_date' => ['nullable', 'date'],
            'title_number' => ['nullable', 'string', 'max:100'],
            'property_location_street' => ['nullable', 'string', 'max:255'],
            'property_location_barangay' => ['nullable', 'string', 'max:150'],
            'property_location_district' => ['nullable', 'string', 'max:150'],
            'property_location_municipality' => ['nullable', 'string', 'max:150'],
            'owner_address_street' => ['nullable', 'string', 'max:255'],
            'owner_address_barangay' => ['nullable', 'string', 'max:150'],
            'owner_address_district' => ['nullable', 'string', 'max:150'],
            'owner_address_city_municipality' => ['nullable', 'string', 'max:150'],
            'province' => ['nullable', 'string', 'max:150'],
            'pin' => ['nullable', 'string', 'max:100'],
            'boundary_north' => ['nullable', 'string', 'max:255'],
            'boundary_south' => ['nullable', 'string', 'max:255'],
            'boundary_east' => ['nullable', 'string', 'max:255'],
            'boundary_west' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'numeric', 'min:0', 'max:9999999999.9999'],
            'remarks' => ['nullable', 'string', 'max:10000'],
        ]);

        $this->assertPreviousDeclarationIsNotSelf(
            $validated['previous_tax_declaration_number'] ?? null,
            $validated['tax_declaration_number'] ?? null,
        );

        $file = $validated['file'];
        $storagePath = null;

        try {
            DB::transaction(function () use ($request, $file, $validated, &$storagePath): void {
                $temporaryPath = $file->getPathname();

                if ($temporaryPath === '' || ! is_file($temporaryPath) || ! is_readable($temporaryPath)) {
                    throw new RuntimeException('The uploaded document temporary file is unavailable.');
                }

                $stream = fopen($temporaryPath, 'rb');

                if ($stream === false) {
                    throw new RuntimeException('The uploaded document temporary file could not be opened.');
                }

                $storagePath = 'documents/'.$file->hashName();

                try {
                    $stored = Storage::disk('local')->put($storagePath, $stream);
                } finally {
                    fclose($stream);
                }

                if (! $stored) {
                    throw new RuntimeException('The document could not be saved to private storage.');
                }

                Document::query()->create([
                    'tax_declaration_number' => $validated['tax_declaration_number'] ?? null,
                    'declaration_date' => $validated['declaration_date'] ?? null,
                    'lot_number' => $validated['lot_number'] ?? null,
                    'registered_owner' => $validated['registered_owner'] ?? null,
                    'municipality' => $validated['municipality'] ?? null,
                    'barangay' => $validated['barangay'] ?? null,
                    'previous_tax_declaration_number' => $validated['previous_tax_declaration_number'] ?? null,
                    'previous_declaration_date' => $validated['previous_declaration_date'] ?? null,
                    'title_number' => $validated['title_number'] ?? null,
                    'property_location_street' => $validated['property_location_street'] ?? null,
                    'property_location_barangay' => $validated['property_location_barangay'] ?? null,
                    'property_location_district' => $validated['property_location_district'] ?? null,
                    'property_location_municipality' => $validated['property_location_municipality'] ?? null,
                    'owner_address_street' => $validated['owner_address_street'] ?? null,
                    'owner_address_barangay' => $validated['owner_address_barangay'] ?? null,
                    'owner_address_district' => $validated['owner_address_district'] ?? null,
                    'owner_address_city_municipality' => $validated['owner_address_city_municipality'] ?? null,
                    'province' => $validated['province'] ?? null,
                    'pin' => $validated['pin'] ?? null,
                    'boundary_north' => $validated['boundary_north'] ?? null,
                    'boundary_south' => $validated['boundary_south'] ?? null,
                    'boundary_east' => $validated['boundary_east'] ?? null,
                    'boundary_west' => $validated['boundary_west'] ?? null,
                    'area' => $validated['area'] ?? null,
                    'remarks' => $validated['remarks'] ?? null,
                    'original_filename' => $file->getClientOriginalName(),
                    'storage_path' => $storagePath,
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'file_size' => $file->getSize(),
                    'uploaded_by' => $request->user()->id,
                ]);
            });
        } catch (Throwable $exception) {
            if (is_string($storagePath)) {
                Storage::disk('local')->delete($storagePath);
            }

            throw $exception;
        }

        return to_route('documents.index');
    }

    public function declarationNumbers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:100'],
            'exclude' => ['nullable', 'integer', 'exists:documents,id'],
        ]);

        $term = '%'.addcslashes(mb_strtolower($validated['q']), '%_\\').'%';

        $documents = Document::query()
            ->whereNotNull('tax_declaration_number')
            ->where('tax_declaration_number', '!=', '')
            ->whereRaw('LOWER(tax_declaration_number) LIKE ?', [$term])
            ->when(
                isset($validated['exclude']),
                fn ($query) => $query->where('id', '!=', (int) $validated['exclude']),
            )
            ->latest('id')
            ->limit(15)
            ->get([
                'id',
                'tax_declaration_number',
                'registered_owner',
                'lot_number',
                'municipality',
                'declaration_date',
                'created_at',
            ]);

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

    public function history(Document $document): JsonResponse
    {
        return response()->json($document->previousDeclarationChain());
    }

    public function chain(Document $document): JsonResponse
    {
        return response()->json($document->fullDeclarationChain());
    }

    public function update(Request $request, Document $document): RedirectResponse
    {
        $validated = $request->validate([
            'previous_tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'previous_declaration_date' => ['nullable', 'date'],
        ]);

        if (filled($document->previous_tax_declaration_number)) {
            throw ValidationException::withMessages([
                'previous_tax_declaration_number' => 'A previous tax declaration number is already set.',
            ]);
        }

        $previousNumber = $validated['previous_tax_declaration_number'] ?? null;

        $this->assertPreviousDeclarationIsNotSelf(
            $previousNumber,
            $document->tax_declaration_number,
        );

        $document->update([
            'previous_tax_declaration_number' => $previousNumber,
            'previous_declaration_date' => $validated['previous_declaration_date'] ?? null,
        ]);

        return to_route('documents.index');
    }

    public function view(Document $document): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($document->storage_path), 404);

        return Storage::disk('local')->response(
            $document->storage_path,
            $document->original_filename,
            [
                'Content-Type' => $document->mime_type,
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline',
        );
    }

    private function assertPreviousDeclarationIsNotSelf(?string $previousNumber, ?string $taxDeclarationNumber): void
    {
        if (! filled($previousNumber) || ! filled($taxDeclarationNumber)) {
            return;
        }

        if (strcasecmp(trim($previousNumber), trim($taxDeclarationNumber)) === 0) {
            throw ValidationException::withMessages([
                'previous_tax_declaration_number' => 'The previous tax declaration number cannot be the same as this document.',
            ]);
        }
    }
}
