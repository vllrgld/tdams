<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $normalized_name
 * @property string|null $street
 * @property string|null $barangay
 * @property string|null $district
 * @property string|null $municipality
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'normalized_name',
    'street',
    'barangay',
    'district',
    'municipality',
])]
class Owner extends Model
{
    /**
     * @return BelongsToMany<TaxDeclaration, $this>
     */
    public function taxDeclarations(): BelongsToMany
    {
        return $this->belongsToMany(TaxDeclaration::class, 'declaration_owners')
            ->withPivot('position');
    }

    public static function normalizeName(?string $name): string
    {
        return mb_strtolower(trim($name ?? ''));
    }
}
