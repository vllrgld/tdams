<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OfficeIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_documents_from_another_office_are_hidden_until_that_office_is_selected(): void
    {
        $user = User::factory()->create();
        $receiving = Office::query()->where('name', Office::RECEIVING_NAME)->firstOrFail();
        $other = Office::factory()->create(['name' => 'Assessment Office']);
        $book = $this->book();
        $otherBook = $this->book($other);

        $hidden = $this->document($user, [
            'office_id' => $other->id,
            'book_id' => $otherBook->id,
            'tax_declaration_number' => 'TD-OTHER',
        ]);
        $visible = $this->document($user, [
            'office_id' => $receiving->id,
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-RECEIVING',
        ]);

        $this->actingAs($user);

        $this->get($this->taxDocumentsIndex())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('officeName', Office::RECEIVING_NAME)
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $visible->id));

        $this->getJson(route('documents.search', ['q' => 'TD-OTHER']))
            ->assertExactJson(['data' => [], 'hasMore' => false]);

        $this->getJson(route('documents.search', ['q' => 'TD-RECEIVING']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $visible->id);

        $this->getJson(route('documents.ocr', $hidden))->assertNotFound();

        $this->get(route('documents.index', ['document' => $hidden->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('selectedDocument', null));

        $this->getJson(route('archive.books.show', $book))
            ->assertOk()
            ->assertJsonCount(1, 'documents')
            ->assertJsonPath('documents.0.id', $visible->id);

        $this->get(route('archive.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('cabinets.0.drawers.0.books.0.documentCount', 1));

        $this->from(route('documents.index'))
            ->put(route('offices.current.update'), ['office_id' => $other->id])
            ->assertRedirect(route('documents.index'));

        $this->get($this->taxDocumentsIndex())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('officeName', 'Assessment Office')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $hidden->id));

        $this->getJson(route('documents.ocr', $visible))->assertNotFound();

        $this->getJson(route('documents.ocr', $hidden))->assertOk();
    }

    public function test_uploads_are_stamped_with_the_current_office(): void
    {
        Queue::fake();
        Storage::fake('local');
        $user = User::factory()->create();
        $other = Office::factory()->create(['name' => 'Assessment Office']);
        $book = $this->book($other);

        $this->actingAs($user)
            ->withSession(['current_office_id' => $other->id])
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
                'book_id' => $book->id,
                'tax_declaration_number' => 'TD-ASSESS',
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();
        $this->assertSame($other->id, $document->office_id);

        $this->get($this->taxDocumentsIndex())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $document->id));
    }

    /** @param  array<string, mixed>  $attributes */
    private function document(User $user, array $attributes = []): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'office.pdf',
            'storage_path' => 'documents/office.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            'tax_declaration_number' => 'TD-OFFICE',
            ...$attributes,
        ]);
    }

    private function book(?Office $office = null): Book
    {
        $cabinet = Cabinet::factory()->withDrawers(1)->create($office === null ? [] : ['office_id' => $office->id]);

        return $cabinet->drawers()->firstOrFail()->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);
    }
}
