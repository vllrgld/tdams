<?php

namespace App\Services\Documents;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ArchiveResetter
{
    public function reset(): void
    {
        $disk = Storage::disk('local');
        $files = DB::transaction(function () use ($disk): array {
            foreach (['cabinets', 'drawers', 'books'] as $table) {
                DB::table($table)->orderBy('id')->lockForUpdate()->get(['id']);
            }

            $documents = DB::table('documents')->orderBy('id')->lockForUpdate()->get(['id', 'ocr_status']);

            if ($documents->contains(fn (object $document): bool => in_array($document->ocr_status, ['pending', 'processing'], true))) {
                throw ValidationException::withMessages([
                    'confirmation' => 'Wait for OCR to finish before resetting the archive.',
                ]);
            }

            $files = $disk->allFiles('documents');

            DB::table('tax_declarations')->whereNotNull('previous_declaration_id')->update(['previous_declaration_id' => null]);

            foreach (['declaration_owners', 'documents', 'tax_declarations', 'properties', 'owners', 'books', 'drawers', 'cabinets'] as $table) {
                DB::table($table)->delete();
            }

            return $files;
        });

        try {
            foreach (array_chunk($files, 250) as $batch) {
                if (! $disk->delete($batch)) {
                    throw new RuntimeException('Stored document files could not be removed during the archive reset.');
                }
            }
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'confirmation' => 'Archive records were cleared, but some stored files could not be removed. Try resetting again.',
            ]);
        }
    }
}
