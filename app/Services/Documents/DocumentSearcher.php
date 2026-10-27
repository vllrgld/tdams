<?php

namespace App\Services\Documents;

use App\Models\Document;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentSearcher
{
    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(string $search, string $field, int $perPage = 20): LengthAwarePaginator
    {
        if ($search === '') {
            return $this->mapPage(Document::query()->latest()->paginate($perPage));
        }

        return $this->mapPage(
            Document::query()
                ->search($search, $field)
                ->latest()
                ->paginate($perPage),
        );
    }

    /**
     * @param  \Illuminate\Contracts\Pagination\LengthAwarePaginator<int, mixed>  $paginator
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    private function mapPage(\Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator): LengthAwarePaginator
    {
        $items = [];

        foreach (array_values($paginator->items()) as $document) {
            $items[] = $document instanceof Document
                ? $document->toArchiveArray()
                : [];
        }

        return (new LengthAwarePaginator(
            $items,
            $paginator->total(),
            $paginator->perPage(),
            $paginator->currentPage(),
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'pageName' => 'page',
            ],
        ))->withQueryString();
    }
}
