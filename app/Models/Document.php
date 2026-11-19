<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Laravel\Scout\Searchable;

/**
 * @property int $id
 * @property int|null $office_id
 * @property string|null $tracking_code
 * @property-read CarbonInterface|null $declaration_date
 * @property-read string|null $lot_number
 * @property-read string|null $previous_tax_declaration_number
 * @property-read CarbonInterface|null $previous_declaration_date
 * @property-read string|null $title_number
 * @property-read string|null $property_location_street
 * @property-read string|null $property_location_barangay
 * @property-read string|null $property_location_district
 * @property-read string|null $property_location_municipality
 * @property-read string|null $owner_address_street
 * @property-read string|null $owner_address_barangay
 * @property-read string|null $owner_address_district
 * @property-read string|null $owner_address_city_municipality
 * @property-read string|null $province
 * @property-read string|null $pin
 * @property-read string|null $boundary_north
 * @property-read string|null $boundary_northeast
 * @property-read string|null $boundary_east
 * @property-read string|null $boundary_southeast
 * @property-read string|null $boundary_south
 * @property-read string|null $boundary_southwest
 * @property-read string|null $boundary_west
 * @property-read string|null $boundary_northwest
 * @property-read string|null $area
 * @property string|null $remarks
 * @property int|null $book_id
 * @property int|null $position
 * @property int|null $document_type_id
 * @property int|null $correspondent_id
 * @property string|null $title
 * @property Carbon|null $letter_date
 * @property string $filing_path
 * @property int|null $document_route_id
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
 * @property string $status
 * @property int $routing_version
 * @property bool $routing_started
 * @property string|null $ocr_text
 * @property list<string>|null $ocr_pages
 * @property list<array{page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>|null $ocr_regions
 * @property string|null $ocr_pdf_path
 * @property int|null $ocr_pdf_size
 * @property string|null $ocr_error
 * @property Carbon|null $ocr_completed_at
 * @property Carbon|null $ocr_reviewed_at
 * @property int|null $ocr_reviewed_by
 * @property string|null $thumbnail_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Book|null $book
 * @property-read Office|null $office
 * @property-read DocumentTransfer|null $pendingTransfer
 * @property-read DocumentType|null $documentType
 * @property-read Correspondent|null $correspondent
 * @property-read Collection<int, DocumentAttachment> $attachments
 * @property-read DocumentRoute|null $documentRoute
 * @property-read TaxDeclaration|null $taxDeclaration
 * @property-read User|null $uploader
 */
#[Fillable([
    'status',
    'office_id',
    'book_id',
    'position',
    'document_type_id',
    'correspondent_id',
    'title',
    'letter_date',
    'remarks',
    'filing_path',
    'document_route_id',
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
])]
class Document extends Model
{
    public const STATUS_UNDER_REVIEW = 'under_review';

    public const STATUS_ARCHIVED = 'archived';

    public const STATUS_LABELS = ['under_review' => 'Under review', 'in_progress' => 'In progress', 'approved' => 'Approved', 'disapproved' => 'Disapproved', 'completed' => 'Completed', 'archived' => 'Archived'];

    public const DECISION_STATUSES = ['approved', 'disapproved'];

    protected $attributes = ['status' => self::STATUS_UNDER_REVIEW];

    use Searchable;

    public const FILING_ARCHIVE = 'archive';

