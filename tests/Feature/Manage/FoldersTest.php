<?php

namespace Tests\Feature\Manage;

use App\Jobs\OcrDocument;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Drawer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FoldersTest extends TestCase
{
    use RefreshDatabase;

    private function drawer(): Drawer
    {
        return Cabinet::factory()->withDrawers(1)->create()->drawers()->firstOrFail();
    }

    public function test_a_named_folder_can_be_added_to_an_empty_drawer_and_listed_everywhere(): void
    {
        $drawer = $this->drawer();
        $this->actingAs(User::factory()->create())
            ->from('/manage/cabinets')
            ->post(route('manage.drawers.books.store', $drawer), ['label' => 'Land records', 'kind' => 'folder'])
            ->assertRedirect('/manage/cabinets')->assertSessionHasNoErrors();

        $folder = $drawer->books()->sole();
        $this->assertSame('folder', $folder->kind);
        $this->assertSame('Land records', $folder->label);
        $this->assertSame(Book::DEFAULT_COVER_TITLE, $folder->cover_title);
        $this->assertSame(1, $folder->position);

        $this->get('/manage/cabinets')->assertInertia(fn (Assert $page) => $page
            ->where('cabinets.0.drawers.0.books.0.kind', 'folder'));
        $this->get('/manage/folders')->assertInertia(fn (Assert $page) => $page
            ->component('manage/folders/index')
            ->where('books.0.kind', 'folder')->where('books.0.label', 'Land records'));
        $this->get('/manage/books')->assertInertia(fn (Assert $page) => $page
            ->has('books', 0));
        $this->get('/archive')->assertInertia(fn (Assert $page) => $page
            ->where('cabinets.0.drawers.0.books.0.kind', 'folder'));
        $this->get('/documents')->assertInertia(fn (Assert $page) => $page
            ->where('archive.0.drawers.0.books.0.kind', 'folder'));
        $this->getJson('/search?q=Land')->assertJsonPath('books.0.kind', 'folder');
    }

    public function test_books_and_folders_cannot_be_mixed_in_either_direction(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['book' => 'folder', 'folder' => 'book'] as $existing => $attempted) {
            $drawer = $this->drawer();
            $drawer->books()->create(['label' => 'Existing', 'kind' => $existing, 'position' => 1]);
            $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Wrong type', 'kind' => $attempted])
                ->assertSessionHasErrors('kind');
            $this->assertSame(1, $drawer->books()->count());
            $this->assertSame($existing, $drawer->books()->sole()->kind);
        }
    }

    public function test_folder_drawers_accept_more_folders_in_order_and_stop_at_capacity(): void
    {
        $drawer = $this->drawer();
        $this->actingAs(User::factory()->create());
        foreach (range(1, Book::MAX_PER_DRAWER) as $position) {
            $this->post(route('manage.drawers.books.store', $drawer), ['label' => "Folder {$position}", 'kind' => 'folder'])
                ->assertSessionHasNoErrors();
        }
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Extra', 'kind' => 'folder'])
            ->assertSessionHasErrors('label');
        $this->assertSame(range(1, Book::MAX_PER_DRAWER), $drawer->books()->pluck('position')->all());
    }

    public function test_invalid_folder_type_and_blank_name_are_rejected(): void
    {
        $drawer = $this->drawer();
        $this->actingAs(User::factory()->create());
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Invalid', 'kind' => 'box'])
            ->assertSessionHasErrors('kind');
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => '', 'kind' => 'folder'])
            ->assertSessionHasErrors('label');
        $this->assertSame(0, $drawer->books()->count());
    }

    public function test_folder_renaming_does_not_change_book_covers_or_allow_type_conversion(): void
    {
        $folder = $this->drawer()->books()->create(['label' => 'Folder 1', 'kind' => 'folder', 'cover_title' => '', 'position' => 1]);
        $book = $this->drawer()->books()->create(['label' => 'Book 1', 'cover_title' => 'Land Tax', 'position' => 1]);
        $this->actingAs(User::factory()->create());
        $this->get('/manage/folders')->assertInertia(fn (Assert $page) => $page
            ->has('books', 1)->where('books.0.id', (string) $folder->id));
        $this->get('/manage/books')->assertInertia(fn (Assert $page) => $page
            ->has('books', 1)->where('books.0.id', (string) $book->id));
        $this->patch(route('manage.books.update', $folder), ['label' => 'Renamed folder', 'kind' => 'book'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Renamed folder', $folder->fresh()->label);
        $this->assertSame('folder', $folder->fresh()->kind);
        $this->assertSame('Land Tax', $book->fresh()->cover_title);
        $this->assertSame('Land Tax', Book::coverTitle());
        $this->patch(route('manage.books.update', $book), ['label' => 'Book 1', 'cover_title' => 'Tax records'])
            ->assertSessionHasNoErrors();
        $this->assertSame('', $folder->fresh()->cover_title);
    }

    public function test_folder_cover_text_is_shared_independently_and_inherited_by_new_folders(): void
    {
        $drawer = $this->drawer();
        $folder = $drawer->books()->create(['label' => 'Folder 1', 'kind' => 'folder', 'cover_title' => '', 'position' => 1]);
        $other = $this->drawer()->books()->create(['label' => 'Folder 2', 'kind' => 'folder', 'cover_title' => '', 'position' => 1]);
        $book = $this->drawer()->books()->create(['label' => 'Book 1', 'cover_title' => 'Book records', 'position' => 1]);
        $this->actingAs(User::factory()->create());

        $this->patch(route('manage.books.update', $folder), ['label' => 'Land records', 'cover_title' => 'Property Archive'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Land records', $folder->fresh()->label);
        $this->assertSame('Folder 2', $other->fresh()->label);
        $this->assertSame('Property Archive', $folder->fresh()->cover_title);
        $this->assertSame('Property Archive', $other->fresh()->cover_title);
        $this->assertSame('Book records', $book->fresh()->cover_title);
        $this->assertSame('Property Archive', Book::coverTitle('folder'));

        $this->get('/manage/folders')->assertInertia(fn (Assert $page) => $page
            ->where('coverTitle', 'Property Archive'));
        $this->get('/manage/cabinets')->assertInertia(fn (Assert $page) => $page
            ->where('folderCoverTitle', 'Property Archive')->where('coverTitle', 'Book records'));
        $this->get('/archive')->assertInertia(fn (Assert $page) => $page
            ->where('cabinets', fn ($cabinets) => collect($cabinets)
                ->flatMap(fn ($cabinet) => $cabinet['drawers'])
                ->flatMap(fn ($drawer) => $drawer['books'])
                ->firstWhere('id', (string) $folder->id)['coverTitle'] === 'Property Archive'));

        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Folder 3', 'kind' => 'folder'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Property Archive', $drawer->books()->where('label', 'Folder 3')->sole()->cover_title);

        $this->patch(route('manage.books.update', $book), ['label' => 'Book 1', 'cover_title' => 'New book title'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Property Archive', $folder->fresh()->cover_title);
    }

    public function test_blank_and_overlong_shared_folder_titles_are_rejected_without_renaming(): void
    {
        $folder = $this->drawer()->books()->create(['label' => 'Folder 1', 'kind' => 'folder', 'cover_title' => 'Land records', 'position' => 1]);
        $this->actingAs(User::factory()->create());
        foreach (['', str_repeat('a', 81)] as $title) {
            $this->patch(route('manage.books.update', $folder), ['label' => 'Should not change', 'cover_title' => $title])
                ->assertSessionHasErrors('cover_title');
            $this->assertSame('Folder 1', $folder->fresh()->label);
            $this->assertSame('Land records', $folder->fresh()->cover_title);
        }
    }

    public function test_documents_can_be_uploaded_to_a_folder_and_loaded_from_the_archive(): void
    {
        Storage::fake('local');
        Queue::fake();
        $folder = $this->drawer()->books()->create(['label' => 'Land records', 'kind' => 'folder', 'cover_title' => '', 'position' => 1]);
        $this->actingAs(User::factory()->create())->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('folder-document.pdf', 12, 'application/pdf'),
            'book_id' => $folder->id,
        ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();
        $document = Document::query()->sole();
        $this->assertSame($folder->id, $document->book_id);
        $this->assertSame(1, $document->position);
        Storage::disk('local')->assertExists($document->storage_path);
        Queue::assertPushed(OcrDocument::class);
        $this->getJson(route('archive.books.show', $folder))->assertOk()
            ->assertJsonPath('documents.0.id', $document->id);
    }

    public function test_guests_cannot_create_folders(): void
    {
        $drawer = $this->drawer();
        $this->get('/manage/folders')->assertRedirect(route('login'));
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Folder 1', 'kind' => 'folder'])
            ->assertRedirect(route('login'));
        $this->assertSame(0, $drawer->books()->count());
    }
}
