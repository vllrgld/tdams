<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tax_declaration_id
 * @property int $owner_id
 * @property int $position
 */
#[Fillable([
    'tax_declaration_id',
    'owner_id',
    'position',
])]
class DeclarationOwner extends Model
{
    public $timestamps = false;

    /**
     * @return BelongsTo<TaxDeclaration, $this>
     */
    public function taxDeclaration(): BelongsTo
    {
        return $this->belongsTo(TaxDeclaration::class);
    }

    /**
     * @return BelongsTo<Owner, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }
}
