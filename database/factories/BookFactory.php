<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Drawer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'drawer_id' => Drawer::factory(),
            'label' => 'Book 1',
            'position' => 1,
        ];
    }
}
