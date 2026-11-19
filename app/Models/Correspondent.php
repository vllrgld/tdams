<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Document> $documents
 */
#[Fillable(['name'])]
class Correspondent extends Model
{
    public static function findOrCreateByName(string $name): self
    {
        $name = trim($name);
        $existing = self::query()->whereRaw('lower(name) = ?', [mb_strtolower($name)])->first();

        return $existing ?? self::query()->create(['name' => $name]);
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
