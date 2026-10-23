<?php

namespace App\Models;

use Database\Factories\CabinetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property string $location
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Drawer> $drawers
 * @property-read int|null $drawers_count
 */
#[Fillable(['name', 'location'])]
class Cabinet extends Model
{
    /** @use HasFactory<CabinetFactory> */
    use HasFactory;

    /**
     * @return HasMany<Drawer, $this>
     */
    public function drawers(): HasMany
    {
        return $this->hasMany(Drawer::class)->orderBy('position');
    }

    /**
     * @return array{id: string, name: string, location: string, drawers: list<array{id: string, label: string, range: string, books: list<array{id: string, label: string, coverTitle: string, documentCount: int}>}>}
     */
    public function toFilingArray(): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'location' => $this->location,
            'drawers' => $this->drawers
                ->map(fn (Drawer $drawer): array => [
                    'id' => (string) $drawer->id,
                    'label' => $drawer->label,
                    'range' => $drawer->range ?? '',
                    'books' => $drawer->books
                        ->map(fn (Book $book): array => [
                            'id' => (string) $book->id,
                            'label' => $book->label,
                            'coverTitle' => $book->cover_title !== ''
                                ? $book->cover_title
                                : Book::DEFAULT_COVER_TITLE,
                            'documentCount' => (int) ($book->documents_count ?? 0),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }
}
