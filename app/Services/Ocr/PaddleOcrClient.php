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
     * @return array{text: string, pages: list<string>, page_count: int, pdf: string|null, regions: list<array{kind?: 'line'|'block', page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>}
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
        $parsed = $this->readJsonl($this->downloadJsonl($jsonUrl));
        $pages = $parsed['pages'];

        if ($pages === []) {
            throw new RuntimeException('Paddle OCR returned no recognized text.');
        }

        return [
            'text' => implode("\f", $pages),
            'pages' => $pages,
            'page_count' => count($pages),
            'pdf' => null,
            'regions' => $parsed['regions'],
        ];
    }

    private function submit(string $jobUrl, string $token, string $model, string $contents, string $filename): string
    {
        $response = $this->client($token, self::TIMEOUT_SECONDS)
            ->attach('file', $contents, $filename)
            ->post($jobUrl, [
                'model' => $model,
                'optionalPayload' => json_encode($this->optionalPayload($model)),
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

    /**
     * @return array<string, bool>
     */
    private function optionalPayload(string $model): array
    {
        if ($model === OcrSetting::MODEL_VL) {
            return [
                'useDocOrientationClassify' => false,
                'useDocUnwarping' => false,
                'useChartRecognition' => false,
            ];
        }

        return [
            'useDocOrientationClassify' => false,
            'useDocUnwarping' => false,
            'useTextlineOrientation' => false,
        ];
    }

    private function client(string $token, int $timeout): PendingRequest
    {
        return Http::withHeaders([
            'Authorization' => 'bearer '.$token,
        ])->connectTimeout(self::CONNECT_TIMEOUT_SECONDS)
            ->timeout($timeout);
    }

    /**
     * @return array{pages: list<string>, regions: list<array{kind?: 'line'|'block', page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>}
     */
    private function readJsonl(string $body): array
    {
        $pages = [];
        $regions = [];

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
                    if (! is_array($ocrResult)) {
                        continue;
                    }

                    $page = count($pages) + 1;
                    $parsed = $this->pageFromRecTexts($ocrResult, $page);
                    $pages[] = $parsed['text'];
                    array_push($regions, ...$parsed['regions']);
                }

                continue;
            }

            if (is_array($result['layoutParsingResults'] ?? null)) {
                foreach ($result['layoutParsingResults'] as $layoutResult) {
                    if (! is_array($layoutResult)) {
                        continue;
                    }

                    $page = count($pages) + 1;
                    $text = $layoutResult['markdown']['text'] ?? '';
                    $pages[] = is_string($text) ? $text : '';
                    array_push($regions, ...$this->regionsFromLayout($layoutResult, $page));
                }
            }
        }

        return [
            'pages' => $pages,
            'regions' => $regions,
        ];
    }

    /**
     * @param  array<string, mixed>  $ocrResult
     * @return array{text: string, regions: list<array{kind?: 'line'|'block', page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>}
     */
    private function pageFromRecTexts(array $ocrResult, int $page): array
    {
        $pruned = is_array($ocrResult['prunedResult'] ?? null) ? $ocrResult['prunedResult'] : $ocrResult;
        $texts = $pruned['rec_texts'] ?? [];
        $boxes = $pruned['rec_boxes'] ?? [];
        $polygons = $pruned['rec_polys'] ?? [];
        [$pageWidth, $pageHeight] = $this->pageSize([
            'width' => $pruned['width'] ?? $ocrResult['width'] ?? null,
            'height' => $pruned['height'] ?? $ocrResult['height'] ?? null,
        ]);

        if (! is_array($texts)) {
            return ['text' => '', 'regions' => []];
        }

        $lines = [];
        $regions = [];

        foreach ($texts as $index => $text) {
            if (! is_string($text) || $text === '') {
                continue;
            }

            $lines[] = $text;
            $regions[] = [
                'kind' => 'line',
                'page' => $page,
                'text' => $text,
                'box' => $this->box(is_array($boxes) ? ($boxes[$index] ?? null) : null)
                    ?? $this->box(is_array($polygons) ? ($polygons[$index] ?? null) : null),
                'pageWidth' => $pageWidth,
                'pageHeight' => $pageHeight,
            ];
        }

        return [
            'text' => implode("\n", $lines),
            'regions' => $regions,
        ];
    }

    /**
     * @param  array<string, mixed>  $layoutResult
     * @return list<array{kind?: 'line'|'block', page: int, text: string, box: list<int>|null, pageWidth: int|null, pageHeight: int|null}>
     */
    private function regionsFromLayout(array $layoutResult, int $page): array
    {
        $pruned = is_array($layoutResult['prunedResult'] ?? null) ? $layoutResult['prunedResult'] : $layoutResult;
        $blocks = $pruned['parsing_res_list'] ?? $layoutResult['parsing_res_list'] ?? [];
        [$pageWidth, $pageHeight] = $this->pageSize([
            'width' => $pruned['width'] ?? $layoutResult['width'] ?? null,
            'height' => $pruned['height'] ?? $layoutResult['height'] ?? null,
        ]);

        if (! is_array($blocks)) {
            return [];
        }

        $regions = [];

        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }

            $text = $block['block_content'] ?? '';

            if (! is_string($text) || trim($text) === '') {
                continue;
            }

            $regions[] = [
                'kind' => 'block',
                'page' => $page,
                'text' => $text,
                'box' => $this->box($block['block_bbox'] ?? null),
                'pageWidth' => $pageWidth,
                'pageHeight' => $pageHeight,
            ];
        }

        return $regions;
    }

    /**
     * @param  array<string, mixed>  $source
     * @return array{0: int|null, 1: int|null}
     */
    private function pageSize(array $source): array
    {
        $width = $source['width'] ?? null;
        $height = $source['height'] ?? null;

        return [
            is_numeric($width) ? (int) $width : null,
            is_numeric($height) ? (int) $height : null,
        ];
    }

    /**
     * @return list<int>|null
     */
    private function box(mixed $value): ?array
    {
        if (! is_array($value) || $value === []) {
            return null;
        }

        if (isset($value[0]) && is_array($value[0])) {
            $xs = [];
            $ys = [];

            foreach ($value as $point) {
                if (! is_array($point) || ! isset($point[0], $point[1]) || ! is_numeric($point[0]) || ! is_numeric($point[1])) {
                    return null;
                }

                $xs[] = (float) $point[0];
                $ys[] = (float) $point[1];
            }

            $value = [
                (int) round(min($xs)),
                (int) round(min($ys)),
                (int) round(max($xs)),
                (int) round(max($ys)),
            ];
        }

        if (count($value) < 4) {
            return null;
        }

        $coords = [];

        foreach (array_slice(array_values($value), 0, 4) as $part) {
            if (! is_numeric($part)) {
                return null;
            }

            $coords[] = (int) round((float) $part);
        }

        return $coords[2] > $coords[0] && $coords[3] > $coords[1] ? $coords : null;
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
