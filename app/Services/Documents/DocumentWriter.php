<?php

namespace App\Services\Documents;

use App\Models\Correspondent;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentType;
use App\Models\Office;
use App\Services\Offices\CurrentOffice;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentWriter
{
    public function __construct(
        private DeclarationRecorder $recorder,
        private CurrentOffice $currentOffice,
        private DocumentTrackingCodes $trackingCodes,
        private DocumentAuditRecorder $audit,
    ) {}

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Document
    {
        return Document::withoutSyncingToSearch(fn (): Document => DB::transaction(function () use ($attributes): Document {
            if (! array_key_exists('office_id', $attributes) || $attributes['office_id'] === null) {
                $attributes['office_id'] = $this->currentOffice->id()
                    ?? Office::query()->orderBy('id')->value('id');
            }

            $type = $this->documentType($attributes);
            $usesTaxFields = $type->uses_tax_declaration_fields ?? true;
            $hasCorrespondent = array_key_exists('correspondent', $attributes);
            $correspondent = $attributes['correspondent'] ?? null;
            $filingPath = $attributes['filing_path'] ?? Document::FILING_ARCHIVE;
            $routeId = $attributes['document_route_id'] ?? null;
            $metadata = $usesTaxFields
                ? []
                : Arr::only($attributes, SharedDocumentFields::METADATA_COLUMNS);
            unset($attributes['document_type_id'], $attributes['correspondent'], $attributes['filing_path'], $attributes['document_route_id'], $attributes['title'], $attributes['letter_date']);

            if (! $usesTaxFields) {
                unset($attributes['remarks']);
            }

            $fields = $usesTaxFields
                ? Arr::only($attributes, Document::RECORD_FIELDS)
                : [];
            $document = new Document(Arr::except($attributes, Document::RECORD_FIELDS));
            $document->document_type_id = $type?->id;
            $this->applyFilingPath($document, $filingPath, $routeId);
            $this->applyMetadata($document, $metadata, $usesTaxFields);

            if ($hasCorrespondent) {
                $this->applyCorrespondent($document, $correspondent);
            }

            $this->validatePreviousDeclaration($document, $fields);
            $document->save();

            if ($document->filing_path === Document::FILING_ROUTE) {
                $this->trackingCodes->assign($document, false);
            }

            if ($usesTaxFields) {
                $this->recorder->sync($document, $fields);
            }

            $document->refresh()->load(Document::archiveRelations());
            $this->audit->record($document, 'uploaded', $this->audit->changes([], $this->audit->fields($document)), [
                'fileName' => $document->original_filename,
                'fileSize' => $document->file_size,
                'documentType' => $type?->name,
            ], actor: $document->uploader);
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
            if ($lockedDocument->usesTaxDeclarationFields()) {
                $this->recorder->lockRecords($lockedDocument, $fields);
                $lockedDocument->refresh();
            }
            $lockedDocument->load(Document::archiveRelations());
            $before = $this->audit->fields($lockedDocument);

            if (array_key_exists('document_type_id', $fields)) {
                $lockedDocument->documentType()->associate($this->documentType($fields));
                unset($fields['document_type_id']);
            }

            if ($linkOnly && filled($lockedDocument->previous_tax_declaration_number)) {
                throw ValidationException::withMessages([
                    'previous_tax_declaration_number' => 'A previous tax declaration number is already set.',
                ]);
            }

            $hasCorrespondent = array_key_exists('correspondent', $fields);
            $correspondent = $fields['correspondent'] ?? null;
            $usesTaxFields = $lockedDocument->usesTaxDeclarationFields();
            $metadata = $usesTaxFields ? [] : Arr::only($fields, SharedDocumentFields::METADATA_COLUMNS);
            unset($fields['correspondent'], $fields['title'], $fields['letter_date']);

            if (! $usesTaxFields) {
                unset($fields['remarks']);
            }

            $fields = $usesTaxFields
                ? Arr::only($fields, Document::RECORD_FIELDS)
                : [];

            if ($hasCorrespondent) {
                $this->applyCorrespondent($lockedDocument, $correspondent);
            }

            $this->applyMetadata($lockedDocument, $metadata, $usesTaxFields);

            $this->validatePreviousDeclaration($lockedDocument, $fields);

            if ($usesTaxFields) {
                $this->recorder->sync($lockedDocument, $fields);
            }

            $lockedDocument->save();
            $lockedDocument->refresh()->load(Document::archiveRelations());
            $changes = $this->audit->changes($before, $this->audit->fields($lockedDocument));
            if ($changes !== []) {
                $this->audit->record($lockedDocument, $linkOnly ? 'declaration_linked' : 'fields_updated', $changes);
            }
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

    /** @param array<string, mixed> $attributes */
    private function documentType(array $attributes): ?DocumentType
    {
        if (array_key_exists('document_type_id', $attributes) && $attributes['document_type_id'] === null) {
            return null;
        }

        $id = $attributes['document_type_id'] ?? null;

        if (is_numeric($id)) {
            return DocumentType::query()->findOrFail((int) $id);
        }

        return DocumentType::taxDeclaration();
    }

    private function applyFilingPath(Document $document, mixed $filingPath, mixed $routeId): void
    {
        if ($filingPath === Document::FILING_ROUTE) {
            if ($routeId !== null && $routeId !== '' && (! is_numeric($routeId) || ! DocumentRoute::query()->whereKey((int) $routeId)->exists())) {
                throw ValidationException::withMessages([
                    'document_route_id' => 'Choose available routing for this document.',
                ]);
            }

            $document->filing_path = Document::FILING_ROUTE;
            $document->document_route_id = is_numeric($routeId) ? (int) $routeId : null;
            $document->startRouting();
            $document->routing_started = $document->document_route_id === null
                || $document->documentRoute?->steps->contains('office_id', $document->office_id) === true;
            $document->book_id = null;
            $document->position = null;

            return;
        }

        $document->filing_path = Document::FILING_ARCHIVE;
        $document->document_route_id = null;
        $document->status = Document::STATUS_ARCHIVED;
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function applyMetadata(Document $document, array $metadata, bool $usesTaxFields): void
    {
        if ($usesTaxFields) {
            return;
        }

        foreach (SharedDocumentFields::METADATA_COLUMNS as $field) {
            if (! array_key_exists($field, $metadata)) {
                continue;
            }

            $value = $metadata[$field];

            if ($field === SharedDocumentFields::LETTER_DATE) {
                $document->setAttribute(
                    'letter_date',
                    is_string($value) && trim($value) !== '' ? trim($value) : null,
                );

                continue;
            }

            if (is_int($value) || is_float($value)) {
                $value = (string) $value;
            }

            if (! is_string($value) || trim($value) === '') {
                $document->{$field} = null;

                continue;
            }

            $document->{$field} = trim($value);
        }
    }

    private function applyCorrespondent(Document $document, mixed $name): void
    {
        if (! is_string($name) || trim($name) === '') {
            $document->correspondent_id = null;

            return;
        }

        $document->correspondent()->associate(Correspondent::findOrCreateByName($name));
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
