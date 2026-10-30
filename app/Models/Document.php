<?php

namespace App\Models;

use App\Services\Documents\DeclarationRecorder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Scout\Searchable;

/**
 * @property int $id
 * @property int|null $book_id
 * @property int|null $position
 * @property int|null $tax_declaration_id
 * @property string|null $tax_declaration_number
 * @property string|null $registered_owner
 * @property string|null $barangay
 * @property string|null $municipality
 * @property string $original_filename
 * @property string $storage_path
 * @property string $mime_type
 * @property int $file_size
 * @property int|null $uploaded_by
 * @property string $ocr_status
 * @property string|null $ocr_text
 * @property list<string>|null $ocr_pages
 * @property list<array{page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>|null $ocr_regions
 * @property string|null $ocr_pdf_path
 * @property int|null $ocr_pdf_size
 * @property string|null $ocr_error
 * @property Carbon|null $ocr_completed_at
 * @property string|null $thumbnail_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Book|null $book
 * @property-read TaxDeclaration|null $taxDeclaration
 * @property-read User|null $uploader
 */
#[Fillable([
    'book_id',
    'position',
    'tax_declaration_id',
    'original_filename',
    'storage_path',
    'mime_type',
    'file_size',
    'uploaded_by',
    'ocr_status',
    'ocr_text',
    'ocr_pages',
    'ocr_regions',
    'ocr_pdf_path',
    'ocr_pdf_size',
    'ocr_error',
    'ocr_completed_at',
    'thumbnail_path',
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
    'boundary_northeast',
    'boundary_east',
    'boundary_southeast',
    'boundary_south',
    'boundary_southwest',
    'boundary_west',
    'boundary_northwest',
    'area',
    'remarks',
])]
class Document extends Model
{
    use Searchable;

    /**
     * Legal values stored on the declaration, property, and owner records.
     *
     * @var list<string>
     */
    public const RECORD_FIELDS = [
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
        'boundary_northeast',
        'boundary_east',
        'boundary_southeast',
        'boundary_south',
        'boundary_southwest',
        'boundary_west',
        'boundary_northwest',
        'area',
        'remarks',
    ];

    /**
     * Text-like columns users can search from the archive.
     *
     * @var list<string>
     */
    public const SEARCHABLE_COLUMNS = [
        'tax_declaration_number',
        'declaration_date',
        'lot_number',
        'registered_owner',
        'municipality',
        'barangay',
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
        'boundary_north',
        'boundary_northeast',
        'boundary_east',
        'boundary_southeast',
        'boundary_south',
        'boundary_southwest',
        'boundary_west',
        'boundary_northwest',
        'area',
        'remarks',
    ];

    /**
     * @var array<string, array{0: string, 1: string}>
     */
    private const RECORD_SEARCH = [
        'tax_declaration_number' => ['taxDeclaration', 'tax_declaration_number'],
        'declaration_date' => ['taxDeclaration', 'declaration_date'],
        'remarks' => ['taxDeclaration', 'remarks'],
        'lot_number' => ['taxDeclaration.property', 'lot_number'],
        'title_number' => ['taxDeclaration.property', 'title_number'],
        'province' => ['taxDeclaration.property', 'province'],
        'municipality' => ['taxDeclaration.property', 'municipality'],
        'barangay' => ['taxDeclaration.property', 'barangay'],
        'property_location_street' => ['taxDeclaration.property', 'street'],
        'property_location_barangay' => ['taxDeclaration.property', 'barangay'],
        'property_location_district' => ['taxDeclaration.property', 'district'],
        'property_location_municipality' => ['taxDeclaration.property', 'municipality'],
        'registered_owner' => ['taxDeclaration.owners', 'name'],
        'owner_address_street' => ['taxDeclaration.owners', 'street'],
        'owner_address_barangay' => ['taxDeclaration.owners', 'barangay'],
        'owner_address_district' => ['taxDeclaration.owners', 'district'],
        'owner_address_city_municipality' => ['taxDeclaration.owners', 'municipality'],
        'area' => ['taxDeclaration.property', 'area'],
        'boundary_north' => ['taxDeclaration.property', 'boundary_north'],
        'boundary_northeast' => ['taxDeclaration.property', 'boundary_northeast'],
        'boundary_east' => ['taxDeclaration.property', 'boundary_east'],
        'boundary_southeast' => ['taxDeclaration.property', 'boundary_southeast'],
        'boundary_south' => ['taxDeclaration.property', 'boundary_south'],
        'boundary_southwest' => ['taxDeclaration.property', 'boundary_southwest'],
        'boundary_west' => ['taxDeclaration.property', 'boundary_west'],
        'boundary_northwest' => ['taxDeclaration.property', 'boundary_northwest'],
    ];

