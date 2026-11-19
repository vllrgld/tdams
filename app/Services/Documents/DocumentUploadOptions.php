<?php

namespace App\Services\Documents;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\User;
use App\Services\Offices\CurrentOffice;

class DocumentUploadOptions
{
    public function __construct(private CurrentOffice $currentOffice) {}

    /** @return list<string> */
    public function recentArchiveItemIds(User $user): array
    {
        $officeId = $this->currentOffice->id();

        return array_values(Document::query()
            ->where('office_id', $officeId)
            ->where('uploaded_by', $user->id)
            ->where('filing_path', Document::FILING_ARCHIVE)
            ->whereIn('book_id', Book::query()->forOffice($officeId)->select('books.id'))
            ->groupBy('book_id')
            ->orderByRaw('MAX(documents.id) DESC')
            ->limit(2)
            ->pluck('book_id')
            ->map(fn ($id): string => (string) $id)
            ->all());
    }

    /**
     * @return list<array{id: string, name: string, color: string, drawers: list<array{id: string, label: string, books: list<array{id: string, label: string, kind: string, coverTitle: string}>}>}>
     */
    public function archivePlacementTree(): array
    {
        $archive = [];

        foreach (Cabinet::query()->forOffice($this->currentOffice->id())->with('drawers.books')->orderBy('name')->get() as $cabinet) {
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

            $archive[] = ['id' => (string) $cabinet->id, 'name' => $cabinet->name, 'color' => $cabinet->color, 'drawers' => $drawers];
        }

        return $archive;
    }
}
