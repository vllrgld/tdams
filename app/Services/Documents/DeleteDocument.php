<?php

namespace App\Services\Documents;

use App\Jobs\DeleteDocumentFiles;
use App\Models\Book;
use App\Models\Correspondent;
use App\Models\Document;
use App\Models\DocumentAudit;
use App\Models\Owner;
use App\Models\Property;
use App\Models\TaxDeclaration;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class DeleteDocument
{
    public function __construct(private CurrentOffice $currentOffice) {}

    public function handle(Document $document): bool
    {
        $paths = Document::withoutSyncingToSearch(fn (): array => DB::transaction(function () use ($document): array {
            if ($document->book_id !== null) {
                Book::query()->whereKey($document->book_id)->lockForUpdate()->first();
            }
            $query = Document::query()->whereKey($document->id);
            $this->currentOffice->constrain($query);
            $locked = $query->lockForUpdate()->firstOrFail();
            if ($locked->book_id !== $document->book_id) {
                throw ValidationException::withMessages(['document' => 'This document moved. Refresh the page before deleting it.']);
            }
            if ($locked->ocr_status === 'processing') {
                throw ValidationException::withMessages(['document' => 'OCR is processing this document. Wait for it to finish before deleting it.']);
            }

            $paths = $this->filePaths($locked);
            $declarationId = $locked->tax_declaration_id;
            $correspondentId = $locked->correspondent_id;
            $bookId = $locked->book_id;
            DocumentAudit::query()->where('document_id', $locked->id)->delete();
            $locked->delete();

            if ($bookId !== null) {
                $remaining = Document::query()->where('book_id', $bookId)->orderBy('position')->orderBy('id')->lockForUpdate()->get(['id', 'position']);
                foreach ($remaining as $index => $item) {
                    if ($item->position !== $index + 1) {
                        $item->forceFill(['position' => $index + 1])->saveQuietly();
                    }
                }
            }
            $this->removeUnusedDeclarations($declarationId);
            if ($correspondentId !== null) {
                Correspondent::query()->whereKey($correspondentId)->whereDoesntHave('documents')->delete();
            }

            return $paths;
        }, 3));

        $filesDeleted = true;
        try {
            (new DeleteDocumentFiles($paths))->handle();
        } catch (Throwable $exception) {
            report($exception);
            DeleteDocumentFiles::dispatch($paths)->delay(now()->addSeconds(10));
            $filesDeleted = false;
        }
        try {
            $document->unsearchable();
        } catch (Throwable $exception) {
            report($exception);
        }

        return $filesDeleted;
    }

    /** @return list<string> */
    private function filePaths(Document $document): array
    {
        $paths = array_values(array_unique(array_filter([
            $document->storage_path, $document->ocr_pdf_path, $document->thumbnail_path,
            'documents/ocr/'.$document->id.'.pdf',
            'documents/thumbnails/'.$document->id.'.jpg',
        ], fn (?string $path): bool => $path !== null && $path !== '')));
        foreach ($paths as $path) {
            if (! str_starts_with($path, 'documents/') || str_contains($path, '\\') || preg_match('~(^|/)\.{1,2}(/|$)~', $path)) {
                throw ValidationException::withMessages(['document' => 'The document has an invalid stored file location. It has not been deleted.']);
            }
        }
        $shared = Document::query()->whereKeyNot($document->id)->where(function (Builder $query) use ($paths): void {
            $query->whereIn('storage_path', $paths)->orWhereIn('ocr_pdf_path', $paths)->orWhereIn('thumbnail_path', $paths);
        })->get(['storage_path', 'ocr_pdf_path', 'thumbnail_path']);
        $sharedPaths = [];
        foreach ($shared as $other) {
            array_push($sharedPaths, $other->storage_path, $other->ocr_pdf_path, $other->thumbnail_path);
        }

        return array_values(array_diff($paths, $sharedPaths));
    }

    private function removeUnusedDeclarations(?int $id): void
    {
        $visited = [];
        while ($id !== null && ! in_array($id, $visited, true)) {
            $visited[] = $id;
            $declaration = TaxDeclaration::query()->whereKey($id)->lockForUpdate()->first();
            if ($declaration === null || $declaration->documents()->exists() || $declaration->followingDeclarations()->exists()) {
                return;
            }
            $ownerIds = $declaration->owners()->pluck('owners.id');
            $propertyId = $declaration->property_id;
            $id = $declaration->previous_declaration_id;
            $declaration->delete();
            Owner::query()->whereKey($ownerIds)->whereDoesntHave('taxDeclarations')->delete();
            if ($propertyId !== null) {
                Property::query()->whereKey($propertyId)->whereDoesntHave('taxDeclarations')->delete();
            }
        }
    }
}