    /**
     * User-selectable search targets. Null columns means every searchable column.
     *
     * @var array<string, list<string>|null>
     */
    public const SEARCH_FIELDS = [
        'all' => null,
        'tax_declaration_number' => ['tax_declaration_number'],
        'registered_owner' => ['registered_owner'],
        'lot_number' => ['lot_number'],
        'property_location' => [
            'municipality',
            'barangay',
            'province',
            'property_location_street',
            'property_location_barangay',
            'property_location_district',
            'property_location_municipality',
        ],
        'remarks' => ['remarks'],
        'content' => ['ocr_text'],
    ];

    /**
     * @var array<string, string>
     */
    public const SEARCH_FIELD_LABELS = [
        'all' => 'All',
        'tax_declaration_number' => 'Tax declaration',
        'registered_owner' => 'Owner',
        'lot_number' => 'Lot number',
        'property_location' => 'Location',
        'remarks' => 'Remarks',
        'content' => 'Content',
    ];

    /**
     * @var array<string, mixed>
     */
    private array $pendingRecord = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'book_id' => 'integer',
            'position' => 'integer',
            'tax_declaration_id' => 'integer',
            'file_size' => 'integer',
            'ocr_pages' => 'array',
            'ocr_regions' => 'array',
            'ocr_pdf_size' => 'integer',
            'ocr_completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (Document $document): void {
            $fields = $document->pullPendingRecord();

            if ($fields === []) {
                return;
            }

