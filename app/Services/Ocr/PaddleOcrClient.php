<?php

namespace App\Services\Ocr;

use App\Models\OcrSetting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;

class PaddleOcrClient implements OcrExtractor
{
    private const TIMEOUT_SECONDS = 300;

    private const CONNECT_TIMEOUT_SECONDS = 30;

    private const POLL_REQUEST_TIMEOUT_SECONDS = 60;

    private const POLL_SECONDS = 5;

    /**
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null}
     */
    public function extract(string $contents, string $filename): array
    {
        $setting = OcrSetting::current();
        $jobUrl = $setting->resolvedJobUrl();
        $token = $setting->resolvedToken();
        $model = $setting->resolvedModel();

        if ($jobUrl === '' || $token === '' || $model === '') {
            throw new RuntimeException('Paddle OCR is not configured. Set PADDLE_OCR_JOB_URL, PADDLE_OCR_TOKEN, and PADDLE_OCR_MODEL in .env, or save them in Settings → OCR.');
        }

        $jobId = $this->submit($jobUrl, $token, $model, $contents, $filename);
        $jsonUrl = $this->poll($jobUrl, $token, $jobId);
        $pages = $this->pagesFromJsonl($this->downloadJsonl($jsonUrl));

        if ($pages === []) {
            throw new RuntimeException('Paddle OCR returned no recognized text.');
        }

        return [
            'text' => implode("\f", $pages),
            'pages' => $pages,
            'page_count' => count($pages),
            'pdf' => null,
        ];
    }

    private function submit(string $jobUrl, string $token, string $model, string $contents, string $filename): string
    {
        $response = $this->client($token, self::TIMEOUT_SECONDS)
            ->attach('file', $contents, $filename)
            ->post($jobUrl, [
                'model' => $model,
                'optionalPayload' => json_encode([
                    'useDocOrientationClassify' => false,
                    'useDocUnwarping' => false,
                    'useTextlineOrientation' => false,
                ]),
            ]);

        $data = $this->payload($response, 'Paddle OCR could not start a job.');

        return $this->jobId($data['jobId'] ?? null);
    }

    private function poll(string $jobUrl, string $token, string $jobId): string
    {
        $deadline = microtime(true) + self::TIMEOUT_SECONDS;

        while (true) {
            try {
                $response = $this->client($token, self::POLL_REQUEST_TIMEOUT_SECONDS)
                    ->get($jobUrl.'/'.$jobId);
            } catch (ConnectionException $exception) {
                $this->waitOrTimeout($deadline, $exception->getMessage());

                continue;
            }

            if ($this->isRetryable($response)) {
                $this->waitOrTimeout($deadline, $this->errorMessage($response->json(), 'Paddle OCR job was not found.'));

                continue;
            }

            $data = $this->payload($response, 'Paddle OCR job status could not be read.');
            $state = $data['state'] ?? null;

            if ($state === 'done') {
                $jsonUrl = $data['resultUrl']['jsonUrl'] ?? null;

                if (! is_string($jsonUrl) || $jsonUrl === '') {
                    $this->waitOrTimeout($deadline, 'Paddle OCR did not return a result URL.');

                    continue;
                }

                return $jsonUrl;
            }

            if ($state === 'failed') {
                $error = $data['errorMsg'] ?? 'Paddle OCR job failed.';

                throw new RuntimeException(mb_substr(is_string($error) ? $error : 'Paddle OCR job failed.', 0, 500));
            }

            $this->waitOrTimeout($deadline, 'Paddle OCR timed out while waiting for the job to finish.');
        }
    }

    private function downloadJsonl(string $jsonUrl): string
    {
        $attempts = 0;
        $lastError = 'Paddle OCR result could not be downloaded.';

        while ($attempts < 5) {
            $attempts++;

            try {
                $response = Http::connectTimeout(self::CONNECT_TIMEOUT_SECONDS)
                    ->timeout(60)
                    ->get($jsonUrl);
            } catch (ConnectionException $exception) {
                $lastError = $exception->getMessage();
                Sleep::for(self::POLL_SECONDS)->seconds();

                continue;
            }

            if ($response->successful()) {
                $body = $response->body();

                if ($body !== '') {
                    return $body;
                }

                throw new RuntimeException('Paddle OCR returned an empty result.');
            }

            $lastError = 'Paddle OCR result could not be downloaded (HTTP '.$response->status().').';

            if (! $this->isRetryable($response)) {
                throw new RuntimeException($lastError);
            }

            Sleep::for(self::POLL_SECONDS)->seconds();
        }

        throw new RuntimeException(mb_substr($lastError, 0, 500));
    }

