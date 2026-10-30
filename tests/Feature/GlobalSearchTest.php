<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GlobalSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_authentication(): void
    {
        $this->getJson(route('system.search', ['q' => 'cabinet']))->assertUnauthorized();
    }

    public function test_short_queries_return_no_records(): void
    {
        $user = User::factory()->create();
        Cabinet::factory()->create(['name' => 'North cabinet', 'location' => 'Laoag']);

        foreach (['', ' ', 'N'] as $query) {
            $this->actingAs($user)->getJson(route('system.search', ['q' => $query]))
                ->assertExactJson(['cabinets' => [], 'drawers' => [], 'books' => []]);
        }
    }

    public function test_cabinet_drawer_and_book_results_open_their_archive_pages(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'North cabinet',
            'location' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $drawer->update(['label' => 'Owner drawer', 'range' => 'A–C']);
        $book = $drawer->books()->create([
            'label' => 'Field book',
            'cover_title' => Book::DEFAULT_COVER_TITLE,
            'position' => 1,
        ]);
        Cabinet::factory()->create(['name' => 'South cabinet', 'location' => 'Batac']);

        $this->actingAs($user)->getJson(route('system.search', ['q' => 'North']))
            ->assertOk()
            ->assertJsonCount(1, 'cabinets')
            ->assertJsonPath('cabinets.0.title', 'North cabinet')
            ->assertJsonPath('cabinets.0.hint', 'Archive > Laoag City')
            ->assertJsonPath('cabinets.0.url', '/archive?cabinet='.$cabinet->id);

        $this->actingAs($user)->getJson(route('system.search', ['q' => 'Owner drawer']))
            ->assertOk()
            ->assertJsonCount(1, 'drawers')
            ->assertJsonPath('drawers.0.title', 'Owner drawer')
            ->assertJsonPath('drawers.0.hint', 'Archive > North cabinet')
            ->assertJsonPath('drawers.0.url', '/archive?cabinet='.$cabinet->id.'&drawer='.$drawer->id);

        $this->actingAs($user)->getJson(route('system.search', ['q' => 'Field book']))
            ->assertOk()
            ->assertJsonCount(1, 'books')
            ->assertJsonPath('books.0.title', 'Field book')
            ->assertJsonPath('books.0.hint', 'North cabinet > Owner drawer')
            ->assertJsonPath('books.0.url', '/archive?cabinet='.$cabinet->id.'&drawer='.$drawer->id.'&book='.$book->id);
    }

    public function test_default_book_covers_do_not_match_every_book(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $cabinet->drawers()->firstOrFail()->books()->create([
            'label' => 'Volume 1',
            'cover_title' => Book::DEFAULT_COVER_TITLE,
            'position' => 1,
        ]);

        $this->actingAs($user)->getJson(route('system.search', ['q' => 'Tax Declaration']))
            ->assertOk()
            ->assertJsonCount(0, 'books');
    }

    public function test_invalid_queries_are_rejected(): void
    {
        $user = User::factory()->create();

        foreach ([str_repeat('x', 201), ['invalid']] as $query) {
            $this->actingAs($user)->getJson(route('system.search', ['q' => $query]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('q');
        }
    }
}
