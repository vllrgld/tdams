<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentFileController extends Controller
{
    public function thumbnail(Document $document): StreamedResponse
    {
        $thumbnailPath = $document->thumbnail_path;

        abort_unless($document->hasStoredThumbnail() && is_string($thumbnailPath), 404);

        return Storage::disk('local')->response(
            $thumbnailPath,
            pathinfo($document->original_filename, PATHINFO_FILENAME).'.jpg',
            [
                'Content-Type' => 'image/jpeg',
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline',
        );
    }

    public function view(Document $document): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($document->storage_path), 404);

        return Storage::disk('local')->response(
            $document->storage_path,
            $document->original_filename,
            [
                'Content-Type' => $document->mime_type,
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline',
        );
    }

    public function ocrPdf(Document $document): StreamedResponse
    {
        $ocrPdfPath = $document->ocr_pdf_path;

        if ($document->hasStoredOcrPdf() && is_string($ocrPdfPath)) {
            return Storage::disk('local')->response(
                $ocrPdfPath,
                pathinfo($document->original_filename, PATHINFO_FILENAME).'-ocr.pdf',
                [
                    'Content-Type' => 'application/pdf',
                    'X-Content-Type-Options' => 'nosniff',
                ],
                'inline',
            );
        }

        return $this->view($document);
    }
}
