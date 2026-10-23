<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property int $drawer_id
 * @property string $label
 * @property string $cover_title
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Drawer $drawer
 * @property-read Collection<int, Document> $documents
 * @property-read int|null $documents_count
 */
#[Fillable(['drawer_id', 'label', 'cover_title', 'position'])]
class Book extends Model
{
    /** @use HasFactory<BookFactory> */
    use HasFactory;

    public const MAX_PER_DRAWER = 16;

    public const DEFAULT_COVER_TITLE = 'Tax Declaration';

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'cover_title' => 'Tax Declaration',
    ];

    public static function coverTitle(): string
    {
        $title = self::query()->value('cover_title');

        return is_string($title) && $title !== ''
            ? $title
            : self::DEFAULT_COVER_TITLE;
    }

    /**
     * @return BelongsTo<Drawer, $this>
     */
    public function drawer(): BelongsTo
    {
        return $this->belongsTo(Drawer::class);
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->orderBy('position');
    }

    public function nextDocumentPosition(): int
    {
        return ((int) $this->documents()->max('position')) + 1;
    }
}