    private function client(string $token, int $timeout): PendingRequest
    {
        return Http::withHeaders([
            'Authorization' => 'bearer '.$token,
        ])->connectTimeout(self::CONNECT_TIMEOUT_SECONDS)
            ->timeout($timeout);
    }

    /**
     * @return list<string>
     */
    private function pagesFromJsonl(string $body): array
    {
        $pages = [];

        foreach (preg_split('/\r\n|\n/', $body) ?: [] as $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            $decoded = json_decode($line, true);

            if (! is_array($decoded) || ! is_array($decoded['result'] ?? null)) {
                throw new RuntimeException('Paddle OCR returned an unexpected result.');
            }

            $result = $decoded['result'];

            if (is_array($result['ocrResults'] ?? null)) {
                foreach ($result['ocrResults'] as $ocrResult) {
                    if (is_array($ocrResult)) {
                        $pages[] = $this->pageFromRecTexts($ocrResult);
                    }
                }

                continue;
            }

            if (is_array($result['layoutParsingResults'] ?? null)) {
                foreach ($result['layoutParsingResults'] as $layoutResult) {
                    if (! is_array($layoutResult)) {
                        continue;
                    }

                    $text = $layoutResult['markdown']['text'] ?? '';
                    $pages[] = is_string($text) ? $text : '';
                }
            }
        }

        return $pages;
    }

    /**
     * @param  array<string, mixed>  $ocrResult
     */
    private function pageFromRecTexts(array $ocrResult): string
    {
        $texts = $ocrResult['prunedResult']['rec_texts'] ?? $ocrResult['rec_texts'] ?? [];

        if (! is_array($texts)) {
            return '';
        }

        $lines = [];

        foreach ($texts as $text) {
            if (is_string($text) && $text !== '') {
                $lines[] = $text;
            }
        }

        return implode("\n", $lines);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Response $response, string $fallback): array
    {
        $json = $response->json();

        if ($response->failed()) {
            throw new RuntimeException(mb_substr($this->errorMessage($json, $fallback.' HTTP '.$response->status().'.'), 0, 500));
        }

        if (! is_array($json)) {
            throw new RuntimeException($fallback);
        }

        $code = $json['code'] ?? 0;

        if ($code !== 0 && $code !== '0') {
            throw new RuntimeException(mb_substr($this->errorMessage($json, $fallback), 0, 500));
        }

        $data = $json['data'] ?? null;

        if (! is_array($data)) {
            throw new RuntimeException($fallback);
        }

        return $data;
    }

    private function errorMessage(mixed $json, string $fallback): string
    {
        if (! is_array($json)) {
            return $fallback;
        }

        foreach (['msg', 'message', 'detail'] as $key) {
            if (is_string($json[$key] ?? null) && $json[$key] !== '') {
                return $json[$key];
            }
        }

        $errorMsg = $json['data']['errorMsg'] ?? null;

        return is_string($errorMsg) && $errorMsg !== '' ? $errorMsg : $fallback;
    }

    private function isRetryable(Response $response): bool
    {
        if (in_array($response->status(), [404, 408, 425, 429, 500, 502, 503, 504], true)) {
            return true;
        }

        $message = strtolower($this->errorMessage($response->json(), ''));

        return $message !== '' && str_contains($message, 'not found');
    }

    private function waitOrTimeout(float $deadline, string $message): void
    {
        if (microtime(true) >= $deadline) {
            throw new RuntimeException(mb_substr($message, 0, 500));
        }

        Sleep::for(self::POLL_SECONDS)->seconds();
    }

    private function jobId(mixed $jobId): string
    {
        if (is_int($jobId)) {
            $jobId = (string) $jobId;
        }

        if (! is_string($jobId) || $jobId === '') {
            throw new RuntimeException('Paddle OCR did not return a job id.');
        }

        return $jobId;
    }
}
