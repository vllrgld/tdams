<?php

namespace App\Services\Ocr;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class LocalOcrClient implements OcrExtractor
{
    /**
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null, regions: list<array{kind?: 'line'|'block', page: int, text: string, box: list<int|float>|null, pageWidth: int|float|null, pageHeight: int|float|null}>}
     */
    public function extract(string $contents, string $filename): array
    {
        $request = Http::acceptJson()
            ->connectTimeout(5)
            ->timeout((int) config('services.ocr.local.timeout'));

        $token = config('services.ocr.local.token');

        if (is_string($token) && $token !== '') {
            $request = $request->withToken($token);
        }

        $response = $request
            ->attach('file', $contents, $filename)
            ->post(rtrim((string) config('services.ocr.local.url'), '/').'/v1/ocr', [
                'optimize' => 0,
            ]);

        if ($response->failed()) {
            $detail = $response->json('detail');
            $message = is_string($detail) && $detail !== ''
                ? $detail
                : 'OCR service returned HTTP '.$response->status().'.';

            throw new RuntimeException(mb_substr($message, 0, 500));
        }

        $payload = $response->json();

        if (! is_array($payload) || ! is_string($payload['text'] ?? null) || ! is_array($payload['pages'] ?? null)) {
            throw new RuntimeException('OCR service returned an unexpected response.');
        }

        $pages = [];

        foreach ($payload['pages'] as $page) {
            if (! is_string($page)) {
                throw new RuntimeException('OCR service returned an unexpected response.');
            }

            $pages[] = $page;
        }

        $pdf = null;

        if (is_string($payload['pdf_base64'] ?? null) && $payload['pdf_base64'] !== '') {
            $decoded = base64_decode($payload['pdf_base64'], true);

            if (! is_string($decoded) || $decoded === '') {
                throw new RuntimeException('OCR service returned an unreadable PDF.');
            }

            $pdf = $decoded;
        }

        return [
            'text' => $payload['text'],
            'pages' => $pages,
            'page_count' => count($pages),
            'pdf' => $pdf,
            'regions' => $this->regions($payload['regions'] ?? [], count($pages)),
        ];
    }

    /**
     * @return list<array{kind?: 'line'|'block', page: int, text: string, box: list<float>, pageWidth: float, pageHeight: float}>
     */
    private function regions(mixed $payload, int $pageCount): array
    {
        if (! is_array($payload)) {
            return [];
        }

        $regions = [];

        foreach ($payload as $region) {
            if (! is_array($region)
                || ! is_int($region['page'] ?? null)
                || $region['page'] < 1 || $region['page'] > $pageCount
                || ! is_string($region['text'] ?? null) || trim($region['text']) === ''
                || ! is_numeric($region['pageWidth'] ?? null) || ! is_numeric($region['pageHeight'] ?? null)
                || ! is_array($region['box'] ?? null) || count($region['box']) !== 4) {
                continue;
            }

            $width = (float) $region['pageWidth'];
            $height = (float) $region['pageHeight'];
            $box = [];

            foreach (array_values($region['box']) as $coordinate) {
                if (! is_numeric($coordinate) || ! is_finite((float) $coordinate)) {
                    continue 2;
                }

                $box[] = (float) $coordinate;
            }

            if (! is_finite($width) || ! is_finite($height) || $width <= 0 || $height <= 0
                || $box[0] < 0 || $box[1] < 0 || $box[2] > $width || $box[3] > $height
                || $box[2] <= $box[0] || $box[3] <= $box[1]) {
                continue;
            }

            $regions[] = [
                'kind' => 'line',
                'page' => $region['page'],
                'text' => $region['text'],
                'box' => $box,
                'pageWidth' => $width,
                'pageHeight' => $height,
            ];
        }

        return $regions;
    }
}
