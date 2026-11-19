<?php

namespace App\Services\Documents;

use App\Models\Document;
use App\Models\DocumentEndorsement;
use App\Models\DocumentRouteStep;
use App\Models\Office;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentWorkflow
{
    public function __construct(private DocumentAuditRecorder $audit) {}

    public function currentStep(Document $document): ?DocumentRouteStep
    {
        return $document->routing_started
            ? $document->documentRoute?->steps->first(fn (DocumentRouteStep $step): bool => $step->office_id === $document->office_id)
            : null;
    }

    public function endorsed(Document $document, DocumentRouteStep $step): ?DocumentEndorsement
    {
        $document->loadMissing('endorsements');

        return $document->endorsements->first(fn (DocumentEndorsement $endorsement): bool => $endorsement->routing_version === $document->routing_version
            && $endorsement->document_route_step_id === $step->id && $endorsement->office_id === $step->office_id);
    }

    /** @return array<string, mixed> */
    public function details(Document $document, Office $office): array
    {
        $document->load(['documentRoute.steps.office', 'pendingTransfer']);
        $step = $this->currentStep($document);
        $endorsement = $step === null ? null : $this->endorsed($document, $step);
        $reason = $this->actionBlock($document, $office);
        $decision = in_array($document->status, Document::DECISION_STATUSES, true)
            ? $document->audits()->where('action', 'status_updated')->latest('id')->first()
            : null;

        return [
            'status' => $document->status,
            'label' => Document::STATUS_LABELS[$document->status] ?? $document->status,
            'canTakeAction' => $reason === null,
            'actionBlock' => $reason,
            'canEndorse' => $document->office_id === $office->id && $document->pendingTransfer === null && $step?->needs_endorsement === true && $endorsement === null,
            'endorsementRequired' => $step === null ? false : $step->needs_endorsement,
            'endorsedAt' => $endorsement?->endorsed_at->toIso8601String(),
            'routingName' => $document->documentRoute?->name,
            'routingVersion' => $document->routing_version,
            'decision' => $decision === null ? null : [
                'status' => $document->status,
                'comments' => $decision->context['comments'] ?? null,
                'actorName' => $decision->actor_name ?? 'Unknown user',
                'officeName' => $decision->actor_office_name,
                'decidedAt' => $decision->occurred_at->toIso8601String(),
            ],
        ];
    }

    public function actionBlock(Document $document, Office $office): ?string
    {
        if ($document->usesTaxDeclarationFields()) {
            return 'Approval actions are not used for tax declarations.';
        }
        if ($document->filing_path === Document::FILING_ARCHIVE || $document->status === Document::STATUS_ARCHIVED) {
            return 'Archived documents do not require approval actions.';
        }
        if (in_array($document->status, [...Document::DECISION_STATUSES, 'completed'], true)) {
            return 'A final decision has already been recorded for this document.';
        }
        if ($document->office_id !== $office->id || $document->pendingTransfer()->exists()) {
            return 'The document must be received by your office before taking action.';
        }
        if (! $office->can_take_document_action) {
            return 'Your office does not have permission to take action on documents.';
        }
        $route = $document->documentRoute;
        if ($route === null) {
            return null;
        }
        if ($route->steps->contains(fn (DocumentRouteStep $step): bool => $step->office_id === null)) {
            return 'Assign an available office to every routing step before taking action.';
        }
        $step = $this->currentStep($document);
        if ($step === null || $route->steps->last()?->id !== $step->id) {
            return 'Complete the fixed routing before taking action on this document.';
        }
        if (! $step->can_take_action) {
            return 'This office is not allowed to take action in the fixed routing.';
        }
        foreach ($route->steps as $required) {
            if ($required->needs_endorsement && $this->endorsed($document, $required) === null) {
                return 'Complete all required office endorsements before taking action.';
            }
        }

        return null;
    }

    public function endorse(int $documentId, Office $office, User $user): Document
    {
        return DB::transaction(function () use ($documentId, $office, $user): Document {
            $document = Document::query()->whereKey($documentId)->where('office_id', $office->id)->lockForUpdate()->firstOrFail();
            abort_if($document->pendingTransfer()->exists(), 403, 'Receive the document before endorsing it.');
            $this->endorseCurrent($document, $office, $user);

            return $document;
        }, 3);
    }

    public function endorseCurrent(Document $document, Office $office, User $user): void
    {
        $step = $this->currentStep($document);
        abort_unless($step?->needs_endorsement === true && $step->office_id === $office->id, 403, 'This office does not have a required endorsement in the current routing.');
        if ($this->endorsed($document, $step) !== null) {
            return;
        }
        DocumentEndorsement::query()->create([
            'document_id' => $document->id, 'routing_version' => $document->routing_version,
            'document_route_step_id' => $step->id, 'office_id' => $office->id,
            'endorsed_by' => $user->id, 'endorsed_at' => now(),
        ]);
        $document->unsetRelation('endorsements');
        $this->audit->record($document, 'endorsed', actor: $user, office: $office);
    }

    public function ensureReleaseAllowed(Document $document): void
    {
        $step = $this->currentStep($document);
        if ($step?->needs_endorsement && $this->endorsed($document, $step) === null) {
            throw ValidationException::withMessages(['document_id' => 'Your office must endorse this document before releasing it.']);
        }
    }

    public function updateStatus(int $documentId, Office $office, User $user, string $status, ?string $comments, int $routingVersion): Document
    {
        return DB::transaction(function () use ($documentId, $office, $user, $status, $comments, $routingVersion): Document {
            $document = Document::query()->whereKey($documentId)->where('office_id', $office->id)->lockForUpdate()->firstOrFail();
            $office = Office::query()->whereKey($office->id)->sharedLock()->firstOrFail();
            if ($document->routing_version !== $routingVersion) {
                throw ValidationException::withMessages(['routing_version' => 'The routing changed. Reopen Take action to review the current workflow.']);
            }
            if (! in_array($status, Document::DECISION_STATUSES, true)) {
                throw ValidationException::withMessages(['status' => 'Choose approve or disapprove.']);
            }
            abort_if(($reason = $this->actionBlock($document, $office)) !== null, 403, $reason ?? 'Action is not allowed.');
            if ($document->status !== $status) {
                $before = $document->status;
                $document->status = $status;
                $document->save();
                $this->audit->record($document, 'status_updated', ['status' => ['before' => Document::STATUS_LABELS[$before] ?? $before, 'after' => Document::STATUS_LABELS[$status]]], ['comments' => $comments, 'routingVersion' => $routingVersion], actor: $user, office: $office);
            }

            return $document;
        }, 3);
    }
}
