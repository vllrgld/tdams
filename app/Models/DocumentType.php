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
 * @property string $slug
 * @property bool $uses_tax_declaration_fields
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int|null $documents_count
 * @property-read Collection<int, Document> $documents
 */
#[Fillable(['name', 'slug', 'uses_tax_declaration_fields'])]
class DocumentType extends Model
{
    public const TAX_DECLARATION_SLUG = 'tax-declaration';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'uses_tax_declaration_fields' => 'boolean',
        ];
    }

    public static function taxDeclaration(): self
    {
        return self::query()->where('slug', self::TAX_DECLARATION_SLUG)->firstOrFail();
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * @return array{id: int, name: string, slug: string, usesTaxFields: bool, documentCount: int}
     */
    public function toOptionArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'usesTaxFields' => $this->uses_tax_declaration_fields,
            'documentCount' => (int) ($this->documents_count ?? 0),
        ];
    }
}
