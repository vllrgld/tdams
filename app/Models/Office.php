<?php

namespace App\Models;

use Database\Factories\OfficeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property bool $can_manage_routing
 * @property bool $can_route_documents
 * @property bool $can_upload_to_receiving
 * @property bool $can_manage_document_types
 * @property bool $can_take_document_action
 * @property bool $is_receiving
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int|null $documents_count
 * @property-read Collection<int, Document> $documents
 */
#[Fillable(['name', 'can_manage_routing', 'can_route_documents', 'can_upload_to_receiving', 'can_manage_document_types', 'can_take_document_action'])]
class Office extends Model
{
    public const RECEIVING_NAME = 'Receiving Office';

    public const PA_NAME = "Provincial Administrator's Office";

    /** @use HasFactory<OfficeFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'can_manage_routing' => 'boolean',
            'can_route_documents' => 'boolean',
            'can_upload_to_receiving' => 'boolean',
            'can_manage_document_types' => 'boolean',
            'can_take_document_action' => 'boolean',
            'is_receiving' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /** @return HasMany<Cabinet, $this> */
    public function cabinets(): HasMany
    {
        return $this->hasMany(Cabinet::class);
    }

    /** @return HasMany<DocumentRouteStep, $this> */
    public function routingSteps(): HasMany
    {
        return $this->hasMany(DocumentRouteStep::class);
    }
}
