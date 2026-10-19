<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $tax_declaration_number
 * @property Carbon|null $declaration_date
 * @property string|null $lot_number
 * @property string|null $registered_owner
 * @property string|null $municipality
 * @property string|null $barangay
 * @property string|null $previous_tax_declaration_number
 * @property Carbon|null $previous_declaration_date
 * @property string|null $title_number
 * @property string|null $property_location_street
 * @property string|null $property_location_barangay
 * @property string|null $property_location_district
 * @property string|null $property_location_municipality
 * @property string|null $owner_address_street
 * @property string|null $owner_address_barangay
 * @property string|null $owner_address_district
 * @property string|null $owner_address_city_municipality
 * @property string|null $province
 * @property string|null $pin
 * @property string|null $boundary_north
 * @property string|null $boundary_south
 * @property string|null $boundary_east
 * @property string|null $boundary_west
 * @property numeric-string|null $area
 * @property string|null $remarks
 * @property string $original_filename
 * @property string $storage_path
 * @property string $mime_type
 * @property int $file_size
 * @property int|null $uploaded_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tax_declaration_number',
    'declaration_date',
    'lot_number',
    'registered_owner',
    'municipality',
    'barangay',
    'previous_tax_declaration_number',
    'previous_declaration_date',
    'title_number',
    'property_location_street',
    'property_location_barangay',
    'property_location_district',
    'property_location_municipality',
    'owner_address_street',
    'owner_address_barangay',
    'owner_address_district',
    'owner_address_city_municipality',
    'province',
    'pin',
    'boundary_north',
    'boundary_south',
    'boundary_east',
    'boundary_west',
    'area',
    'remarks',
    'original_filename',
    'storage_path',
    'mime_type',
    'file_size',
    'uploaded_by',
])]
class Document extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'declaration_date' => 'date',
            'previous_declaration_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArchiveArray(): array
    {
        return [
            'id' => $this->id,
            'taxDeclarationNumber' => $this->tax_declaration_number,
            'declarationDate' => $this->declaration_date?->toDateString(),
            'lotNumber' => $this->lot_number,
            'registeredOwner' => $this->registered_owner,
            'municipality' => $this->municipality,
            'barangay' => $this->barangay,
            'previousTaxDeclarationNumber' => $this->previous_tax_declaration_number,
            'previousDeclarationDate' => $this->previous_declaration_date?->toDateString(),
            'titleNumber' => $this->title_number,
            'propertyLocationStreet' => $this->property_location_street,
            'propertyLocationBarangay' => $this->property_location_barangay,
            'propertyLocationDistrict' => $this->property_location_district,
            'propertyLocationMunicipality' => $this->property_location_municipality,
            'ownerAddressStreet' => $this->owner_address_street,
            'ownerAddressBarangay' => $this->owner_address_barangay,
            'ownerAddressDistrict' => $this->owner_address_district,
            'ownerAddressCityMunicipality' => $this->owner_address_city_municipality,
            'province' => $this->province,
            'pin' => $this->pin,
            'boundaryNorth' => $this->boundary_north,
            'boundarySouth' => $this->boundary_south,
            'boundaryEast' => $this->boundary_east,
            'boundaryWest' => $this->boundary_west,
            'area' => $this->area === null
                ? null
                : number_format((float) $this->area, 4, '.', ''),
            'remarks' => $this->remarks,
            'originalFilename' => $this->original_filename,
            'mimeType' => $this->mime_type,
            'fileSize' => $this->file_size,
            'createdAt' => $this->created_at?->toIso8601String(),
            'viewUrl' => route('documents.view', $this),
        ];
    }

    /**
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function previousDeclarationChain(): array
    {
        $chain = [];
        $seenIds = [$this->id];
        $ownNumber = is_string($this->tax_declaration_number)
            ? mb_strtolower($this->tax_declaration_number)
            : '';
        $seenNumbers = $ownNumber === '' ? [] : [$ownNumber];
        $pointer = $this;
        $currentNumber = $this->previous_tax_declaration_number;

        while (is_string($currentNumber) && $currentNumber !== '') {
            $normalized = mb_strtolower($currentNumber);

            if (in_array($normalized, $seenNumbers, true)) {
                break;
            }

            $seenNumbers[] = $normalized;

            $match = static::query()
                ->whereRaw('LOWER(tax_declaration_number) = ?', [$normalized])
                ->whereNotIn('id', $seenIds)
                ->latest('id')
                ->first();

            if ($match === null) {
                $chain[] = [
                    'taxDeclarationNumber' => $currentNumber,
                    'document' => null,
                    'declarationDate' => $pointer->previous_declaration_date?->toDateString(),
                ];
                break;
            }

            $seenIds[] = $match->id;
            $chain[] = [
                'taxDeclarationNumber' => $match->tax_declaration_number ?? $currentNumber,
                'document' => $match->toArchiveArray(),
                'declarationDate' => $match->declaration_date?->toDateString()
                    ?? $pointer->previous_declaration_date?->toDateString(),
            ];
            $pointer = $match;
            $currentNumber = $match->previous_tax_declaration_number;
        }

        return $chain;
    }

    /**
     * @param  list<int>  $seenIds
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function followingDeclarationChain(array $seenIds = []): array
    {
        $chain = [];
        $seenIds = $seenIds === [] ? [$this->id] : $seenIds;

        if (! in_array($this->id, $seenIds, true)) {
            $seenIds[] = $this->id;
        }

        $pointer = $this;

        while (true) {
            $number = $pointer->tax_declaration_number;

            if (! is_string($number) || $number === '') {
                break;
            }

            $normalized = mb_strtolower($number);
            $next = static::query()
                ->whereRaw('LOWER(previous_tax_declaration_number) = ?', [$normalized])
                ->whereNotIn('id', $seenIds)
                ->latest('id')
                ->first();

            if ($next === null) {
                break;
            }

            $seenIds[] = $next->id;
            $chain[] = [
                'taxDeclarationNumber' => $next->tax_declaration_number ?? $number,
                'document' => $next->toArchiveArray(),
                'declarationDate' => $next->declaration_date?->toDateString(),
            ];
            $pointer = $next;
        }

        return $chain;
    }

    /**
     * @return array{originId: int, entries: list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>}
     */
    public function fullDeclarationChain(): array
    {
        $previous = $this->previousDeclarationChain();
        $seenIds = [$this->id];

        foreach ($previous as $entry) {
            $documentId = $entry['document']['id'] ?? null;

            if (is_int($documentId)) {
                $seenIds[] = $documentId;
            }
        }

        return [
            'originId' => $this->id,
            'entries' => [
                ...array_reverse($previous),
                [
                    'taxDeclarationNumber' => $this->tax_declaration_number ?? '',
                    'document' => $this->toArchiveArray(),
                    'declarationDate' => $this->declaration_date?->toDateString(),
                ],
                ...$this->followingDeclarationChain($seenIds),
            ],
        ];
    }
}
