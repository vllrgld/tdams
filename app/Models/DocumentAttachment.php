<?php

namespace App\Models;

use Database\Factories\DocumentAttachmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property string $description
 * @property int|null $page
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Document $document
 */
#[Fillable([
    'document_id',
    'description',
    'page',
    'position',
])]
class DocumentAttachment extends Model
{
    /** @use HasFactory<DocumentAttachmentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'document_id' => 'integer',
            'page' => 'integer',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * @return array{id: int, description: string, page: int|null}
     */
    public function toArrayPayload(): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'page' => $this->page,
        ];
    }
}
