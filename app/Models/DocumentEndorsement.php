<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property int $routing_version
 * @property int $document_route_step_id
 * @property int $office_id
 * @property int|null $endorsed_by
 * @property Carbon $endorsed_at
 */
#[Fillable(['document_id', 'routing_version', 'document_route_step_id', 'office_id', 'endorsed_by', 'endorsed_at'])]
class DocumentEndorsement extends Model
{
    public $timestamps = false;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['endorsed_at' => 'datetime'];
    }
}
