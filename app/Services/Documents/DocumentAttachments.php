<?php

namespace App\Services\Documents;

use App\Models\Document;
use App\Models\DocumentAttachment;
use Illuminate\Support\Facades\DB;

class DocumentAttachments
{
    public function __construct(private DocumentAuditRecorder $audit) {}

    /** @param array{description: string, page?: int|null} $fields */
    public function store(Document $document, array $fields): Document
    {
        return DB::transaction(function () use ($document, $fields): Document {
            $locked = $this->lock($document);
            $attachment = $locked->attachments()->create([
                'description' => $fields['description'],
                'page' => $fields['page'] ?? null,
                'position' => ((int) $locked->attachments()->max('position')) + 1,
            ]);
            $this->audit->record($locked, 'attachment_added', $this->audit->changes([], $attachment->only(['description', 'page'])), ['attachmentId' => $attachment->id]);

            return $locked->refresh()->load(Document::archiveRelations());
        }, 3);
    }

    /** @param array{description?: string, page?: int|null} $fields */
    public function update(Document $document, DocumentAttachment $attachment, array $fields): Document
    {
        return DB::transaction(function () use ($document, $attachment, $fields): Document {
            $locked = $this->lock($document);
            $item = $locked->attachments()->whereKey($attachment->id)->lockForUpdate()->firstOrFail();
            $before = $item->only(['description', 'page']);
            $item->fill($fields)->save();
            $changes = $this->audit->changes($before, $item->only(['description', 'page']));
            if ($changes !== []) {
                $this->audit->record($locked, 'attachment_updated', $changes, ['attachmentId' => $item->id]);
            }

            return $locked->refresh()->load(Document::archiveRelations());
        }, 3);
    }

    public function destroy(Document $document, DocumentAttachment $attachment): Document
    {
        return DB::transaction(function () use ($document, $attachment): Document {
            $locked = $this->lock($document);
            $item = $locked->attachments()->whereKey($attachment->id)->lockForUpdate()->firstOrFail();
            $changes = $this->audit->changes($item->only(['description', 'page']), ['description' => null, 'page' => null]);
            $item->delete();
            $this->audit->record($locked, 'attachment_removed', $changes, ['attachmentId' => $item->id]);

            return $locked->refresh()->load(Document::archiveRelations());
        }, 3);
    }

    private function lock(Document $document): Document
    {
        $locked = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
        abort_if($locked->document_type_id !== null && $locked->usesTaxDeclarationFields(), 404);

        return $locked;
    }
}
