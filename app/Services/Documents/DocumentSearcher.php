<?php

namespace App\Services\Documents;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\TaxDeclaration;
use App\Services\Offices\CurrentOffice;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class DocumentSearcher
{
    public function __construct(private CurrentOffice $currentOffice) {}

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
        ?int $documentTypeId = null,
        bool $usesTaxFields = false,
        string $status = 'all',
        string $dateField = 'declaration_date',
    ): LengthAwarePaginator {
        $query = Document::query()->with(Document::archiveRelations());
        $this->currentOffice->constrain($query);

        if ($search !== '') {
            $query->search($search, $field, $usesTaxFields);
        }

        if ($documentTypeId !== null) {
            $query->where('document_type_id', $documentTypeId);
        }

        if ($status !== 'all') {
            $query->where('status', $status)
                ->whereHas('documentType', function (Builder $type): void {
                    $type->where('uses_tax_declaration_fields', false);
                });
        }

        if ($ocrReview === 'reviewed') {
            $query->where('ocr_status', 'completed')->whereNotNull('ocr_reviewed_at');
        } elseif ($ocrReview === 'unreviewed') {
            $query->where(function (Builder $review): void {
                $review->whereNull('ocr_reviewed_at')->orWhere('ocr_status', '!=', 'completed');
            });
        }

        if (($dateFrom !== '' || $dateTo !== '') && $dateField === 'letter_date') {
            if ($dateFrom !== '') {
                $query->whereDate('letter_date', '>=', $dateFrom);
            }
            if ($dateTo !== '') {
                $query->whereDate('letter_date', '<=', $dateTo);
            }
        } elseif ($dateFrom !== '' || $dateTo !== '') {
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
