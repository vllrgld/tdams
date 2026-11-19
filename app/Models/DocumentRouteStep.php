<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $document_route_id
 * @property int|null $office_id
 * @property string $name
 * @property int $position
 * @property bool $can_take_action
 * @property bool $needs_endorsement
 * @property-read Office|null $office
 * @property-read DocumentRoute $route
 */
#[Fillable(['document_route_id', 'office_id', 'name', 'position', 'can_take_action', 'needs_endorsement'])]
class DocumentRouteStep extends Model
{
    public $timestamps = false;

    /** @var list<string> */
    protected $with = ['office'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'can_take_action' => 'boolean',
            'needs_endorsement' => 'boolean',
        ];
    }

    /** @return BelongsTo<Office, $this> */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function displayName(): string
    {
        return $this->office->name ?? $this->name;
    }

    /**
     * @return BelongsTo<DocumentRoute, $this>
     */
    public function route(): BelongsTo
    {
        return $this->belongsTo(DocumentRoute::class, 'document_route_id');
    }
}
