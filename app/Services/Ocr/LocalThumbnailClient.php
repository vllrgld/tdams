<?php

namespace App\Services\Ocr;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class LocalThumbnailClient
{
    public function render(string $contents, string $filename): string
    {
        $request = Http::acceptJson()
            ->connectTimeout(5)
            ->timeout((int) config('services.ocr.local.timeout'))
            ->attach('file', $contents, $filename);

        $token = config('services.ocr.local.token');

        if (is_string($token) && $token !== '') {
            $request = $request->withToken($token);
        }

        $response = $request->post(rtrim((string) config('services.ocr.local.url'), '/').'/v1/thumbnail');

        if ($response->failed()) {
            $detail = $response->json('detail');
            $message = is_string($detail) && $detail !== ''
                ? $detail
                : 'Thumbnail service returned HTTP '.$response->status().'.';

            throw new RuntimeException(mb_substr($message, 0, 500));
        }

        $encoded = $response->json('jpeg_base64');

        if (! is_string($encoded) || $encoded === '') {
            throw new RuntimeException('Thumbnail service returned an unexpected response.');
        }

        $decoded = base64_decode($encoded, true);

        if (! is_string($decoded) || $decoded === '') {
            throw new RuntimeException('Thumbnail service returned an unreadable image.');
        }

        return $decoded;
    }
}
