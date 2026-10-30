<?php

namespace App\Services\Ocr;

interface OcrExtractor
{
    /**
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null, regions: list<array{kind?: 'line'|'block', page: int, text: string, box: list<int|float>|null, pageWidth: int|float|null, pageHeight: int|float|null}>}
     */
    public function extract(string $contents, string $filename): array;
}
