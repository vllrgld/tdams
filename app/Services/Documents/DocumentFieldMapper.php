<?php

namespace App\Services\Documents;

use App\Services\Groq\GroqClient;
use RuntimeException;

class DocumentFieldMapper
{
    public function __construct(private GroqClient $groq) {}

    /** @return list<string> */
    public function models(): array
    {
        $models = config('services.groq.models');

        return is_array($models)
            ? array_values(array_unique(array_filter($models, fn (mixed $model): bool => is_string($model) && trim($model) !== '')))
            : [];
    }

    /** @return array<string, mixed> */
    public function mapFields(string $model, string $ocrText, bool $taxFields = true): array
    {
        if (! in_array($model, $this->models(), true)) {
            throw new RuntimeException('That model is not available.');
        }

        return $this->groq->mapFields($model, $ocrText, $taxFields);
    }
}
