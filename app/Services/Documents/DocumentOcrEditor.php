<?php

namespace App\Services\Documents;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentOcrEditor
{
    public static function revision(Document $document): string
    {
        return hash('sha256', json_encode([$document->ocr_text, $document->ocr_regions], JSON_THROW_ON_ERROR));
    }

    public function review(Document $document, bool $reviewed, int $reviewerId, string $revision): Document
    {
        return DB::transaction(function () use ($document, $reviewed, $reviewerId, $revision): Document {
            $locked = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($reviewed && ($locked->ocr_status !== 'completed' || trim($locked->ocr_text ?? '') === '')) {
                throw ValidationException::withMessages(['reviewed' => 'OCR must finish with recognized text before you can mark it reviewed.']);
            }

            if (! hash_equals(self::revision($locked), $revision)) {
                throw ValidationException::withMessages(['revision' => 'The OCR text has changed. Reopen the comparison and review the latest text.']);
            }

            if (! $reviewed || $locked->ocr_reviewed_at === null) {
                $locked->forceFill([
                    'ocr_reviewed_at' => $reviewed ? now() : null,
                    'ocr_reviewed_by' => $reviewed ? $reviewerId : null,
                ])->saveQuietly();
            }

            return $locked;
        }, 3);
    }

    public function correct(Document $document, int $index, string $text, string $revision): Document
    {
        return DB::transaction(function () use ($document, $index, $text, $revision): Document {
            $locked = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($locked->ocr_status !== 'completed') {
                throw ValidationException::withMessages(['text' => 'Wait for OCR to finish before correcting text.']);
            }

            if (! hash_equals(self::revision($locked), $revision)) {
                throw ValidationException::withMessages(['text' => 'The OCR result has changed. Reopen the document before correcting it.']);
            }

            $regions = $locked->getAttribute('ocr_regions');
            $regions = is_array($regions) ? $regions : [];
            $keys = array_keys(array_filter($regions, fn (mixed $region): bool => is_array($region) && is_string($region['text'] ?? null)));
            $key = $keys[$index] ?? null;
            $region = $key === null ? null : $regions[$key];
            $pages = explode("\f", $locked->ocr_text ?? '');
            if (! is_array($region) || ! is_string($region['text'] ?? null) || ! is_int($region['page'] ?? null) || ! isset($pages[$region['page'] - 1])) {
                throw ValidationException::withMessages(['text' => 'This OCR block is no longer available. Reopen the document and try again.']);
            }
            $pageIndex = $region['page'] - 1;

            $page = $pages[$pageIndex];
            $offset = 0;
            foreach (array_slice($keys, 0, $index) as $earlierKey) {
                $earlier = $regions[$earlierKey];
                if (is_array($earlier) && ($earlier['page'] ?? null) === $region['page'] && is_string($earlier['text'] ?? null)) {
                    $position = $this->textPosition($page, $earlier['text'], $offset);
                    if ($position !== null) {
                        $offset = $position + strlen($earlier['text']);
                    }
                }
            }

            $position = $this->textPosition($page, $region['text'], $offset);
            $pages[$pageIndex] = $position === null
                ? rtrim($page)."\n".$text
                : substr_replace($page, $text, $position, strlen($region['text']));
            $region['originalText'] ??= $region['text'];
            $region['text'] = $text;
            $region['corrected'] = true;
            unset($region['words'], $region['content']);
            $regions[$key] = $region;

            $locked->forceFill([
                'ocr_text' => implode("\f", $pages),
                'ocr_pages' => $pages,
                'ocr_regions' => $regions,
                'ocr_reviewed_at' => null,
                'ocr_reviewed_by' => null,
            ])->saveQuietly();

            return $locked;
        }, 3);
    }

    private function textPosition(string $page, string $text, int $offset): ?int
    {
        if ($text === '') {
            return null;
        }

        $literal = preg_quote($text, '/');
        if (preg_match('/^\h*(?<value>'.$literal.')\h*\r?$/mu', $page, $matches, PREG_OFFSET_CAPTURE, $offset) === 1) {
            return $matches['value'][1];
        }

        $before = preg_match('/^[\p{L}\p{N}]/u', $text) === 1 ? '(?<![\p{L}\p{N}_])(?<!\d[.,])' : '';
        $after = preg_match('/[\p{L}\p{N}]$/u', $text) === 1 ? '(?![\p{L}\p{N}_]|[.,]\d)' : '';

        return preg_match('/'.$before.'(?<value>'.$literal.')'.$after.'/u', $page, $matches, PREG_OFFSET_CAPTURE, $offset) === 1
            ? $matches['value'][1]
            : null;
    }
}
