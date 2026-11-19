<?php

namespace App\Http\Resources;

use App\Models\Document;
use App\Models\DocumentRouteStep;
use App\Models\DocumentTransfer;
use App\Services\Documents\DocumentAuditRecorder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentLocationResource extends JsonResource
{
    public function __construct(private Document $document)
    {
        parent::__construct($document);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $document = $this->document;
        $book = $document->book;
        $isArchived = $document->filing_path === Document::FILING_ARCHIVE;
        $hasArchiveLocation = $isArchived && $book !== null && $book->drawer->cabinet->office_id === $document->office_id;
        $upload = $document->audits->first();
        $origin = $upload?->context['office'] ?? null;

        return [
            'office' => DocumentAuditRecorder::office($document->office),
            'destination' => DocumentAuditRecorder::office($document->pendingTransfer?->toOffice),
            'releasedAt' => $document->pendingTransfer?->released_at->toIso8601String(),
            'archived' => $isArchived,
            'archive' => $hasArchiveLocation ? [
                'bookId' => (string) $book->id,
                'cabinet' => $book->drawer->cabinet->name,
                'drawer' => $book->drawer->label,
                'item' => $book->label,
                'kind' => $book->kind,
            ] : null,
            'origin' => is_array($origin) ? ['office' => $origin, 'at' => $upload->occurred_at->toIso8601String()] : null,
            'routing' => $document->documentRoute === null ? null : [
                'name' => $document->documentRoute->name,
                'steps' => $document->documentRoute->steps->map(fn (DocumentRouteStep $step): array => [
                    'id' => $step->id,
                    'office' => DocumentAuditRecorder::office($step->office),
                    'name' => $step->displayName(),
                    'canTakeAction' => $step->can_take_action,
                    'needsEndorsement' => $step->needs_endorsement,
                ])->values()->all(),
            ],
            'transfers' => $document->transfers->map(fn (DocumentTransfer $transfer): array => [
                'id' => $transfer->id,
                'from' => DocumentAuditRecorder::office($transfer->fromOffice),
                'to' => DocumentAuditRecorder::office($transfer->toOffice),
                'releasedAt' => $transfer->released_at->toIso8601String(),
                'receivedAt' => $transfer->received_at?->toIso8601String(),
                'revertedAt' => $transfer->reverted_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }
}
