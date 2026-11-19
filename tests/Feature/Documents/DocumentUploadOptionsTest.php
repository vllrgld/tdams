<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentUploadOptionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_load_upload_options_without_loading_a_page(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create([
            'label' => 'Property files',
            'kind' => 'folder',
            'cover_title' => 'Property Records',
        ]);
        config([
            'services.groq.models' => ['groq-test'],
        ]);

        $this->actingAs($user)->getJson(route('documents.upload-options'))
            ->assertOk()
            ->assertJsonPath('archive.0.drawers.0.books.0.id', (string) $book->id)
            ->assertJsonPath('archive.0.drawers.0.books.0.label', 'Property files')
            ->assertJsonPath('archive.0.drawers.0.books.0.kind', 'folder')
            ->assertJsonPath('archive.0.drawers.0.books.0.coverTitle', 'Property Records')
            ->assertJsonPath('recentArchiveItemIds', [])
            ->assertJsonPath('mappingModels', ['groq-test'])
            ->assertJsonPath('documentTypes.0.slug', 'tax-declaration')
            ->assertJsonPath('documentTypes.0.usesTaxFields', true)
            ->assertJsonPath('fieldSections.0.id', 'document')
            ->assertJsonPath('fieldSections.0.fields.0.name', 'correspondent')
            ->assertJsonPath('fieldSections.1.id', 'declaration')
            ->assertJsonPath('metadataFieldSections.0.id', 'document')
            ->assertJsonPath('metadataFieldSections.0.fields.0.name', 'title')
            ->assertJsonPath('metadataFieldSections.0.fields.1.name', 'correspondent')
            ->assertJsonPath('metadataFieldSections.0.fields.2.name', 'letter_date')
            ->assertJsonPath('metadataFieldSections.0.fields.2.type', 'date')
            ->assertJsonPath('metadataFieldSections.1.id', 'remarks')
            ->assertJsonMissingPath('documents')
            ->assertJsonMissingPath('component');
    }

    public function test_guests_cannot_load_private_upload_options(): void
    {
        $this->getJson(route('documents.upload-options'))->assertUnauthorized();
    }

    public function test_recent_archive_locations_are_the_last_two_distinct_locations_used_by_the_user(): void
    {
        $user = User::factory()->create();
        $first = Book::factory()->create();
        $second = Book::factory()->create();
        $third = Book::factory()->create(['kind' => 'folder']);
        $this->archiveDocument($user, $first);
        $this->archiveDocument($user, $second);
        $this->archiveDocument($user, $third);
        $this->archiveDocument($user, $second);
        $this->archiveDocument($user, $second);
        $this->archiveDocument(User::factory()->create(), $first);

        $expected = [(string) $second->id, (string) $third->id];
        $this->actingAs($user)->getJson(route('documents.upload-options'))
            ->assertOk()->assertJsonPath('recentArchiveItemIds', $expected);
        $this->get($this->taxDocumentsIndex())->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('recentArchiveItemIds', $expected));
    }

    public function test_recent_archive_locations_follow_the_active_office_and_skip_unavailable_or_routed_locations(): void
    {
        $user = User::factory()->create();
        $office = Office::query()->where('is_receiving', true)->sole();
        $other = Office::factory()->create();
        $available = Book::factory()->create();
        $otherBook = Book::factory()->create();
        $otherBook->drawer->cabinet->update(['office_id' => $other->id]);
        $deleted = Book::factory()->create();
        $moved = Book::factory()->create();
        $routed = Book::factory()->create();
        $this->archiveDocument($user, $available);
        $this->archiveDocument($user, $otherBook);
        $this->archiveDocument($user, $deleted);
        $this->archiveDocument($user, $moved);
        $routeDocument = $this->archiveDocument($user, $routed);
        $routeDocument->update(['filing_path' => Document::FILING_ROUTE]);
        $deleted->delete();
        $moved->drawer->cabinet->update(['office_id' => $other->id]);

        $this->actingAs($user)->withSession(['current_office_id' => $office->id])
            ->getJson(route('documents.upload-options'))->assertOk()
            ->assertJsonPath('recentArchiveItemIds', [(string) $available->id]);
        $this->withSession(['current_office_id' => $other->id])
            ->getJson(route('documents.upload-options'))->assertOk()
            ->assertJsonPath('recentArchiveItemIds', [(string) $otherBook->id]);
    }

    public function test_unverified_users_cannot_load_private_upload_options(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->getJson(route('documents.upload-options'))->assertForbidden();
    }

    private function archiveDocument(User $user, Book $book): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'archive.pdf',
            'storage_path' => 'documents/archive.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            'office_id' => $book->drawer->cabinet->office_id,
            'book_id' => $book->id,
            'filing_path' => Document::FILING_ARCHIVE,
        ]);
    }
}
