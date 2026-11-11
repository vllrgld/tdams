<?php

namespace App\Services\Documents;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\TaxDeclaration;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentSearcher
{
    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(
        string $search,
        string $field,
        int $perPage = 24,
        string $dateFrom = '',
        string $dateTo = '',
        string $addedFrom = '',
        string $addedTo = '',
        string $dateTimezone = 'UTC',
        string $sort = 'created_at',
        string $direction = 'desc',
        string $ocrReview = 'all',
    ): LengthAwarePaginator {
        $query = Document::query()->with(Document::archiveRelations());

        if ($search !== '') {
            $query->search($search, $field);
        }

        if ($ocrReview === 'reviewed') {
            $query->where('ocr_status', 'completed')->whereNotNull('ocr_reviewed_at');
        } elseif ($ocrReview === 'unreviewed') {
            $query->where(function (Builder $review): void {
                $review->whereNull('ocr_reviewed_at')->orWhere('ocr_status', '!=', 'completed');
            });
        }

        if ($dateFrom !== '' || $dateTo !== '') {
            $query->whereHas('taxDeclaration', function (Builder $declaration) use ($dateFrom, $dateTo): void {
                if ($dateFrom !== '') {
                    $declaration->whereDate('declaration_date', '>=', $dateFrom);
                }

                if ($dateTo !== '') {
                    $declaration->whereDate('declaration_date', '<=', $dateTo);
                }
            });
        }

        if ($addedFrom !== '') {
            $query->where('created_at', '>=', CarbonImmutable::parse($addedFrom, $dateTimezone)->startOfDay()->utc());
        }

        if ($addedTo !== '') {
            $query->where('created_at', '<=', CarbonImmutable::parse($addedTo, $dateTimezone)->endOfDay()->utc()->format('Y-m-d H:i:s.u'));
        }

        $direction = $direction === 'asc' ? 'asc' : 'desc';

        if ($sort === 'declaration_date') {
            $query->addSelect([
                'document_sort_date' => TaxDeclaration::query()
                    ->select('declaration_date')
                    ->whereColumn('tax_declarations.id', 'documents.tax_declaration_id')
                    ->limit(1),
            ])->orderByRaw('document_sort_date IS NULL')
                ->orderBy('document_sort_date', $direction);
        } else {
            $query->orderBy('created_at', $direction);
        }

        /** @var LengthAwarePaginator<int, array<string, mixed>> $page */
        $page = $query->orderBy('documents.id', $direction)->paginate($perPage)
            ->through(fn (Document $document): array => (new DocumentResource($document))->resolve());

        return $page->withQueryString();
    }
}
