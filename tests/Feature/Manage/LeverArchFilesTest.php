<?php

namespace Tests\Feature\Manage;

use App\Jobs\OcrDocument;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class LeverArchFilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_lever_arch_files_are_created_and_listed_separately_across_management_archive_upload_and_search(): void
    {
        $drawer = Cabinet::factory()->withDrawers(1)->create()->drawers()->firstOrFail();
        $this->actingAs(User::factory()->create())
            ->post(route('manage.drawers.books.store', $drawer), ['label' => 'Blue assessment files', 'kind' => 'lever_arch'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $file = $drawer->books()->sole();
        $this->assertSame('lever_arch', $file->kind);
        $this->assertSame(1, $file->position);
        $this->get(route('manage.lever-arch-files.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('manage/lever-arch-files/index')->has('books', 1)
            ->where('books.0.id', (string) $file->id)->where('books.0.kind', 'lever_arch'));
        foreach (['manage.books.index', 'manage.folders.index'] as $route) {
            $this->get(route($route))->assertInertia(fn (Assert $page) => $page->has('books', 0));
        }
        $this->get(route('archive.index'))->assertInertia(fn (Assert $page) => $page->where('cabinets.0.drawers.0.books.0.kind', 'lever_arch'));
        $this->getJson(route('documents.upload-options'))->assertOk()->assertJsonPath('archive.0.drawers.0.books.0.kind', 'lever_arch');
        $this->getJson(route('system.search', ['q' => 'Blue assessment']))->assertOk()->assertJsonPath('books.0.kind', 'lever_arch');
        $this->patch(route('manage.books.update', $file), ['label' => 'Renamed file', 'cover_title' => 'Assessments', 'kind' => 'book'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('books', ['id' => $file->id, 'label' => 'Renamed file', 'cover_title' => 'Assessments', 'kind' => 'lever_arch']);
    }

    #[TestWith(['book', 'lever_arch'])]
    #[TestWith(['folder', 'lever_arch'])]
    #[TestWith(['lever_arch', 'book'])]
    #[TestWith(['lever_arch', 'folder'])]
    public function test_lever_arch_files_cannot_share_a_drawer_with_another_type(string $existing, string $attempted): void
    {
        $file = Book::factory()->create(['kind' => $existing]);
        $this->actingAs(User::factory()->create())->post(route('manage.drawers.books.store', $file->drawer), ['label' => 'Wrong type', 'kind' => $attempted])
            ->assertSessionHasErrors('kind');
        $this->assertDatabaseCount('books', 1);
    }

    public function test_lever_arch_files_stop_at_sixteen_and_preserve_order(): void
    {
        $drawer = Cabinet::factory()->withDrawers(1)->create()->drawers()->firstOrFail();
        $this->actingAs(User::factory()->create());
        foreach (range(1, 16) as $position) {
            $this->post(route('manage.drawers.books.store', $drawer), ['label' => "File {$position}", 'kind' => 'lever_arch'])
                ->assertSessionHasNoErrors();
        }
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'Extra', 'kind' => 'lever_arch'])
            ->assertSessionHasErrors(['label' => 'A drawer can hold at most 16 lever arch files.']);
        $this->assertSame(range(1, 16), $drawer->books()->pluck('position')->all());
    }

    public function test_document_can_be_filed_in_and_read_from_a_lever_arch_file(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $file = Book::factory()->create(['kind' => 'lever_arch']);
        $this->actingAs(User::factory()->create())->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('assessment.pdf', 12, 'application/pdf'), 'book_id' => $file->id,
        ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();
        $document = Document::query()->sole();
        $this->assertSame($file->id, $document->book_id);
        Storage::disk('local')->assertExists($document->storage_path);
        Queue::assertPushed(OcrDocument::class);
        $this->getJson(route('archive.books.show', $file))->assertOk()->assertJsonPath('documents.0.id', $document->id);
    }

    public function test_other_offices_lever_arch_files_cannot_be_listed_changed_or_used_for_upload(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $cabinet = Cabinet::factory()->for(Office::factory())->withDrawers(1)->create();
        $file = Book::factory()->for($cabinet->drawers()->firstOrFail())->create(['kind' => 'lever_arch']);
        $this->actingAs(User::factory()->create());
        $this->get(route('manage.lever-arch-files.index'))->assertInertia(fn (Assert $page) => $page->has('books', 0));
        $this->patch(route('manage.books.update', $file), ['label' => 'Changed'])->assertNotFound();
        $this->getJson(route('archive.books.show', $file))->assertNotFound();
        $this->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('assessment.pdf', 12, 'application/pdf'), 'book_id' => $file->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('book_id');
        $this->assertDatabaseCount('documents', 0);
        Queue::assertNothingPushed();
    }

    public function test_guests_cannot_manage_lever_arch_files(): void
    {
        $drawer = Cabinet::factory()->withDrawers(1)->create()->drawers()->firstOrFail();
        $this->get(route('manage.lever-arch-files.index'))->assertRedirect(route('login'));
        $this->post(route('manage.drawers.books.store', $drawer), ['label' => 'File 1', 'kind' => 'lever_arch'])->assertRedirect(route('login'));
        $this->assertDatabaseCount('books', 0);
    }
}
