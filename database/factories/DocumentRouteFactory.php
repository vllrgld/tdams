<?php

namespace Database\Factories;

use App\Models\DocumentRoute;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentRoute>
 */
class DocumentRouteFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Receiving to records',
        ];
    }

    /**
     * @param  list<string>  $steps
     */
    public function withSteps(array $steps = ['Receiving', 'Records']): static
    {
        return $this->afterCreating(function (DocumentRoute $route) use ($steps): void {
            foreach ($steps as $index => $name) {
                $route->steps()->create([
                    'name' => $name,
                    'position' => $index + 1,
                ]);
            }
        });
    }
}
