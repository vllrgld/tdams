<?php

namespace App\Http\Resources;

use App\Models\Document;
use App\Services\Documents\DocumentFieldDefinitions;
use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class DocumentResource extends JsonResource
{
    public function __construct(private Document $document)
    {
        parent::__construct($document);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $fields = [];

        foreach (array_keys(DocumentFieldDefinitions::definitions()) as $name) {
            $value = $this->document->getAttribute($name);
            $fields[Str::camel($name)] = match (true) {
                $value instanceof DateTimeInterface => $value->format('Y-m-d'),
                $name === 'area' && $value !== null => number_format((float) $value, 4, '.', ''),
                default => $value,
            };
        }

        $ocrText = Str::squish($this->document->ocr_text ?? '');

        return [
            'id' => $this->document->id,
            ...$fields,
            'municipality' => $this->document->municipality,
            'barangay' => $this->document->barangay,
            'originalFilename' => $this->document->original_filename,
            'mimeType' => $this->document->mime_type,
            'fileSize' => $this->document->file_size,
            'ocrPdfSize' => $this->document->ocr_pdf_size,
            'ocrReviewedAt' => $this->document->ocr_status === 'completed' ? $this->document->ocr_reviewed_at?->toIso8601String() : null,
            'ocrTextExcerpt' => $ocrText === '' ? null : Str::limit($ocrText, 600),
            'createdAt' => $this->document->created_at?->toIso8601String(),
            'viewUrl' => route('documents.view', $this->document),
            'thumbnailUrl' => $this->document->hasStoredThumbnail()
                ? route('documents.thumbnail', $this->document)
                : null,
            'ocrPdfUrl' => is_string($this->document->ocr_pdf_path) && $this->document->ocr_pdf_path !== ''
                ? route('documents.ocr-pdf', $this->document)
                : null,
        ];
    }
}
