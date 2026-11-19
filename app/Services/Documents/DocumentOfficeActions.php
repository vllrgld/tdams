<?php

namespace App\Services\Documents;

use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentRouteStep;
use App\Models\DocumentTransfer;
use App\Models\Office;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentOfficeActions
{
    public function __construct(private DocumentTrackingCodes $trackingCodes, private DocumentAuditRecorder $audit, private DocumentWorkflow $workflow) {}

    /** @return array{officeId: int, canRouteDocuments: bool, routing: list<array<string, mixed>>, documents: list<array<string, mixed>>, hasMore: bool} */
    public function options(Office $office, string $action, string $search): array
    {
        $query = Document::query()
            ->select(['id', 'office_id', 'document_route_id', 'routing_started', 'routing_version', 'tax_declaration_id', 'title', 'original_filename', 'tracking_code'])
            ->with(['taxDeclaration:id,tax_declaration_number', 'documentRoute.steps', 'pendingTransfer.fromOffice', 'endorsements']);

        if ($action === 'receive') {
            $query->whereHas('pendingTransfer', fn (Builder $transfer) => $this->receivable($transfer, $office));
        } elseif ($action === 'revert') {
            $query->where('office_id', $office->id)->whereHas('pendingTransfer', fn (Builder $transfer) => $transfer->whereIn('id', $this->recentReleaseIds($office)));
        } else {
            $query->where('office_id', $office->id)->whereDoesntHave('pendingTransfer');
        }

        if ($search !== '') {
            $query->where(function (Builder $document) use ($search): void {
                $document->whereLike('title', '%'.$search.'%')
                    ->orWhereLike('tracking_code', '%'.strtoupper($search).'%')
                    ->orWhereLike('original_filename', '%'.$search.'%')
                    ->orWhereHas('taxDeclaration', fn (Builder $declaration) => $declaration->whereLike('tax_declaration_number', '%'.$search.'%'));
            });
        }

        $documents = $query->orderByDesc('id')->limit(51)->get();
        if ($action === 'revert') {
            $documents = $documents->sortByDesc(fn (Document $document): ?int => $document->pendingTransfer?->id);
        }

        return [
            'officeId' => $office->id,
            'canRouteDocuments' => $office->can_route_documents,
            'routing' => $action === 'release' && $office->can_route_documents
                ? array_values(DocumentRoute::query()->with('steps')->orderBy('name')->get()->map(function (DocumentRoute $route) use ($office): array {
                    [$next, $reason] = $this->routingDestination($route, $route->steps->first()?->office_id === $office->id ? $office->id : null);

                    return [
                        ...$route->toOptionArray(),
                        'nextOfficeId' => $next?->id,
                        'nextOfficeName' => $next?->name,
                        'releaseError' => $reason,
                        'endorsementRequired' => $route->steps->first()?->office_id === $office->id && $route->steps->first()->needs_endorsement,
                    ];
                })->all())
                : [],
            'documents' => array_values($documents->take(50)->map(function (Document $document): array {
                [$next, $reason] = $this->nextOffice($document);

                return [
                    'id' => $document->id,
                    'title' => $document->title ?: $document->taxDeclaration?->tax_declaration_number ?: $document->original_filename,
                    'filename' => $document->original_filename,
                    'trackingCode' => $document->tracking_code,
                    'transferId' => $document->pendingTransfer?->id,
                    'releasedAt' => $document->pendingTransfer?->released_at->toIso8601String(),
                    'routeName' => $document->documentRoute?->name,
                    'routeId' => $document->document_route_id,
                    'nextOfficeId' => $next?->id,
                    'nextOfficeName' => $next?->name,
                    'releaseError' => $reason,
                    'fromOfficeName' => $document->pendingTransfer?->fromOffice->name,
                    'endorsementRequired' => ($step = $this->workflow->currentStep($document))?->needs_endorsement === true && $this->workflow->endorsed($document, $step) === null,
                ];
            })->all()),
            'hasMore' => $documents->count() > 50,
        ];
    }

    /** @param array{document_route_id?: int|null} $routing */
    public function release(int $documentId, Office $office, User $user, ?int $destinationId, array $routing = [], bool $endorse = false): DocumentTransfer
    {
        return DB::transaction(function () use ($documentId, $office, $user, $destinationId, $routing, $endorse): DocumentTransfer {
            $document = Document::query()->whereKey($documentId)->where('office_id', $office->id)->lockForUpdate()->firstOrFail();
            $before = $document->only(['document_route_id', 'filing_path', 'book_id', 'position']);
            $previousRouting = $document->documentRoute?->name;
            $previousBook = $document->book;
            $previousLocation = $previousBook === null ? null : [
                'cabinet' => $previousBook->drawer->cabinet->name,
                'drawer' => $previousBook->drawer->label,
                'item' => $previousBook->label,
            ];

            if ($document->pendingTransfer()->exists()) {
                throw ValidationException::withMessages(['document_id' => 'This document has already been released and is awaiting receipt.']);
            }

            $permissions = Office::query()->whereKey($office->id)->lockForUpdate()->firstOrFail();

            if (($current = $this->workflow->currentStep($document))?->needs_endorsement === true) {
                if ($endorse) {
                    $this->workflow->endorseCurrent($document, $office, $user);
                }
                $this->workflow->ensureReleaseAllowed($document);
            }

            if (array_key_exists('document_route_id', $routing)) {
                abort_unless($permissions->can_route_documents, 403, 'Your office cannot assign routing.');
                $document->document_route_id = $routing['document_route_id'];
                $document->unsetRelation('documentRoute');
                if ($before['document_route_id'] !== $document->document_route_id) {
                    $document->routing_version++;
                    $document->routing_started = $document->documentRoute?->steps->first()?->office_id === $office->id;
                }
            }

            if ($document->document_route_id !== null) {
                $route = $document->documentRoute()->lockForUpdate()->first();

                if ($route === null) {
                    throw ValidationException::withMessages(['document_route_id' => 'Select available routing.']);
                }

                $document->setRelation('documentRoute', $route);
                if ($before['document_route_id'] !== $document->document_route_id) {
                    $document->routing_started = $route->steps->first()?->office_id === $office->id;
                }
            }

            [$next, $reason] = $this->nextOffice($document);

            if ($reason !== null) {
                throw ValidationException::withMessages(['document_id' => $reason]);
            }

            if ($endorse && $this->workflow->currentStep($document)?->needs_endorsement === true) {
                $this->workflow->endorseCurrent($document, $office, $user);
            }
            $this->workflow->ensureReleaseAllowed($document);

            if ($next !== null && $destinationId !== null && $destinationId !== $next->id) {
                throw ValidationException::withMessages(['destination_office_id' => 'Release this document to the next office in its fixed routing.']);
            }

            $destination = $next === null ? null : Office::query()->whereKey($next->id)->sharedLock()->firstOrFail();

            if ($document->filing_path !== Document::FILING_ROUTE) {
                $document->filing_path = Document::FILING_ROUTE;
                $document->book_id = null;
                $document->position = null;
            }

            $previousStatus = $document->status;
            $startedRouting = $document->startRouting();
            $document->save();

            $this->trackingCodes->assign($document);

            $transfer = $document->transfers()->create([
                'from_office_id' => $office->id,
                'to_office_id' => $destination?->id,
                'released_by' => $user->id,
                'released_at' => now(),
            ]);
            if ($before['document_route_id'] !== $document->document_route_id) {
                $this->audit->record($document, 'routing_changed', ['document_route_id' => ['before' => $previousRouting, 'after' => $document->documentRoute?->name]], actor: $user, office: $office);
            }
            if ($startedRouting) {
                $this->audit->record($document, 'status_updated', ['status' => ['before' => Document::STATUS_LABELS[$previousStatus], 'after' => Document::STATUS_LABELS[$document->status]]], ['reason' => 'fixed_routing'], actor: $user, office: $office);
            }
            $this->audit->record($document, 'released', $this->audit->changes($before, $document->only(['filing_path', 'book_id', 'position'])), [
                'fromOffice' => DocumentAuditRecorder::office($office),
                'toOffice' => DocumentAuditRecorder::office($destination),
                'transferId' => $transfer->id,
                'previousLocation' => $previousLocation,
            ], actor: $user, office: $office);

            return $transfer;
        }, 3);
    }

    public function receive(int $documentId, Office $office, User $user): Document
    {
        return DB::transaction(function () use ($documentId, $office, $user): Document {
            $document = Document::query()->whereKey($documentId)->where(function (Builder $visible) use ($office): void {
                $visible->where('office_id', $office->id)
                    ->orWhereHas('pendingTransfer', fn (Builder $transfer) => $this->receivable($transfer, $office));
            })->lockForUpdate()->firstOrFail();
            $pending = $document->pendingTransfer()->lockForUpdate()->first();

            if (! $pending instanceof DocumentTransfer || $pending->from_office_id === $office->id || ($pending->to_office_id !== null && $pending->to_office_id !== $office->id)) {
                throw ValidationException::withMessages(['document_id' => 'This document is not awaiting receipt at this office.']);
            }

            $pending->update(['to_office_id' => $office->id, 'received_by' => $user->id, 'received_at' => now()]);
            $document->forceFill(['office_id' => $office->id, 'routing_started' => true])->save();
            $this->audit->record($document, 'received', context: [
                'fromOffice' => DocumentAuditRecorder::office($pending->fromOffice),
                'toOffice' => DocumentAuditRecorder::office($office),
                'transferId' => $pending->id,
            ], actor: $user, office: $office);

            return $document;
        }, 3);
    }

    public function revert(int $documentId, int $transferId, Office $office, User $user): Document
    {
        return DB::transaction(function () use ($documentId, $transferId, $office, $user): Document {
            $document = Document::query()->whereKey($documentId)->where('office_id', $office->id)->lockForUpdate()->firstOrFail();
            Office::query()->whereKey($office->id)->lockForUpdate()->firstOrFail();
            $pending = $document->pendingTransfer()->whereKey($transferId)->lockForUpdate()->first();

            if (! $pending instanceof DocumentTransfer || $pending->from_office_id !== $office->id || ! in_array($pending->id, $this->recentReleaseIds($office), true)) {
                throw ValidationException::withMessages(['document_id' => 'Only your office’s last three releases can be reverted, before another office receives them.']);
            }

            $pending->update(['reverted_by' => $user->id, 'reverted_at' => now()]);
            $this->audit->record($document, 'release_reverted', context: [
                'fromOffice' => DocumentAuditRecorder::office($office),
                'toOffice' => DocumentAuditRecorder::office($pending->toOffice),
                'transferId' => $pending->id,
            ], actor: $user, office: $office);

            return $document;
        }, 3);
    }

    /** @return list<int> */
    private function recentReleaseIds(Office $office): array
    {
        return array_values(DocumentTransfer::query()->where('from_office_id', $office->id)->orderByDesc('id')->limit(3)->get(['id'])->map(fn (DocumentTransfer $transfer): int => $transfer->id)->all());
    }

    /** @param Builder<DocumentTransfer> $query */
    private function receivable(Builder $query, Office $office): void
    {
        $query->where('from_office_id', '!=', $office->id)->where(function (Builder $destination) use ($office): void {
            $destination->where('to_office_id', $office->id)->orWhereNull('to_office_id');
        });
    }

    /** @return array{Office|null, string|null} */
    private function nextOffice(Document $document): array
    {
        return $this->routingDestination($document->documentRoute, $document->routing_started ? $document->office_id : null);
    }

    /** @return array{Office|null, string|null} */
    private function routingDestination(?DocumentRoute $routing, ?int $officeId): array
    {

        if ($routing === null) {
            return [null, null];
        }

        $steps = $routing->steps;

        if ($steps->isEmpty() || $steps->contains(fn (DocumentRouteStep $step): bool => $step->office_id === null)) {
            return [null, 'Assign offices to every step in Routing before releasing this document.'];
        }

        $current = $steps->first(fn (DocumentRouteStep $step): bool => $step->office_id === $officeId);
        $next = $current === null ? $steps->first() : $steps->first(fn (DocumentRouteStep $step): bool => $step->position > $current->position);

        return $next === null
            ? [null, 'This document has reached the last office in its fixed routing.']
            : [$next->office, null];
    }
}
