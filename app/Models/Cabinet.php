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
     * @return array{id: string, name: string, location: string, drawers: list<array{id: string, label: string, range: string, books: list<array{id: string, label: string, kind: string, coverTitle: string, documentCount: int}>}>}
     */
    public function toFilingArray(): array
    {
        $drawers = [];

        foreach ($this->drawers as $drawer) {
            $books = [];

            foreach ($drawer->books as $book) {
                $books[] = [
                    'id' => (string) $book->id,
                    'label' => $book->label,
                    'kind' => $book->kind,
                    'coverTitle' => $book->cover_title !== '' ? $book->cover_title : Book::DEFAULT_COVER_TITLE,
                    'documentCount' => (int) ($book->documents_count ?? 0),
                ];
            }

            $drawers[] = ['id' => (string) $drawer->id, 'label' => $drawer->label, 'range' => $drawer->range ?? '', 'books' => $books];
        }

        return ['id' => (string) $this->id, 'name' => $this->name, 'location' => $this->location, 'drawers' => $drawers];
    }
}
