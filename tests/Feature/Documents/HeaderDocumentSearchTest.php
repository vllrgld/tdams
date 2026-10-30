<?php

namespace Tests\Feature\Documents;

use App\Models\Cabinet;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HeaderDocumentSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_requires_authentication(): void
    {
        $this->getJson(route('documents.search', ['q' => 'TD']))->assertUnauthorized();
    }

    public function test_short_and_blank_queries_do_not_list_documents(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user);

        foreach (['', ' ', 'T'] as $query) {
            $this->actingAs($user)->getJson(route('documents.search', ['q' => $query]))
                ->assertExactJson(['data' => [], 'hasMore' => false]);
        }
    }

    public function test_results_use_existing_search_rules_and_include_filing_location(): void
    {
        $user = User::factory()->create();
        $cabinet = Cabinet::factory()->withDrawers(1)->create(['name' => 'Search cabinet']);
        $drawer = $cabinet->drawers()->firstOrFail();
        $book = $drawer->books()->create(['label' => 'Search book', 'position' => 1]);
        $document = $this->makeDocument($user, ['book_id' => $book->id]);
        $this->makeDocument($user, ['tax_declaration_number' => 'OTHER', 'registered_owner' => 'Different owner', 'municipality' => 'Elsewhere']);

        foreach (['TD-HEADER', 'Header Owner', 'Search municipality'] as $query) {
            $this->actingAs($user)->getJson(route('documents.search', ['q' => $query]))
                ->assertOk()->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.id', $document->id)
                ->assertJsonPath('data.0.title', 'TD-HEADER')
                ->assertJsonPath('data.0.owner', 'Header Owner')
                ->assertJsonPath('data.0.location.cabinet', $cabinet->name)
                ->assertJsonPath('data.0.location.drawer', $drawer->label)
                ->assertJsonPath('data.0.location.book', $book->label)
                ->assertJsonPath('data.0.url', '/documents?document='.$document->id)
                ->assertJsonPath('data.0.location.url', '/archive?cabinet='.$cabinet->id.'&drawer='.$drawer->id.'&book='.$book->id)
                ->assertJsonMissingPath('data.0.ocr_text')
                ->assertJsonMissingPath('data.0.storage_path');
        }
    }

    public function test_results_are_limited_and_unfiled_documents_are_supported(): void
    {
        $user = User::factory()->create();
        for ($index = 0; $index < 10; $index++) {
            $latest = $this->makeDocument($user);
        }

        $this->actingAs($user)->getJson(route('documents.search', ['q' => 'TD-HEADER']))
            ->assertOk()->assertJsonCount(8, 'data')
            ->assertJsonPath('hasMore', true)
            ->assertJsonPath('data.0.id', $latest->id)
            ->assertJsonPath('data.0.location', null);

        $this->actingAs($user)->getJson(route('documents.search', ['q' => 'No matching declaration']))
            ->assertExactJson(['data' => [], 'hasMore' => false]);
    }

    public function test_invalid_queries_are_rejected(): void
    {
        $user = User::factory()->create();
        foreach ([str_repeat('x', 201), ['invalid']] as $query) {
            $this->actingAs($user)->getJson(route('documents.search', ['q' => $query]))
                ->assertUnprocessable()->assertJsonValidationErrors('q');
        }
    }

    public function test_a_search_result_can_open_the_requested_document_outside_the_first_page(): void
    {
        $user = User::factory()->create();
        $document = $this->makeDocument($user);
        for ($index = 0; $index < 21; $index++) {
            $this->makeDocument($user);
        }

        $this->actingAs($user)->get(route('documents.index', ['document' => $document->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('documents/index')
            ->where('selectedDocument.id', $document->id)
            ->where('selectedDocument.taxDeclarationNumber', 'TD-HEADER'));

        $this->actingAs($user)->get(route('documents.index', ['document' => 999999]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('selectedDocument', null));
    }

    private function makeDocument(User $user, array $attributes = []): Document
    {
        return Document::query()->create([
            'original_filename' => 'header-search.pdf',
            'storage_path' => 'documents/header-search.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            'tax_declaration_number' => 'TD-HEADER',
            'registered_owner' => 'Header Owner',
            'municipality' => 'Search municipality',
            ...$attributes,
        ]);
    }
}
