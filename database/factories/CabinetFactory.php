<?php

namespace Database\Factories;

use App\Models\Cabinet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cabinet>
 */
class CabinetFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $location = fake()->unique()->city();

        return [
            'name' => $location,
            'location' => $location,
        ];
    }

    public function withDrawers(int $count = 4): static
    {
        return $this->afterCreating(function (Cabinet $cabinet) use ($count): void {
            foreach (range(1, $count) as $position) {
                $cabinet->drawers()->create([
                    'label' => "Drawer {$position}",
                    'range' => null,
                    'position' => $position,
                ]);
            }
        });
    }
}
