<?php

namespace Database\Factories;

use App\Models\Cabinet;
use App\Models\Drawer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Drawer>
 */
class DrawerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cabinet_id' => Cabinet::factory(),
            'label' => 'Drawer 1',
            'range' => null,
            'position' => 1,
        ];
    }
}
