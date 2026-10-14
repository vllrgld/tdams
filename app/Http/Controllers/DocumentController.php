<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DocumentController extends Controller
{
    public function index(): Response
    {
        $documents = Document::query()
            ->latest()
            ->paginate(20)
            ->through(fn (Document $document): array => [
                'id' => $document->id,
                'taxDeclarationNumber' => $document->tax_declaration_number,
                'lotNumber' => $document->lot_number,
                'registeredOwner' => $document->registered_owner,
                'municipality' => $document->municipality,
                'barangay' => $document->barangay,
                'previousTaxDeclarationNumber' => $document->previous_tax_declaration_number,
                'titleNumber' => $document->title_number,
                'propertyLocationStreet' => $document->property_location_street,
                'propertyLocationBarangay' => $document->property_location_barangay,
                'propertyLocationDistrict' => $document->property_location_district,
                'propertyLocationMunicipality' => $document->property_location_municipality,
                'ownerAddressStreet' => $document->owner_address_street,
                'ownerAddressBarangay' => $document->owner_address_barangay,
                'ownerAddressDistrict' => $document->owner_address_district,
                'ownerAddressCityMunicipality' => $document->owner_address_city_municipality,
                'province' => $document->province,
                'pin' => $document->pin,
                'boundaryNorth' => $document->boundary_north,
                'boundarySouth' => $document->boundary_south,
                'boundaryEast' => $document->boundary_east,
                'boundaryWest' => $document->boundary_west,
                'area' => $document->area === null
                    ? null
                    : number_format((float) $document->area, 4, '.', ''),
                'remarks' => $document->remarks,
                'originalFilename' => $document->original_filename,
                'mimeType' => $document->mime_type,
                'fileSize' => $document->file_size,
                'createdAt' => $document->created_at?->toIso8601String(),
                'viewUrl' => route('documents.view', $document),
            ]);

        return Inertia::render('documents/index', [
            'documents' => $documents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,tif,tiff', 'max:51200'],
            'tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'registered_owner' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:150'],
            'barangay' => ['nullable', 'string', 'max:150'],
            'previous_tax_declaration_number' => ['nullable', 'string', 'max:100'],
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
                    'lot_number' => $validated['lot_number'] ?? null,
                    'registered_owner' => $validated['registered_owner'] ?? null,
                    'municipality' => $validated['municipality'] ?? null,
                    'barangay' => $validated['barangay'] ?? null,
                    'previous_tax_declaration_number' => $validated['previous_tax_declaration_number'] ?? null,
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
}