            app(DeclarationRecorder::class)->sync($document, $fields);
        });
    }

    public function setAttribute($key, $value)
    {
        if (in_array($key, self::RECORD_FIELDS, true)) {
            $this->pendingRecord[$key] = $value;

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function getAttribute($key)
    {
        if (is_string($key) && in_array($key, self::RECORD_FIELDS, true)) {
            return $this->recordValue($key);
        }

        return parent::getAttribute($key);
    }

    /**
     * @return array<string, mixed>
     */
    public function pullPendingRecord(): array
    {
        $fields = $this->pendingRecord;
        $this->pendingRecord = [];

        return $fields;
    }

    /**
     * @return BelongsTo<TaxDeclaration, $this>
     */
    public function taxDeclaration(): BelongsTo
    {
        return $this->belongsTo(TaxDeclaration::class);
    }

    /**
     * @return list<string>
     */
    public static function archiveRelations(): array
    {
        return [
            'taxDeclaration.property',
            'taxDeclaration.owners',
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
     * @return BelongsTo<Book, $this>
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    private function recordValue(string $key): mixed
    {
        if (array_key_exists($key, $this->pendingRecord)) {
            return $this->castRecordValue($key, $this->pendingRecord[$key]);
        }

        $this->loadMissing(self::archiveRelations());
        $declaration = $this->getRelation('taxDeclaration');

        if (! $declaration instanceof TaxDeclaration) {
            return null;
        }

        $property = $declaration->property;
        $owner = $declaration->owners->first();

        $value = match ($key) {
            'tax_declaration_number' => $declaration->tax_declaration_number,
            'declaration_date' => $declaration->declaration_date,
            'previous_tax_declaration_number' => $declaration->previous_tax_declaration_number,
            'previous_declaration_date' => $declaration->previous_declaration_date,
            'remarks' => $declaration->remarks,
            'lot_number' => $property?->lot_number,
            'title_number' => $property?->title_number,
            'pin' => $property?->pin,
            'area' => $property?->area,
            'province' => $property?->province,
            'municipality', 'property_location_municipality' => $property?->municipality,
            'barangay', 'property_location_barangay' => $property?->barangay,
            'property_location_street' => $property?->street,
            'property_location_district' => $property?->district,
            'boundary_north' => $property?->boundary_north,
            'boundary_northeast' => $property?->boundary_northeast,
            'boundary_east' => $property?->boundary_east,
            'boundary_southeast' => $property?->boundary_southeast,
            'boundary_south' => $property?->boundary_south,
            'boundary_southwest' => $property?->boundary_southwest,
            'boundary_west' => $property?->boundary_west,
            'boundary_northwest' => $property?->boundary_northwest,
            'registered_owner' => $owner?->name,
            'owner_address_street' => $owner?->street,
            'owner_address_barangay' => $owner?->barangay,
            'owner_address_district' => $owner?->district,
            'owner_address_city_municipality' => $owner?->municipality,
            default => null,
        };

        return $this->castRecordValue($key, $value);
    }

    private function castRecordValue(string $key, mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (in_array($key, ['declaration_date', 'previous_declaration_date'], true) && is_string($value)) {
            return Carbon::parse($value)->startOfDay();
        }

        return $value;
    }

    /**
     * Restrict the query to documents matching every search term in the selected columns.
     *
     * @param  Builder<Document>  $query
     */
    public function scopeSearch(Builder $query, string $search, string $field = 'all'): void
    {
        $terms = preg_split('/\s+/u', trim($search), -1, PREG_SPLIT_NO_EMPTY);
        $columns = self::columnsForSearchField($field);

        if ($field === 'all') {
            $columns[] = 'ocr_text';
        }

        if ($terms === false || $terms === [] || $columns === []) {
            return;
        }

        foreach ($terms as $term) {
            $like = '%'.addcslashes($term, '%_\\').'%';

            $query->where(function (Builder $group) use ($columns, $like): void {
                foreach ($columns as $column) {
                    if ($column === 'ocr_text') {
                        $group->orWhere('documents.ocr_text', 'like', $like);

                        continue;
                    }

                    [$relation, $relatedColumn] = self::RECORD_SEARCH[$column];
                    $group->orWhereHas($relation, function (Builder $related) use ($relatedColumn, $like): void {
                        $related->where($relatedColumn, 'like', $like);
                    });
                }
            });
        }
    }

    /**
     * @return list<string>
     */
    public static function columnsForSearchField(string $field): array
    {
        if (! array_key_exists($field, self::SEARCH_FIELDS) || self::SEARCH_FIELDS[$field] === null) {
            return self::SEARCHABLE_COLUMNS;
        }

        return self::SEARCH_FIELDS[$field];
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $payload = [
            'id' => $this->id,
            'ocr_status' => $this->ocr_status,
            'ocr_text' => $this->ocr_text ?? '',
            'ocr_pages' => $this->ocr_pages ?? [],
        ];

        foreach (self::SEARCHABLE_COLUMNS as $column) {
            $value = $this->{$column};

            $payload[$column] = $value instanceof Carbon
                ? $value->toDateString()
                : $value;
        }

        return $payload;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function searchFieldOptions(): array
    {
        $options = [];

        foreach (array_keys(self::SEARCH_FIELDS) as $value) {
            $options[] = [
                'value' => $value,
                'label' => self::SEARCH_FIELD_LABELS[$value],
            ];
        }

        return $options;
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
            'boundaryNortheast' => $this->boundary_northeast,
            'boundaryEast' => $this->boundary_east,
            'boundarySoutheast' => $this->boundary_southeast,
            'boundarySouth' => $this->boundary_south,
            'boundarySouthwest' => $this->boundary_southwest,
            'boundaryWest' => $this->boundary_west,
            'boundaryNorthwest' => $this->boundary_northwest,
            'area' => $this->area === null
                ? null
                : number_format((float) $this->area, 4, '.', ''),
            'remarks' => $this->remarks,
            'originalFilename' => $this->original_filename,
            'mimeType' => $this->mime_type,
            'fileSize' => $this->file_size,
            'ocrPdfSize' => $this->ocr_pdf_size,
            'createdAt' => $this->created_at?->toIso8601String(),
            'viewUrl' => route('documents.view', $this),
            'thumbnailUrl' => $this->hasStoredThumbnail()
                ? route('documents.thumbnail', $this)
                : null,
            'ocrPdfUrl' => is_string($this->ocr_pdf_path) && $this->ocr_pdf_path !== ''
                ? route('documents.ocr-pdf', $this)
                : null,
        ];
    }

    public function hasStoredOcrPdf(): bool
    {
        return is_string($this->ocr_pdf_path)
            && $this->ocr_pdf_path !== ''
            && Storage::disk('local')->exists($this->ocr_pdf_path);
    }

    public function hasStoredThumbnail(): bool
    {
        return is_string($this->thumbnail_path)
            && $this->thumbnail_path !== ''
            && Storage::disk('local')->exists($this->thumbnail_path);
    }

    public function previewUrl(): ?string
    {
        if ($this->hasStoredOcrPdf()) {
            return route('documents.ocr-pdf', $this);
        }

        if (is_string($this->storage_path) && $this->storage_path !== '' && Storage::disk('local')->exists($this->storage_path)) {
            return route('documents.view', $this);
        }

        return null;
    }

    /**
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function previousDeclarationChain(): array
    {
        $this->loadMissing('taxDeclaration');
        $declaration = $this->taxDeclaration;

        if (! $declaration instanceof TaxDeclaration) {
            return [];
        }

        $chain = [];
        $seenDeclarationIds = [$declaration->id];
        $current = $declaration;

        while (true) {
            $previousId = $current->previous_declaration_id;
            $printed = $current->previous_tax_declaration_number;

            if (is_int($previousId) && ! in_array($previousId, $seenDeclarationIds, true)) {
                $previous = TaxDeclaration::query()
                    ->with(['property', 'owners', 'documents'])
                    ->find($previousId);

                if (! $previous instanceof TaxDeclaration) {
                    if (is_string($printed) && $printed !== '') {
                        $chain[] = [
                            'taxDeclarationNumber' => $printed,
                            'document' => null,
                            'declarationDate' => $current->previous_declaration_date?->toDateString(),
                        ];
                    }

                    break;
                }

                $seenDeclarationIds[] = $previous->id;
                $file = $previous->documents->sortByDesc('id')->first();
                $chain[] = [
                    'taxDeclarationNumber' => $previous->tax_declaration_number ?? (is_string($printed) ? $printed : ''),
                    'document' => $file?->toArchiveArray(),
                    'declarationDate' => $previous->declaration_date?->toDateString()
                        ?? $current->previous_declaration_date?->toDateString(),
                ];
                $current = $previous;

                continue;
            }

            if (is_string($printed) && $printed !== '') {
                $chain[] = [
                    'taxDeclarationNumber' => $printed,
                    'document' => null,
                    'declarationDate' => $current->previous_declaration_date?->toDateString(),
                ];
            }

            break;
        }

        return $chain;
    }

    /**
     * @param  list<int>  $seenIds
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function followingDeclarationChain(array $seenIds = []): array
    {
        $this->loadMissing('taxDeclaration');
        $declaration = $this->taxDeclaration;

        if (! $declaration instanceof TaxDeclaration) {
            return [];
        }

        $chain = [];
        $seenIds = $seenIds === [] ? [$this->id] : $seenIds;

        if (! in_array($this->id, $seenIds, true)) {
            $seenIds[] = $this->id;
        }

        $seenDeclarationIds = [$declaration->id];
        $current = $declaration;

        while (true) {
            $next = TaxDeclaration::query()
                ->with(['property', 'owners', 'documents'])
                ->where('previous_declaration_id', $current->id)
                ->latest('id')
                ->first();

            if (! $next instanceof TaxDeclaration || in_array($next->id, $seenDeclarationIds, true)) {
                break;
            }

            $file = $next->documents->sortByDesc('id')->first();

            if ($file instanceof self && in_array($file->id, $seenIds, true)) {
                break;
            }

            $seenDeclarationIds[] = $next->id;

            if ($file instanceof self) {
                $seenIds[] = $file->id;
                $file->setRelation('taxDeclaration', $next);
            }

            $chain[] = [
                'taxDeclarationNumber' => $next->tax_declaration_number ?? '',
                'document' => $file?->toArchiveArray(),
                'declarationDate' => $next->declaration_date?->toDateString(),
            ];
            $current = $next;
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
