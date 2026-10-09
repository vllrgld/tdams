<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $tax_declaration_number
 * @property string|null $lot_number
 * @property string|null $registered_owner
 * @property string|null $municipality
 * @property string|null $barangay
 * @property string|null $previous_tax_declaration_number
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
    'lot_number',
    'registered_owner',
    'municipality',
    'barangay',
    'previous_tax_declaration_number',
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
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
