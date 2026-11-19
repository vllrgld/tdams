<?php

namespace App\Models;

use Database\Factories\DocumentAuditFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * @property int $id
 * @property int|null $document_id
 * @property int $document_reference
 * @property string $action
 * @property string $actor_type
 * @property int|null $actor_id
 * @property string|null $actor_name
 * @property int|null $actor_office_id
 * @property string|null $actor_office_name
 * @property array<string, mixed> $context
 * @property array<string, array{before: mixed, after: mixed}> $changes
 * @property bool $imported
 * @property Carbon $occurred_at
 */
#[Fillable(['document_id', 'document_reference', 'action', 'actor_type', 'actor_id', 'actor_name', 'actor_office_id', 'actor_office_name', 'context', 'changes', 'imported', 'occurred_at'])]
class DocumentAudit extends Model
{
    /** @use HasFactory<DocumentAuditFactory> */
    use HasFactory;

    public $timestamps = false;

    public const ACTIVITY_ACTIONS = [
        'uploaded', 'fields_updated', 'declaration_linked', 'released', 'release_reverted', 'received',
        'routing_changed', 'tracking_code_assigned', 'status_updated', 'endorsed',
        'attachment_added', 'attachment_updated', 'attachment_removed',
    ];

    public const OCR_ACTIONS = [
        'ocr_started', 'ocr_completed', 'ocr_failed', 'ocr_retried', 'ocr_corrected',
        'ocr_reviewed', 'ocr_review_reopened', 'mapping_generated', 'mapping_failed',
    ];

    public const LABELS = [
        'uploaded' => 'Document uploaded',
        'file_accessed' => 'Document file requested',
        'fields_updated' => 'Document information updated',
        'declaration_linked' => 'Previous declaration linked',
        'released' => 'Document released',
        'release_reverted' => 'Release reverted',
        'received' => 'Document received',
        'routing_changed' => 'Routing changed',
        'status_updated' => 'Document status updated',
        'endorsed' => 'Document endorsed',
        'tracking_code_assigned' => 'Tracking code assigned',
        'ocr_started' => 'OCR started',
        'ocr_completed' => 'OCR completed',
        'ocr_failed' => 'OCR failed',
        'ocr_retried' => 'OCR requested again',
        'ocr_corrected' => 'OCR text corrected',
        'ocr_reviewed' => 'OCR marked reviewed',
        'ocr_review_reopened' => 'OCR review reopened',
        'mapping_generated' => 'Mapping suggestions generated',
        'mapping_failed' => 'Mapping request failed',
        'attachment_added' => 'Attachment added',
        'attachment_updated' => 'Attachment updated',
        'attachment_removed' => 'Attachment removed',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['context' => 'array', 'changes' => 'array', 'imported' => 'boolean', 'occurred_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(static function (): never {
            throw new LogicException('Document audit entries cannot be edited.');
        });
        static::deleting(static function (): never {
            throw new LogicException('Document audit entries cannot be deleted individually.');
        });
    }
}
