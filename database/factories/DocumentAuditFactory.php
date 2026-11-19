<?php

namespace Database\Factories;

use App\Models\DocumentAudit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentAudit>
 */
class DocumentAuditFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_id' => null,
            'document_reference' => 1,
            'action' => 'fields_updated',
            'actor_type' => 'system',
            'context' => [],
            'changes' => [],
            'imported' => false,
            'occurred_at' => now(),
        ];
    }
}
