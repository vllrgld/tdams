<?php

namespace App\Services\Documents;

use App\Models\Document;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentWriter
{
    public function __construct(private DeclarationRecorder $recorder) {}

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Document
    {
        return Document::withoutSyncingToSearch(fn (): Document => DB::transaction(function () use ($attributes): Document {
            $fields = Arr::only($attributes, Document::RECORD_FIELDS);
            $document = new Document(Arr::except($attributes, Document::RECORD_FIELDS));
            $this->validatePreviousDeclaration($document, $fields);
            $document->save();
            $this->recorder->sync($document, $fields);
            $document->refresh()->load(Document::archiveRelations());
            $this->indexAfterCommit($document);

            return $document;
        }, 3));
    }

    /** @param array<string, mixed> $fields */
    public function updateFields(Document $document, array $fields): Document
    {
        return $this->saveFields($document, $fields);
    }

    /** @param array<string, mixed> $fields */
    public function linkPrevious(Document $document, array $fields): Document
    {
        return $this->saveFields($document, [
            'previous_tax_declaration_number' => $fields['previous_tax_declaration_number'] ?? null,
            'previous_declaration_date' => $fields['previous_declaration_date'] ?? null,
        ], true);
    }

    /** @param array<string, mixed> $fields */
    private function saveFields(Document $document, array $fields, bool $linkOnly = false): Document
    {
        return Document::withoutSyncingToSearch(fn (): Document => DB::transaction(function () use ($document, $fields, $linkOnly): Document {
            $lockedDocument = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
            $lockedDocument->load(Document::archiveRelations());

            if ($linkOnly && filled($lockedDocument->previous_tax_declaration_number)) {
                throw ValidationException::withMessages([
                    'previous_tax_declaration_number' => 'A previous tax declaration number is already set.',
                ]);
            }

            $fields = Arr::only($fields, Document::RECORD_FIELDS);
            $this->validatePreviousDeclaration($lockedDocument, $fields);
            $this->recorder->sync($lockedDocument, $fields);
            $lockedDocument->touch();
            $lockedDocument->refresh()->load(Document::archiveRelations());
            $this->indexAfterCommit($lockedDocument);

            return $lockedDocument;
        }, 3));
    }

    /** @param array<string, mixed> $fields */
    private function validatePreviousDeclaration(Document $document, array $fields): void
    {
        $previous = array_key_exists('previous_tax_declaration_number', $fields)
            ? $fields['previous_tax_declaration_number']
            : $document->previous_tax_declaration_number;
        $number = array_key_exists('tax_declaration_number', $fields)
            ? $fields['tax_declaration_number']
            : $document->tax_declaration_number;

        if (is_string($previous) && is_string($number) && trim($previous) !== '' && strcasecmp(trim($previous), trim($number)) === 0) {
            throw ValidationException::withMessages([
                'previous_tax_declaration_number' => 'The previous tax declaration number cannot be the same as this document.',
            ]);
        }
    }

    private function indexAfterCommit(Document $document): void
    {
        DB::afterCommit(function () use ($document): void {
            try {
                $document->refresh()->load(Document::archiveRelations());
                $document->searchable();
            } catch (Throwable $exception) {
                Log::warning('Document search index update failed.', [
                    'document_id' => $document->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        });
    }
}
