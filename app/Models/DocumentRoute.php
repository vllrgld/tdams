<?php

namespace App\Models;

use Database\Factories\DocumentRouteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int|null $documents_count
 * @property-read Collection<int, DocumentRouteStep> $steps
 * @property-read Collection<int, Document> $documents
 */
#[Fillable(['name'])]
class DocumentRoute extends Model
{
    /** @use HasFactory<DocumentRouteFactory> */
    use HasFactory;

    /**
     * @return HasMany<DocumentRouteStep, $this>
     */
    public function steps(): HasMany
    {
        return $this->hasMany(DocumentRouteStep::class)->orderBy('position');
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * @return array{id: int, name: string, steps: list<string>}
     */
    public function toOptionArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'steps' => array_values($this->steps->map(fn (DocumentRouteStep $step): string => $step->displayName())->all()),
        ];
    }
}
