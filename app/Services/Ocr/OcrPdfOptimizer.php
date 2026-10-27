<?php

namespace App\Services\Ocr;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OcrPdfOptimizer
{
    public function optimize(string $contents, string $filename, int $optimize = 3): string
    {
        $base = rtrim((string) config('services.ocr.local.url'), '/');
        $response = $this->request($contents, $filename)
            ->post($base.'/v1/pdf', [
                'optimize' => $optimize,
            ]);

        if ($response->status() === 404) {
            $response = $this->request($contents, $filename)
                ->post($base.'/v1/ocr', [
                    'optimize' => $optimize,
                ]);
        }

        if ($response->failed()) {
            $detail = $response->json('detail');
            $message = is_string($detail) && $detail !== ''
                ? $detail
                : 'PDF optimizer returned HTTP '.$response->status().'.';

            throw new RuntimeException(mb_substr($message, 0, 500));
        }

        $encoded = $response->json('pdf_base64');

        if (! is_string($encoded) || $encoded === '') {
            throw new RuntimeException('PDF optimizer returned an unexpected response.');
        }

        $decoded = base64_decode($encoded, true);

        if (! is_string($decoded) || $decoded === '') {
            throw new RuntimeException('PDF optimizer returned an unreadable PDF.');
        }

        return $decoded;
    }

    private function request(string $contents, string $filename): PendingRequest
    {
        $request = Http::acceptJson()
            ->connectTimeout(5)
            ->timeout((int) config('services.ocr.local.timeout'))
            ->attach('file', $contents, $filename);

        $token = config('services.ocr.local.token');

        if (is_string($token) && $token !== '') {
            $request = $request->withToken($token);
        }

        return $request;
    }
}
