<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentFieldMappingTest extends TestCase
{
    use RefreshDatabase;

    public function test_map_returns_structured_fields_from_ollama(): void
    {
        Http::fake([
            'https://ollama.test/api/chat' => Http::response([
                'message' => [
                    'content' => json_encode([
                        'tax_declaration_number' => 'TD-9',
                        'registered_owner' => 'Mapped Owner',
                        'declaration_date' => 'not-a-date',
                    ]),
                ],
            ]),
        ]);

        $user = User::factory()->create();
        $document = $this->document($user, [
            'ocr_status' => 'completed',
            'ocr_text' => 'Tax declaration TD-9 for Mapped Owner',
        ]);

        $response = $this->actingAs($user)->postJson(route('documents.map', $document), [
            'model' => 'gpt-oss:20b',
        ]);

        $response->assertOk()
            ->assertJsonPath('fields.tax_declaration_number', 'TD-9')
            ->assertJsonPath('fields.registered_owner', 'Mapped Owner')
            ->assertJsonPath('fields.declaration_date', null)
            ->assertJsonPath('fields.lot_number', null);

        Http::assertSent(function ($request): bool {
            return $request->url() === 'https://ollama.test/api/chat'
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && $request['model'] === 'gpt-oss:20b';
        });

        $document->refresh();
        $this->assertNull($document->tax_declaration_number);
    }

    public function test_map_rejects_an_unknown_model(): void
    {
        Http::fake();
        $user = User::factory()->create();
        $document = $this->document($user, [
            'ocr_status' => 'completed',
            'ocr_text' => 'Tax declaration text',
        ]);

        $this->actingAs($user)
            ->postJson(route('documents.map', $document), [
                'model' => 'missing-model',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('model');

        Http::assertNothingSent();
    }

    public function test_save_writes_only_the_checked_fields(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'registered_owner' => 'Existing Owner',
            'lot_number' => 'LOT-1',
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'tax_declaration_number' => 'TD-9',
            ])
            ->assertOk()
            ->assertJsonPath('document.taxDeclarationNumber', 'TD-9')
            ->assertJsonPath('document.registeredOwner', 'Existing Owner');

        $document->refresh();
        $this->assertSame('TD-9', $document->tax_declaration_number);
        $this->assertSame('Existing Owner', $document->registered_owner);
        $this->assertSame('LOT-1', $document->lot_number);
    }

    public function test_documents_page_lists_the_mapping_models(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('mappingModels', 7)
                ->where('mappingModels.3', 'gpt-oss:20b'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function document(User $user, array $overrides = []): Document
    {
        return Document::query()->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            ...$overrides,
        ]);
    }
}
