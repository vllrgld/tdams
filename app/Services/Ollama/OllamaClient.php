<?php

namespace App\Services\Ollama;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaClient
{
    /**
     * @return array<string, string|null>
     */
    public function mapFields(string $model, string $ocrText): array
    {
        $models = config('services.ollama.models');

        if (! is_array($models) || ! in_array($model, $models, true)) {
            throw new RuntimeException('That model is not available.');
        }

        $key = config('services.ollama.key');

        if (! is_string($key) || $key === '') {
            throw new RuntimeException('Ollama is not configured.');
        }

        $text = trim($ocrText);

        if ($text === '') {
            throw new RuntimeException('OCR text is not ready to map.');
        }

        if (mb_strlen($text) > 100000) {
            $text = mb_substr($text, 0, 100000);
        }

        $response = Http::withToken($key)
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout((int) config('services.ollama.timeout'))
            ->post(rtrim((string) config('services.ollama.url'), '/').'/api/chat', [
                'model' => $model,
                'stream' => false,
                'messages' => [
                    ['role' => 'system', 'content' => DocumentFields::instructions()],
                    ['role' => 'user', 'content' => $text],
                ],
                'format' => DocumentFields::jsonSchema(),
            ]);

        if ($response->failed()) {
            $error = $response->json('error');

            throw new RuntimeException(is_string($error) && $error !== ''
                ? mb_substr($error, 0, 500)
                : 'Ollama returned HTTP '.$response->status().'.');
        }

        return DocumentFields::normalize($this->decodeContent($response->json('message.content')));
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeContent(mixed $content): array
    {
        if (is_array($content)) {
            return $content;
        }

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('The model did not return field data.');
        }

        $content = trim($content);
        $content = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $content) ?? $content;
        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('The model did not return field data.');
        }

        return $decoded;
    }
}
