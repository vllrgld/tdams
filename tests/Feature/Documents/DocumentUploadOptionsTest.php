<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        config(['services.ollama.models' => ['test-model']]);

        $this->actingAs($user)->getJson(route('documents.upload-options'))
            ->assertOk()
            ->assertJsonPath('archive.0.drawers.0.books.0.id', (string) $book->id)
            ->assertJsonPath('archive.0.drawers.0.books.0.label', 'Property files')
            ->assertJsonPath('archive.0.drawers.0.books.0.kind', 'folder')
            ->assertJsonPath('archive.0.drawers.0.books.0.coverTitle', 'Property Records')
            ->assertJsonPath('mappingModels', ['test-model'])
            ->assertJsonPath('fieldSections.0.id', 'declaration')
            ->assertJsonMissingPath('documents')
            ->assertJsonMissingPath('component');
    }

    public function test_guests_cannot_load_private_upload_options(): void
    {
        $this->getJson(route('documents.upload-options'))->assertUnauthorized();
    }

    public function test_unverified_users_cannot_load_private_upload_options(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->getJson(route('documents.upload-options'))->assertForbidden();
    }
}
