<?php

namespace Database\Factories;

use App\Models\DocumentAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentAttachment>
 */
class DocumentAttachmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'description' => 'Certified true copy of title',
            'page' => 1,
            'position' => 1,
        ];
    }
}
