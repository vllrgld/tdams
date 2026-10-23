<?php

namespace Tests\Feature;

use App\Models\Cabinet;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ArchiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('archive.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_archive()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('archive.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('archive/index')
            ->has('cabinets', 0));
    }

    public function test_archive_includes_stored_cabinets()
    {
        $user = User::factory()->create();
        Cabinet::factory()->withDrawers(3)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('archive.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('archive/index')
            ->has('cabinets', 1)
            ->where('cabinets.0.name', 'Laoag City')
            ->where('cabinets.0.location', 'Laoag City')
            ->has('cabinets.0.drawers', 3)
            ->where('cabinets.0.drawers.0.books', []));
    }

    public function test_archive_includes_books_in_drawers(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);

        $this->actingAs($user);

        $this->get(route('archive.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('archive/index')
                ->has('cabinets.0.drawers.0.books', 1)
                ->where('cabinets.0.drawers.0.books.0.label', 'TD 0001–0100')
                ->where('cabinets.0.drawers.0.books.0.coverTitle', 'Tax Declaration')
                ->where('cabinets.0.drawers.0.books.0.documentCount', 0)
                ->missing('cabinets.0.drawers.0.books.0.documents'));
    }

    public function test_archive_includes_document_counts_without_nested_documents(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);
        Document::query()->create([
            'book_id' => $book->id,
            'position' => 2,
            'tax_declaration_number' => 'TD-2026-00482',
            'original_filename' => 'second.pdf',
            'storage_path' => 'documents/second.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 2048,
            'uploaded_by' => $user->id,
        ]);
        Document::query()->create([
            'book_id' => $book->id,
            'position' => 1,
            'tax_declaration_number' => 'TD-2026-00481',
            'original_filename' => 'first.pdf',
            'storage_path' => 'documents/first.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('archive.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('archive/index')
                ->where('cabinets.0.drawers.0.books.0.documentCount', 2)
                ->missing('cabinets.0.drawers.0.books.0.documents'));
    }

    public function test_archive_book_documents_are_fetched_lazily(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);
        $second = Document::query()->create([
            'book_id' => $book->id,
            'position' => 2,
            'tax_declaration_number' => 'TD-2026-00482',
            'original_filename' => 'second.pdf',
            'storage_path' => 'documents/second.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 2048,
            'uploaded_by' => $user->id,
        ]);
        $first = Document::query()->create([
            'book_id' => $book->id,
            'position' => 1,
            'tax_declaration_number' => 'TD-2026-00481',
            'original_filename' => 'first.pdf',
            'storage_path' => 'documents/first.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('archive.books.show', $book))
            ->assertOk()
            ->assertJsonPath('documents.0.id', $first->id)
            ->assertJsonPath('documents.0.taxDeclarationNumber', 'TD-2026-00481')
            ->assertJsonPath('documents.0.originalFilename', 'first.pdf')
            ->assertJsonPath('documents.0.mimeType', 'application/pdf')
            ->assertJsonPath('documents.0.viewUrl', route('documents.view', $first))
            ->assertJsonPath('documents.1.id', $second->id)
            ->assertJsonPath('documents.1.taxDeclarationNumber', 'TD-2026-00482');
    }

    public function test_guests_cannot_fetch_archive_book_documents(): void
    {
        $cabinet = Cabinet::factory()->withDrawers(1)->create();
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);

        $this->getJson(route('archive.books.show', $book))
            ->assertUnauthorized();
    }

    public function test_archive_locates_a_filed_document_by_tax_declaration_number(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create([
            'name' => 'Laoag City',
            'location' => 'Laoag City',
        ]);
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create([
            'label' => 'TD 0001–0100',
            'position' => 1,
        ]);
        $document = Document::query()->create([
            'book_id' => $book->id,
            'position' => 1,
            'tax_declaration_number' => 'TD-2026-00481',
            'original_filename' => 'first.pdf',
            'storage_path' => 'documents/first.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('archive.documents.locate', ['number' => 'td-2026-00481']))
            ->assertOk()
            ->assertJsonPath('document.id', $document->id)
            ->assertJsonPath('cabinetId', (string) $cabinet->id)
            ->assertJsonPath('drawerId', (string) $drawer->id)
            ->assertJsonPath('bookId', (string) $book->id);
    }

    public function test_archive_locate_returns_null_when_the_document_is_not_filed(): void
    {
        $user = User::factory()->create();
        Document::query()->create([
            'book_id' => null,
            'position' => null,
            'tax_declaration_number' => 'TD-2026-00999',
            'original_filename' => 'loose.pdf',
            'storage_path' => 'documents/loose.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 512,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->getJson(route('archive.documents.locate', ['number' => 'TD-2026-00999']))
            ->assertOk()
            ->assertJsonPath('document', null);
    }

    public function test_filing_cabinets_url_redirects_to_archive()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get('/filing-cabinets');
        $response->assertRedirect('/archive');
    }
}
