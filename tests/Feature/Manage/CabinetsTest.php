<?php

namespace Tests\Feature\Manage;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Drawer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CabinetsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_cabinets_and_books(): void
    {
        $this->get(route('manage.cabinets.index'))->assertRedirect(route('login'));
        $this->get(route('manage.books.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_cabinets_and_books(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('manage.cabinets.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('manage/cabinets/index'));

        $this->get(route('manage.books.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/books/index')
                ->has('books', 0)
                ->where('coverTitle', Book::DEFAULT_COVER_TITLE));
    }

    public function test_authenticated_user_can_add_a_cabinet_with_drawers(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('manage.cabinets.store'), [
            'name' => 'Sarrat',
            'drawer_count' => 3,
        ]);

        $response->assertRedirect(route('manage.cabinets.index'));

        $cabinet = Cabinet::query()->sole();

        $this->assertSame('Sarrat', $cabinet->name);
        $this->assertSame('Sarrat', $cabinet->location);
        $this->assertSame(3, $cabinet->drawers()->count());
        $this->assertSame(['Drawer 1', 'Drawer 2', 'Drawer 3'], $cabinet->drawers()->pluck('label')->all());
        $this->assertSame([1, 2, 3], $cabinet->drawers()->pluck('position')->all());
        $this->assertSame(3, Drawer::query()->count());
    }

    public function test_cabinet_fields_are_required(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('manage.cabinets.store'), []);

        $response->assertSessionHasErrors(['name', 'drawer_count']);
        $this->assertSame(0, Cabinet::query()->count());
    }

    public function test_drawer_count_must_be_between_one_and_eight(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('manage.cabinets.store'), [
            'name' => 'Sarrat',
            'drawer_count' => 9,
        ])->assertSessionHasErrors('drawer_count');

        $this->actingAs($user)->post(route('manage.cabinets.store'), [
            'name' => 'Sarrat',
            'drawer_count' => 0,
        ])->assertSessionHasErrors('drawer_count');

        $this->assertSame(0, Cabinet::query()->count());
    }

    public function test_cabinets_index_includes_drawers(): void
    {
        $user = User::factory()->create();
        Cabinet::factory()->withDrawers(2)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);

        $this->actingAs($user);

        $this->get(route('manage.cabinets.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/cabinets/index')
                ->has('cabinets', 1)
                ->where('cabinets.0.name', 'Laoag City')
                ->has('cabinets.0.drawers', 2)
                ->where('cabinets.0.drawers.0.label', 'Drawer 1')
                ->has('cabinets.0.drawers.0.books', 0));
    }

    public function test_authenticated_user_can_rename_a_drawer(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(2)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        $response = $this->actingAs($user)->from(route('manage.cabinets.index'))->patch(
            route('manage.drawers.update', $drawer),
            ['label' => 'TD 0001–0500'],
        );

        $response->assertRedirect(route('manage.cabinets.index'));
        $this->assertSame('TD 0001–0500', $drawer->fresh()?->label);
    }

    public function test_drawer_label_is_required(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        $this->actingAs($user)->patch(route('manage.drawers.update', $drawer), [
            'label' => '',
        ])->assertSessionHasErrors('label');

        $this->assertSame('Drawer 1', $drawer->fresh()?->label);
    }

    public function test_guests_cannot_rename_a_drawer(): void
    {
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        $this->patch(route('manage.drawers.update', $drawer), [
            'label' => 'TD 0001–0500',
        ])->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_rename_a_cabinet(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);

        $response = $this->actingAs($user)->from(route('manage.cabinets.index'))->patch(
            route('manage.cabinets.update', $cabinet),
            ['name' => 'Batac City'],
        );

        $response->assertRedirect(route('manage.cabinets.index'));
        $this->assertSame('Batac City', $cabinet->fresh()?->name);
        $this->assertSame('Batac City', $cabinet->fresh()?->location);
    }

    public function test_cabinet_name_is_required(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);

        $this->actingAs($user)->patch(route('manage.cabinets.update', $cabinet), [
            'name' => '',
        ])->assertSessionHasErrors('name');

        $this->assertSame('Laoag City', $cabinet->fresh()?->name);
    }

    public function test_guests_cannot_rename_a_cabinet(): void
    {
        $cabinet = Cabinet::factory()->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);

        $this->patch(route('manage.cabinets.update', $cabinet), [
            'name' => 'Batac City',
        ])->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_add_a_book_to_a_drawer(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        $response = $this->actingAs($user)->from(route('manage.cabinets.index'))->post(
            route('manage.drawers.books.store', $drawer),
            ['label' => 'TD 0001–0100'],
        );

        $response->assertRedirect(route('manage.cabinets.index'));

        $book = $drawer->books()->sole();

        $this->assertSame('TD 0001–0100', $book->label);
        $this->assertSame(Book::DEFAULT_COVER_TITLE, $book->cover_title);
        $this->assertSame(1, $book->position);
    }

    public function test_book_label_is_required(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        $this->actingAs($user)->post(route('manage.drawers.books.store', $drawer), [
            'label' => '',
        ])->assertSessionHasErrors('label');

        $this->assertSame(0, $drawer->books()->count());
    }

    public function test_drawer_cannot_hold_more_than_the_book_limit(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();

        foreach (range(1, Book::MAX_PER_DRAWER) as $position) {
            $drawer->books()->create([
                'label' => "Book {$position}",
                'position' => $position,
            ]);
        }

        $this->actingAs($user)->from(route('manage.cabinets.index'))->post(
            route('manage.drawers.books.store', $drawer),
            ['label' => 'Extra book'],
        )->assertSessionHasErrors('label');

        $this->assertSame(Book::MAX_PER_DRAWER, $drawer->books()->count());
    }

    public function test_authenticated_user_can_rename_a_book(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'Book 1',
            'position' => 1,
        ]);

        $response = $this->actingAs($user)->from(route('manage.cabinets.index'))->patch(
            route('manage.books.update', $book),
            ['label' => 'TD 0001–0100'],
        );

        $response->assertRedirect(route('manage.cabinets.index'));
        $this->assertSame('TD 0001–0100', $book->fresh()?->label);
        $this->assertSame(Book::DEFAULT_COVER_TITLE, $book->fresh()?->cover_title);
    }

    public function test_books_index_lists_a_shared_cover_title(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'cover_title' => 'Land Tax',
            'position' => 1,
        ]);

        $this->actingAs($user);

        $this->get(route('manage.books.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/books/index')
                ->has('books', 1)
                ->where('books.0.label', 'TD 0001–0100')
                ->missing('books.0.coverTitle')
                ->where('coverTitle', 'Land Tax')
                ->where('books.0.cabinetName', 'Laoag City')
                ->where('books.0.drawerLabel', $drawer->label));
    }

    public function test_books_index_accepts_a_drawer_query_string(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $drawer->books()->create([
            'label' => 'Book 1',
            'position' => 1,
        ]);

        $this->actingAs($user)
            ->get(route('manage.books.index', ['drawer' => $drawer->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/books/index')
                ->has('books', 1)
                ->where('books.0.drawerId', (string) $drawer->id));
    }

    public function test_updating_cover_title_applies_to_every_book(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $first = $drawer->books()->create([
            'label' => 'Book 1',
            'position' => 1,
        ]);
        $second = $drawer->books()->create([
            'label' => 'Book 2',
            'position' => 2,
        ]);

        $response = $this->actingAs($user)->from(route('manage.books.index'))->patch(
            route('manage.books.update', $first),
            [
                'label' => 'TD 0001–0100',
                'cover_title' => 'Land Tax',
            ],
        );

        $response->assertRedirect(route('manage.books.index'));
        $this->assertSame('TD 0001–0100', $first->fresh()?->label);
        $this->assertSame('Book 2', $second->fresh()?->label);
        $this->assertSame('Land Tax', $first->fresh()?->cover_title);
        $this->assertSame('Land Tax', $second->fresh()?->cover_title);
    }

    public function test_new_books_inherit_the_shared_cover_title(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $drawer->books()->create([
            'label' => 'Book 1',
            'cover_title' => 'Land Tax',
            'position' => 1,
        ]);

        $this->actingAs($user)->from(route('manage.cabinets.index'))->post(
            route('manage.drawers.books.store', $drawer),
            ['label' => 'Book 2'],
        );

        $this->assertSame('Land Tax', $drawer->books()->where('label', 'Book 2')->value('cover_title'));
    }

    public function test_guests_cannot_add_or_rename_a_book(): void
    {
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'Book 1',
            'position' => 1,
        ]);

        $this->post(route('manage.drawers.books.store', $drawer), [
            'label' => 'TD 0001–0100',
        ])->assertRedirect(route('login'));

        $this->patch(route('manage.books.update', $book), [
            'label' => 'TD 0001–0100',
        ])->assertRedirect(route('login'));
    }

    public function test_old_archive_cabinet_and_book_urls_redirect(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get('/archive/cabinets')->assertRedirect('/manage/cabinets');
        $this->get('/archive/books')->assertRedirect('/manage/books');
    }
}
