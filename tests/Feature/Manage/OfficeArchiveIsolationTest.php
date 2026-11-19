<?php

namespace Tests\Feature\Manage;

use App\Jobs\OcrDocument;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OfficeArchiveIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_archive_management_upload_options_and_search_only_list_the_selected_offices_structure(): void
    {
        $user = User::factory()->create();
        $receiving = Office::query()->where('is_receiving', true)->sole();
        $other = Office::factory()->create();
        $first = $this->cabinet($receiving);
        $second = $this->cabinet($other);

        foreach ([$first, $second] as $cabinet) {
            $book = $cabinet->drawers[0]->books()->sole();
            $folder = $cabinet->drawers[1]->books()->sole();
            $this->actingAs($user)->withSession(['current_office_id' => $cabinet->office_id]);

            foreach (['archive.index', 'manage.cabinets.index'] as $route) {
                $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page
                    ->has('cabinets', 1)->where('cabinets.0.id', (string) $cabinet->id)
                    ->where('cabinets.0.drawers.0.books.0.id', (string) $book->id)
                    ->where('cabinets.0.drawers.1.books.0.id', (string) $folder->id));
            }

            $this->get(route('manage.books.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->has('books', 1)->where('books.0.id', (string) $book->id));
            $this->get(route('manage.folders.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->has('books', 1)->where('books.0.id', (string) $folder->id));
            $this->get(route('documents.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->has('archive', 1)->where('archive.0.id', (string) $cabinet->id));
            $this->getJson(route('documents.upload-options'))->assertOk()
                ->assertJsonCount(1, 'archive')->assertJsonPath('archive.0.id', (string) $cabinet->id);
            $this->getJson(route('system.search', ['q' => 'Shared']))->assertOk()
                ->assertJsonCount(1, 'cabinets')->assertJsonPath('cabinets.0.id', $cabinet->id)
                ->assertJsonCount(2, 'drawers')->assertJsonPath('drawers.0.id', $cabinet->drawers[0]->id)
                ->assertJsonCount(2, 'books')->assertJsonPath('books.0.id', $book->id)
                ->assertJsonPath('books.1.id', $folder->id);
        }
    }

    public function test_new_cabinets_and_their_contents_belong_to_the_active_office_even_if_another_office_id_is_submitted(): void
    {
        $office = Office::factory()->create();
        $receiving = Office::query()->where('is_receiving', true)->sole();

        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id])
            ->post(route('manage.cabinets.store'), [
                'name' => 'My archive', 'drawers' => ['Books', 'Folders'], 'office_id' => $receiving->id,
            ])->assertRedirect(route('manage.cabinets.index'))->assertSessionHasNoErrors();
        $cabinet = Cabinet::query()->sole();
        $this->assertSame($office->id, $cabinet->office_id);

        foreach (['book', 'folder'] as $index => $kind) {
            $drawer = $cabinet->drawers[$index];
            $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'My '.$kind, 'kind' => $kind])
                ->assertRedirect()->assertSessionHasNoErrors();
            $item = $drawer->books()->sole();
            $this->assertSame($kind, $item->kind);
            $this->assertSame($office->id, $item->drawer->cabinet->office_id);
        }
    }

    public function test_other_offices_cabinets_drawers_books_and_folders_cannot_be_opened_or_changed_directly(): void
    {
        $cabinet = $this->cabinet(Office::factory()->create());
        $this->actingAs(User::factory()->create());

        $this->patch(route('manage.cabinets.update', $cabinet), ['name' => 'Changed'])->assertNotFound();

        foreach ($cabinet->drawers as $drawer) {
            $item = $drawer->books()->sole();
            $this->patch(route('manage.drawers.update', $drawer), ['label' => 'Changed'])->assertNotFound();
            $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'New', 'kind' => $item->kind])->assertNotFound();
            $this->patch(route('manage.books.update', $item), ['label' => 'Changed'])->assertNotFound();
            $this->getJson(route('archive.books.show', $item))->assertNotFound();
            $this->assertSame('Shared '.$item->kind, $item->refresh()->label);
            $this->assertSame('Shared drawer '.$drawer->position, $drawer->refresh()->label);
            $this->assertSame(1, $drawer->books()->count());
        }

        $this->assertSame('Shared archive', $cabinet->refresh()->name);
    }

    public function test_uploads_cannot_be_archived_in_another_offices_book_or_folder(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $cabinet = $this->cabinet(Office::factory()->create());
        $this->actingAs(User::factory()->create());

        foreach ($cabinet->drawers as $drawer) {
            $this->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('document.pdf', 10, 'application/pdf'),
                'book_id' => $drawer->books()->sole()->id,
            ])->assertUnprocessable()->assertJsonValidationErrors('book_id');
        }

        $this->assertDatabaseCount('documents', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
        Queue::assertNothingPushed();
    }

    public function test_own_office_uploads_are_saved_in_its_book_and_are_visible_only_in_its_archive(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $office = Office::factory()->create();
        $cabinet = $this->cabinet($office);
        $book = $cabinet->drawers[0]->books()->sole();

        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id])
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('document.pdf', 10, 'application/pdf'),
                'book_id' => $book->id,
            ])->assertOk();
        $document = Document::query()->sole();
        $this->assertSame($office->id, $document->office_id);
        $this->assertSame($book->id, $document->book_id);
        Storage::disk('local')->assertExists($document->storage_path);
        Queue::assertPushed(OcrDocument::class, fn (OcrDocument $job): bool => $job->documentId === $document->id);
        $this->getJson(route('archive.books.show', $book))->assertOk()
            ->assertJsonCount(1, 'documents')->assertJsonPath('documents.0.id', $document->id);

        $receiving = Office::query()->where('is_receiving', true)->sole();
        $this->put(route('offices.current.update'), ['office_id' => $receiving->id])->assertRedirect();
        $this->getJson(route('archive.books.show', $book))->assertNotFound();
    }

    public function test_an_office_with_cabinets_cannot_be_deleted_even_without_documents(): void
    {
        $office = Office::factory()->create();
        Cabinet::factory()->for($office)->create();

        $this->actingAs(User::factory()->create())->delete(route('offices.destroy', $office))
            ->assertSessionHasErrors('office');
        $this->assertModelExists($office);
    }

    private function cabinet(Office $office): Cabinet
    {
        $cabinet = Cabinet::factory()->for($office)->withDrawers(2)->create(['name' => 'Shared archive']);

        foreach (['book', 'folder'] as $index => $kind) {
            $drawer = $cabinet->drawers[$index];
            $drawer->update(['label' => 'Shared drawer '.$drawer->position]);
            $drawer->books()->create(['label' => 'Shared '.$kind, 'kind' => $kind, 'position' => 1]);
        }

        return $cabinet;
    }
}
