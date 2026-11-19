<?php

namespace App\Services\Documents;

use App\Models\Document;
use App\Models\DocumentAudit;
use App\Models\Office;
use App\Models\User;
use App\Services\Offices\CurrentOffice;
use DateTimeInterface;
use Illuminate\Http\Request;

class DocumentAuditRecorder
{
    public function __construct(private Request $request, private CurrentOffice $currentOffice) {}

    /**
     * @param  array<string, array{before: mixed, after: mixed}>  $changes
     * @param  array<string, mixed>  $context
     */
    public function record(Document $document, string $action, array $changes = [], array $context = [], bool $system = false, ?User $actor = null, ?Office $office = null): DocumentAudit
    {
        $actor = $system ? null : ($actor ?? $this->request->user());
        $office = $system ? null : ($office ?? $this->currentOffice->office());
        $document->load(['office', 'book.drawer.cabinet', 'documentRoute.steps.office']);
        $book = $document->book;

        return $document->audits()->create([
            'document_reference' => $document->id,
            'action' => $action,
            'actor_type' => $actor instanceof User ? 'user' : 'system',
            'actor_id' => $actor?->getAuthIdentifier(),
            'actor_name' => $actor?->name,
            'actor_office_id' => $office?->id,
            'actor_office_name' => $office?->name,
            'context' => [
                'office' => self::office($document->office),
                'location' => $book === null ? null : [
                    'cabinet' => $book->drawer->cabinet->name,
                    'drawer' => $book->drawer->label,
                    'item' => $book->label,
                    'kind' => $book->kind,
                ],
                'filingPath' => $document->filing_path,
                'trackingCode' => $document->tracking_code,
                'routing' => $document->documentRoute === null ? null : [
                    'id' => $document->documentRoute->id,
                    'name' => $document->documentRoute->name,
                    'steps' => $document->documentRoute->steps->map(fn ($step): array => [
                        'office' => self::office($step->office),
                        'canTakeAction' => $step->can_take_action,
                        'needsEndorsement' => $step->needs_endorsement,
                    ])->all(),
                ],
                ...$context,
            ],
            'changes' => $changes,
            'imported' => false,
            'occurred_at' => now(),
        ]);
    }

    /** @return array{id: int, name: string}|null */
    public static function office(?Office $office): ?array
    {
        return $office === null ? null : ['id' => $office->id, 'name' => $office->name];
    }

    /** @return array<string, mixed> */
    public function fields(Document $document): array
    {
        $fields = [];
        foreach (array_unique([...Document::RECORD_FIELDS, ...SharedDocumentFields::METADATA_COLUMNS]) as $name) {
            $value = $document->getAttribute($name);
            $fields[$name] = $value instanceof DateTimeInterface ? $value->format('Y-m-d') : $value;
        }
        $fields['correspondent'] = $document->correspondent?->name;
        $fields['document_type_id'] = $document->document_type_id;

        return $fields;
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @return array<string, array{before: mixed, after: mixed}>
     */
    public function changes(array $before, array $after): array
    {
        $changes = [];
        foreach ($after as $key => $value) {
            $previous = $before[$key] ?? null;
            if ($previous !== $value) {
                $changes[$key] = ['before' => $previous, 'after' => $value];
            }
        }

        return $changes;
    }
}
