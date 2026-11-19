<?php

namespace App\Http\Resources;

use App\Models\DocumentAudit;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\SharedDocumentFields;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

class DocumentAuditResource extends JsonResource
{
    public function __construct(private DocumentAudit $audit)
    {
        parent::__construct($audit);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $definitions = [...DocumentFieldDefinitions::definitions(), ...SharedDocumentFields::metadataDefinitions()];
        $labels = ['text' => 'OCR text', 'ocr_reviewed' => 'OCR review', 'ocr_status' => 'OCR status', 'tracking_code' => 'Tracking code', 'document_route_id' => 'Routing', 'filing_path' => 'Filing', 'book_id' => 'Book or folder', 'position' => 'Position', 'description' => 'Description', 'page' => 'Page'];
        $changes = [];
        foreach ($this->audit->action === 'uploaded' ? [] : $this->audit->changes as $field => $change) {
            $changes[] = ['field' => $field, 'label' => $definitions[$field]['label'] ?? $labels[$field] ?? str($field)->replace('_', ' ')->ucfirst()->toString(), ...$change];
        }

        $contextKeys = match ($this->audit->action) {
            'uploaded' => [],
            'released', 'received' => ['fromOffice', 'toOffice'],
            'routing_changed' => ['routing'],
            'status_updated' => ['comments', 'reason'],
            'tracking_code_assigned' => ['trackingCode'],
            'ocr_corrected', 'attachment_added', 'attachment_updated', 'attachment_removed' => ['page'],
            'declaration_linked', 'fields_updated' => ['sharedRecord', 'automatic'],
            default => [],
        };

        return [
            'id' => $this->audit->id,
            'action' => $this->audit->action,
            'label' => DocumentAudit::LABELS[$this->audit->action] ?? 'Document activity',
            'actor' => ['id' => $this->audit->actor_id, 'name' => $this->audit->actor_name ?? ($this->audit->actor_type === 'system' ? 'System' : 'Unknown user'), 'type' => $this->audit->actor_type],
            'actingOffice' => $this->audit->actor_office_name,
            'occurredAt' => $this->audit->occurred_at->toIso8601String(),
            'imported' => $this->audit->imported,
            'context' => Arr::only($this->audit->context, $contextKeys),
            'changes' => $changes,
        ];
    }
}
