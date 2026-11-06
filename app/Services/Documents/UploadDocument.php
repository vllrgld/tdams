<?php

namespace App\Services\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class UploadDocument
{
    public function __construct(private DocumentWriter $writer, private DocumentOcrDispatcher $ocr) {}

    /** @param array<string, mixed> $fields */
    public function store(UploadedFile $file, int $bookId, User $user, array $fields): Document
    {
        $temporaryPath = $file->getPathname();

        if ($temporaryPath === '' || ! is_file($temporaryPath) || ! is_readable($temporaryPath)) {
            throw new RuntimeException('The uploaded document temporary file is unavailable.');
        }

        $stream = fopen($temporaryPath, 'rb');

        if ($stream === false) {
            throw new RuntimeException('The uploaded document temporary file could not be opened.');
        }

        $path = 'documents/'.$file->hashName();

        try {
            try {
                $stored = Storage::disk('local')->put($path, $stream);
            } finally {
                fclose($stream);
            }

            if (! $stored) {
                throw new RuntimeException('The document could not be saved to private storage.');
            }

            $document = DB::transaction(function () use ($bookId, $file, $path, $user, $fields): Document {
                $book = Book::query()->whereKey($bookId)->lockForUpdate()->firstOrFail();

                return $this->writer->create([
                    ...$fields,
                    'book_id' => $book->id,
                    'position' => $book->nextDocumentPosition(),
                    'original_filename' => $file->getClientOriginalName(),
                    'storage_path' => $path,
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'file_size' => $file->getSize(),
                    'uploaded_by' => $user->id,
                    'ocr_status' => 'pending',
                ]);
            }, 3);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);

            throw $exception;
        }

        $this->ocr->dispatch($document->id);

        return $document;
    }
}
