<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentLinkingTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_matching_declaration_numbers_and_omits_null_numbers(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
            'registered_owner' => 'Sample Owner',
            'lot_number' => 'LOT-0182',
            'municipality' => 'Laoag City',
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2020-00123',
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => null,
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.declaration-numbers', ['q' => 'td-2026']))
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.taxDeclarationNumber', 'TD-2026-00481')
            ->assertJsonPath('0.registeredOwner', 'Sample Owner')
            ->assertJsonPath('0.lotNumber', 'LOT-0182')
            ->assertJsonPath('0.municipality', 'Laoag City');
    }

    public function test_search_excludes_the_specified_document(): void
    {
        $user = User::factory()->create();
        $current = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00999',
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.declaration-numbers', [
                'q' => 'TD-2026',
                'exclude' => $current->id,
            ]))
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.taxDeclarationNumber', 'TD-2026-00999');
    }

    public function test_guests_cannot_search_declaration_numbers(): void
    {
        $this->getJson(route('documents.declaration-numbers', ['q' => 'TD']))
            ->assertUnauthorized();
    }

    public function test_guests_cannot_patch_a_previous_declaration_number(): void
    {
        $user = User::factory()->create();
        $document = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
        ]);

        $this->patchJson(route('documents.update', $document), [
            'previous_tax_declaration_number' => 'TD-2020-00123',
        ])->assertUnauthorized();
    }

    public function test_authenticated_user_can_set_previous_declaration_number_after_upload(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
            'tax_declaration_number' => 'TD-2026-00481',
        ]);

        $document = Document::query()->sole();

        $this->actingAs($user)
            ->patch(route('documents.update', $document), [
                'previous_tax_declaration_number' => 'TD-2020-00123',
                'previous_declaration_date' => '2020-06-01',
            ])
            ->assertRedirect(route('documents.index'));

        $document = $document->fresh();

        $this->assertSame('TD-2020-00123', $document->previous_tax_declaration_number);
        $this->assertSame('2020-06-01', $document->previous_declaration_date?->toDateString());
    }

    public function test_patch_rejects_linking_a_document_to_its_own_tax_declaration_number(): void
    {
        $user = User::factory()->create();
        $document = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
        ]);

        $this->actingAs($user)
            ->from(route('documents.index'))
            ->patch(route('documents.update', $document), [
                'previous_tax_declaration_number' => 'TD-2026-00481',
            ])
            ->assertRedirect(route('documents.index'))
            ->assertSessionHasErrors('previous_tax_declaration_number');

        $this->assertNull($document->fresh()->previous_tax_declaration_number);
    }

    public function test_store_rejects_linking_a_document_to_its_own_tax_declaration_number(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('documents.index'))
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
                'tax_declaration_number' => 'TD-2026-00481',
                'previous_tax_declaration_number' => 'TD-2026-00481',
            ])
            ->assertRedirect(route('documents.index'))
            ->assertSessionHasErrors('previous_tax_declaration_number');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_history_includes_the_resolved_previous_document_when_one_exists(): void
    {
        $user = User::factory()->create();
        $previous = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2020-00123',
            'declaration_date' => '2020-06-01',
            'registered_owner' => 'Former Owner',
            'previous_tax_declaration_number' => 'TD-2016-00001',
            'previous_declaration_date' => '2016-02-10',
        ]);
        $current = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
            'declaration_date' => '2026-03-15',
            'previous_tax_declaration_number' => 'TD-2020-00123',
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.history', $current))
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.taxDeclarationNumber', 'TD-2020-00123')
            ->assertJsonPath('0.document.id', $previous->id)
            ->assertJsonPath('0.document.registeredOwner', 'Former Owner')
            ->assertJsonPath('0.document.declarationDate', '2020-06-01')
            ->assertJsonPath('0.declarationDate', '2020-06-01')
            ->assertJsonPath('1.taxDeclarationNumber', 'TD-2016-00001')
            ->assertJsonPath('1.document', null)
            ->assertJsonPath('1.declarationDate', '2016-02-10');
    }

    public function test_history_is_empty_when_no_previous_declaration_number_is_set(): void
    {
        $user = User::factory()->create();
        $document = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.history', $document))
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_chain_from_the_third_document_includes_later_declarations(): void
    {
        $user = User::factory()->create();
        [$first, $second, $third, $fourth] = $this->makeLinearChain($user);

        $this->actingAs($user)
            ->getJson(route('documents.chain', $third))
            ->assertOk()
            ->assertJsonPath('originId', $third->id)
            ->assertJsonCount(4, 'entries')
            ->assertJsonPath('entries.0.document.id', $first->id)
            ->assertJsonPath('entries.1.document.id', $second->id)
            ->assertJsonPath('entries.2.document.id', $third->id)
            ->assertJsonPath('entries.3.document.id', $fourth->id)
            ->assertJsonPath('entries.3.taxDeclarationNumber', 'TD-2026-00481');
    }

    public function test_chain_from_the_newest_document_includes_the_full_lineage(): void
    {
        $user = User::factory()->create();
        [$first, $second, $third, $fourth] = $this->makeLinearChain($user);

        $this->actingAs($user)
            ->getJson(route('documents.chain', $fourth))
            ->assertOk()
            ->assertJsonPath('originId', $fourth->id)
            ->assertJsonCount(4, 'entries')
            ->assertJsonPath('entries.0.document.id', $first->id)
            ->assertJsonPath('entries.1.document.id', $second->id)
            ->assertJsonPath('entries.2.document.id', $third->id)
            ->assertJsonPath('entries.3.document.id', $fourth->id);
    }

    public function test_history_from_the_third_document_still_returns_only_previous_entries(): void
    {
        $user = User::factory()->create();
        [$first, $second, $third] = $this->makeLinearChain($user);

        $this->actingAs($user)
            ->getJson(route('documents.history', $third))
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.document.id', $second->id)
            ->assertJsonPath('1.document.id', $first->id);
    }

    public function test_chain_for_an_unlinked_document_contains_only_itself(): void
    {
        $user = User::factory()->create();
        $document = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
            'declaration_date' => '2026-03-15',
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.chain', $document))
            ->assertOk()
            ->assertJsonPath('originId', $document->id)
            ->assertJsonCount(1, 'entries')
            ->assertJsonPath('entries.0.document.id', $document->id)
            ->assertJsonPath('entries.0.taxDeclarationNumber', 'TD-2026-00481');
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makeDocument(User $user, array $attributes = []): Document
    {
        static $count = 0;
        $count++;

        return Document::query()->create([
            'original_filename' => "scan-{$count}.pdf",
            'storage_path' => "documents/scan-{$count}.pdf",
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            ...$attributes,
        ]);
    }

    /**
     * @return array{0: Document, 1: Document, 2: Document, 3: Document}
     */
    private function makeLinearChain(User $user): array
    {
        $first = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2016-00001',
            'declaration_date' => '2016-02-10',
        ]);
        $second = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2020-00123',
            'declaration_date' => '2020-06-01',
            'previous_tax_declaration_number' => 'TD-2016-00001',
            'previous_declaration_date' => '2016-02-10',
        ]);
        $third = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2023-00300',
            'declaration_date' => '2023-09-12',
            'previous_tax_declaration_number' => 'TD-2020-00123',
            'previous_declaration_date' => '2020-06-01',
        ]);
        $fourth = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
            'declaration_date' => '2026-03-15',
            'previous_tax_declaration_number' => 'TD-2023-00300',
            'previous_declaration_date' => '2023-09-12',
        ]);

        return [$first, $second, $third, $fourth];
    }
}
