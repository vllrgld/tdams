<?php

namespace App\Services\Ocr;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class LocalOcrClient implements OcrExtractor
{
    /**
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null}
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
        ];
    }
}