    public const FILING_ROUTE = 'route';

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
     * @var list<literal-string>
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
     * @var array<string, array{0: string, 1: literal-string}>
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
     * User-selectable search targets for tax declarations. Null columns means every searchable column.
     *
     * @var array<string, list<literal-string>|null>
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
     * Search targets for other document types.
     *
     * @var array<string, list<literal-string>|null>
     */
    public const OTHER_SEARCH_FIELDS = [
        'all' => null,
        'correspondent' => ['correspondent'],
        'title' => ['title'],
        'letter_date' => ['letter_date'],
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
     * @var array<string, string>
     */
    public const OTHER_SEARCH_FIELD_LABELS = [
        'all' => 'All',
        'correspondent' => 'Correspondent',
        'title' => 'Title',
        'letter_date' => 'Date of letter',
        'remarks' => 'Remarks',
        'content' => 'Content',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'office_id' => 'integer',
            'book_id' => 'integer',
            'position' => 'integer',
            'document_type_id' => 'integer',
            'correspondent_id' => 'integer',
            'letter_date' => 'date',
            'document_route_id' => 'integer',
            'routing_version' => 'integer',
            'routing_started' => 'boolean',
            'tax_declaration_id' => 'integer',
            'file_size' => 'integer',
            'ocr_pages' => 'array',
            'ocr_regions' => 'array',
            'ocr_pdf_size' => 'integer',
            'ocr_completed_at' => 'datetime',
            'ocr_reviewed_at' => 'datetime',
            'ocr_reviewed_by' => 'integer',
        ];
    }

    public function getAttribute($key)
    {
        if (in_array($key, self::RECORD_FIELDS, true) && $this->usesTaxDeclarationFields()) {
            return $this->recordValue($key);
        }

        return parent::getAttribute($key);
    }

    public function usesTaxDeclarationFields(): bool
    {
        $this->loadMissing('documentType');

        return (bool) ($this->documentType->uses_tax_declaration_fields ?? true);
    }

    public function startRouting(): bool
    {
        if ($this->document_route_id === null || $this->usesTaxDeclarationFields() || $this->status !== self::STATUS_UNDER_REVIEW) {
            return false;
        }

        $this->status = 'in_progress';

        return true;
    }

    /**
     * @return BelongsTo<DocumentType, $this>
     */
    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    /**
     * @return BelongsTo<Correspondent, $this>
     */
    public function correspondent(): BelongsTo
    {
        return $this->belongsTo(Correspondent::class);
    }

