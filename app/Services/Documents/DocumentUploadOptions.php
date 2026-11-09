<?php

namespace App\Services\Documents;

use App\Models\Book;
use App\Models\Cabinet;

class DocumentUploadOptions
{
    /**
     * @return list<array{id: string, name: string, drawers: list<array{id: string, label: string, books: list<array{id: string, label: string, kind: string, coverTitle: string}>}>}>
     */
    public function archivePlacementTree(): array
    {
        $archive = [];

        foreach (Cabinet::query()->with('drawers.books')->orderBy('name')->get() as $cabinet) {
            $drawers = [];

            foreach ($cabinet->drawers as $drawer) {
                $books = [];

                foreach ($drawer->books as $book) {
                    $books[] = [
                        'id' => (string) $book->id,
                        'label' => $book->label,
                        'kind' => $book->kind,
                        'coverTitle' => $book->cover_title ?: Book::DEFAULT_COVER_TITLE,
                    ];
                }

                $drawers[] = ['id' => (string) $drawer->id, 'label' => $drawer->label, 'books' => $books];
            }

            $archive[] = ['id' => (string) $cabinet->id, 'name' => $cabinet->name, 'drawers' => $drawers];
        }

        return $archive;
    }
}
