<?php

namespace App\Services\Documents;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentSearcher
{
    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(string $search, string $field, int $perPage = 20): LengthAwarePaginator
    {
        $query = Document::query()->with(Document::archiveRelations());

        if ($search !== '') {
            $query->search($search, $field);
        }

        /** @var LengthAwarePaginator<int, array<string, mixed>> $page */
        $page = $query->latest()->latest('id')->paginate($perPage)
            ->through(fn (Document $document): array => (new DocumentResource($document))->resolve());

        return $page->withQueryString();
    }
}