    /**
     * @return HasMany<DocumentAttachment, $this>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class)->orderBy('position');
    }

    /**
     * @return BelongsTo<DocumentRoute, $this>
     */
    public function documentRoute(): BelongsTo
    {
        return $this->belongsTo(DocumentRoute::class);
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
            'documentType',
            'office',
            'pendingTransfer.toOffice',
            'correspondent',
            'attachments',
            'documentRoute.steps',
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

    /** @return HasMany<DocumentTransfer, $this> */
    public function transfers(): HasMany
    {
        return $this->hasMany(DocumentTransfer::class);
    }

    /** @return HasMany<DocumentAudit, $this> */
    public function audits(): HasMany
    {
        return $this->hasMany(DocumentAudit::class);
    }

    /** @return HasMany<DocumentEndorsement, $this> */
    public function endorsements(): HasMany
    {
        return $this->hasMany(DocumentEndorsement::class);
    }

    /** @return HasOne<DocumentTransfer, $this> */
    public function pendingTransfer(): HasOne
    {
        return $this->hasOne(DocumentTransfer::class)->whereNull('received_at')->whereNull('reverted_at');
    }

    /**
     * @return BelongsTo<Book, $this>
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * @param  Builder<Document>  $query
     */
    public function scopeForOffice(Builder $query, int $officeId): void
    {
        $query->where('office_id', $officeId)->whereDoesntHave('pendingTransfer');
    }

    private function recordValue(string $key): mixed
    {
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
    public function scopeSearch(Builder $query, string $search, string $field = 'all', bool $taxFields = true): void
    {
        $terms = preg_split('/\s+/u', trim($search), -1, PREG_SPLIT_NO_EMPTY);
        $columns = self::columnsForSearchField($field, $taxFields);

        if ($taxFields && $field === 'all') {
            $columns[] = 'ocr_text';
        }

        if ($terms === false || $terms === [] || $columns === []) {
            return;
        }

        $hasMonthName = array_any($terms, fn (string $term): bool => self::searchMonth($term) !== null);

        foreach ($terms as $term) {
            $query->where(function (Builder $group) use ($columns, $term, $taxFields, $hasMonthName): void {
                foreach ($columns as $column) {
                    if ($column === 'letter_date') {
                        $group->orWhere(function (Builder $date) use ($term, $hasMonthName): void {
                            self::constrainSearchDate($date->getQuery(), 'documents.letter_date', $term, $hasMonthName);
                        });

                        continue;
                    }

                    if (
                        $column === 'ocr_text'
                        || $column === 'title'
                        || (! $taxFields && $column === 'remarks')
                    ) {
                        self::constrainSearchText($group->getQuery(), 'documents.'.$column, $term, 'or');

                        continue;
                    }

                    if ($column === 'correspondent') {
                        $group->orWhereHas('correspondent', function (Builder $related) use ($term): void {
                            self::constrainSearchText($related->getQuery(), 'name', $term);
                        });

                        continue;
                    }

                    [$relation, $relatedColumn] = self::RECORD_SEARCH[$column];
                    $group->orWhereHas($relation, function (Builder $related) use ($relatedColumn, $term, $hasMonthName): void {
                        if ($relatedColumn === 'declaration_date') {
                            self::constrainSearchDate($related->getQuery(), $relatedColumn, $term, $hasMonthName);
                        } else {
                            self::constrainSearchText($related->getQuery(), $relatedColumn, $term);
                        }
                    });
                }
            });
        }
    }

    private static function searchMonth(string $term): ?int
    {
        return match (strtolower(trim($term, '.,'))) {
            'jan', 'january' => 1,
            'feb', 'february' => 2,
            'mar', 'march' => 3,
            'apr', 'april' => 4,
            'may' => 5,
            'jun', 'june' => 6,
            'jul', 'july' => 7,
            'aug', 'august' => 8,
            'sep', 'sept', 'september' => 9,
            'oct', 'october' => 10,
            'nov', 'november' => 11,
            'dec', 'december' => 12,
            default => null,
        };
    }

    /** @param literal-string $column */
    private static function constrainSearchDate(QueryBuilder $query, string $column, string $term, bool $hasMonthName): void
    {
        $month = self::searchMonth($term);
        $dateTerm = trim($term, '.,');

        if ($month !== null) {
            $query->whereMonth($column, $month);
        } elseif ($hasMonthName && ctype_digit($dateTerm) && strlen($dateTerm) <= 2) {
            $query->whereDay($column, (int) $dateTerm);
        } elseif ($hasMonthName && ctype_digit($dateTerm) && strlen($dateTerm) === 4) {
            $query->whereYear($column, (int) $dateTerm);
        } else {
            self::constrainSearchText($query, $column, $dateTerm !== '' ? $dateTerm : $term);
        }
    }

    /** @param literal-string $column */
    private static function constrainSearchText(QueryBuilder $query, string $column, string $term, string $boolean = 'and'): void
    {
        $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';

        $query->whereRaw($column." LIKE ? ESCAPE '!'", [$like], $boolean);
    }

    /**
     * @return list<literal-string>
     */
    public static function columnsForSearchField(string $field, bool $taxFields = true): array
    {
        $fields = $taxFields ? self::SEARCH_FIELDS : self::OTHER_SEARCH_FIELDS;

        if (! array_key_exists($field, $fields) || $fields[$field] === null) {
            return $taxFields ? self::SEARCHABLE_COLUMNS : ['correspondent', 'title', 'letter_date', 'remarks', 'ocr_text'];
        }

        return $fields[$field];
    }

    /**
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        $payload = [
            'id' => $this->id,
            'office_id' => $this->office_id,
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
    public static function searchFieldOptions(bool $taxFields = true): array
    {
        $labels = $taxFields ? self::SEARCH_FIELD_LABELS : self::OTHER_SEARCH_FIELD_LABELS;
        $options = [];

        foreach ($labels as $value => $label) {
            $options[] = [
                'value' => $value,
                'label' => $label,
            ];
        }

        return $options;
    }

    /**
     * @return list<string>
     */
    public static function allowedSearchFields(bool $taxFields = true): array
    {
        return array_keys($taxFields ? self::SEARCH_FIELDS : self::OTHER_SEARCH_FIELDS);
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

        if ($this->storage_path !== '' && Storage::disk('local')->exists($this->storage_path)) {
            return route('documents.view', $this);
        }

        return null;
    }
}
