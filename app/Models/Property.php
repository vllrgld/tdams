<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $pin
 * @property string|null $lot_number
 * @property string|null $title_number
 * @property numeric-string|null $area
 * @property string|null $province
 * @property string|null $street
 * @property string|null $barangay
 * @property string|null $district
 * @property string|null $municipality
 * @property string|null $boundary_north
 * @property string|null $boundary_northeast
 * @property string|null $boundary_east
 * @property string|null $boundary_southeast
 * @property string|null $boundary_south
 * @property string|null $boundary_southwest
 * @property string|null $boundary_west
 * @property string|null $boundary_northwest
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'pin',
    'lot_number',
    'title_number',
    'area',
    'province',
    'street',
    'barangay',
    'district',
    'municipality',
    'boundary_north',
    'boundary_northeast',
    'boundary_east',
    'boundary_southeast',
    'boundary_south',
    'boundary_southwest',
    'boundary_west',
    'boundary_northwest',
])]
class Property extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'area' => 'decimal:4',
        ];
    }

    /**
     * @return HasMany<TaxDeclaration, $this>
     */
    public function taxDeclarations(): HasMany
    {
        return $this->hasMany(TaxDeclaration::class);
    }
}
