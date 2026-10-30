<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $property_id
 * @property string|null $tax_declaration_number
 * @property Carbon|null $declaration_date
 * @property int|null $previous_declaration_id
 * @property string|null $previous_tax_declaration_number
 * @property Carbon|null $previous_declaration_date
 * @property string|null $remarks
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Property|null $property
 * @property-read TaxDeclaration|null $previousDeclaration
 */
#[Fillable([
    'property_id',
    'tax_declaration_number',
    'declaration_date',
    'previous_declaration_id',
    'previous_tax_declaration_number',
    'previous_declaration_date',
    'remarks',
])]
class TaxDeclaration extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'declaration_date' => 'date',
            'previous_declaration_date' => 'date',
            'property_id' => 'integer',
            'previous_declaration_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * @return BelongsTo<TaxDeclaration, $this>
     */
    public function previousDeclaration(): BelongsTo
    {
        return $this->belongsTo(self::class, 'previous_declaration_id');
    }

    /**
     * @return HasMany<TaxDeclaration, $this>
     */
    public function followingDeclarations(): HasMany
    {
        return $this->hasMany(self::class, 'previous_declaration_id');
    }

    /**
     * @return BelongsToMany<Owner, $this>
     */
    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(Owner::class, 'declaration_owners')
            ->withPivot('position')
            ->orderBy('declaration_owners.position');
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
