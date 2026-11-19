<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $document_id
 * @property int $from_office_id
 * @property int|null $to_office_id
 * @property int|null $released_by
 * @property int|null $received_by
 * @property Carbon $released_at
 * @property Carbon|null $received_at
 * @property Carbon|null $reverted_at
 * @property int|null $reverted_by
 * @property-read Office $fromOffice
 * @property-read Office|null $toOffice
 * @property-read Document $document
 */
#[Fillable(['document_id', 'from_office_id', 'to_office_id', 'released_by', 'received_by', 'released_at', 'received_at', 'reverted_at', 'reverted_by'])]
class DocumentTransfer extends Model
{
    public $timestamps = false;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['released_at' => 'datetime', 'received_at' => 'datetime', 'reverted_at' => 'datetime'];
    }

    /** @return BelongsTo<Document, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /** @return BelongsTo<Office, $this> */
    public function fromOffice(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'from_office_id');
    }

    /** @return BelongsTo<Office, $this> */
    public function toOffice(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'to_office_id');
    }
}
