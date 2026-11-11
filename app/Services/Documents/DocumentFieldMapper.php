<?php

namespace App\Services\Documents;

use App\Services\Bedrock\BedrockClient;
use App\Services\Groq\GroqClient;
use App\Services\Ollama\OllamaClient;
use RuntimeException;

class DocumentFieldMapper
{
    public function __construct(private OllamaClient $ollama, private BedrockClient $bedrock, private GroqClient $groq) {}

    /** @return list<string> */
    public function models(): array
    {
        return array_values(array_unique(array_merge(...array_values($this->modelsByProvider()))));
    }

    /** @return array<string, string|null> */
    public function mapFields(string $model, string $ocrText): array
    {
        foreach ($this->modelsByProvider() as $provider => $models) {
            if (! in_array($model, $models, true)) {
                continue;
            }

            return match ($provider) {
                'ollama' => $this->ollama->mapFields($model, $ocrText),
                'bedrock' => $this->bedrock->mapFields($model, $ocrText),
                'groq' => $this->groq->mapFields($model, $ocrText),
            };
        }

        throw new RuntimeException('That model is not available.');
    }

    /** @return array<'groq'|'bedrock'|'ollama', list<string>> */
    private function modelsByProvider(): array
    {
        $providers = ['groq', 'bedrock'];
        $preferred = config('services.field_mapping.provider');

        if (in_array($preferred, ['groq', 'bedrock', 'ollama'], true)) {
            array_unshift($providers, $preferred);
        }

        $modelsByProvider = [];

        foreach (array_unique($providers) as $provider) {
            $models = config('services.'.$provider.'.models');
            $modelsByProvider[$provider] = is_array($models)
                ? array_values(array_filter($models, fn (mixed $model): bool => is_string($model)
                    && trim($model) !== ''))
                : [];
        }

        return $modelsByProvider;
    }
}
