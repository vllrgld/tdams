<?php

namespace App\Services\Ocr;

interface OcrExtractor
{
    /**
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null}
     */
    public function extract(string $contents, string $filename): array;
}
