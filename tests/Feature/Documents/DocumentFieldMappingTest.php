<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\Owner;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
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

    public function test_mapping_preserves_the_request_contract_with_focused_remarks_guidance(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://ollama.test/api/chat' => Http::response([
                'message' => ['content' => json_encode([
                    'tax_declaration_number' => 'TD-TEST-42',
                    'registered_owner' => 'Test Owner',
                    'declaration_date' => '2026-11-05',
                    'boundary_north' => 'Road',
                ])],
            ]),
        ]);
        $expected = json_decode(file_get_contents(base_path('tests/Fixtures/Ollama/document-mapping-request.json')), true, flags: JSON_THROW_ON_ERROR);
        $user = User::factory()->create();
        $document = $this->document($user, [
            'ocr_status' => 'completed',
            'ocr_text' => $expected['messages'][1]['content'],
        ]);

        $this->actingAs($user)->postJson(route('documents.map', $document), [
            'model' => $expected['model'],
        ])->assertOk()
            ->assertJsonPath('fields.tax_declaration_number', 'TD-TEST-42')
            ->assertJsonPath('fields.registered_owner', 'Test Owner')
            ->assertJsonPath('fields.declaration_date', '2026-11-05')
            ->assertJsonPath('fields.boundary_north', 'Road');

        Http::assertSent(fn ($request): bool => $request->url() === 'https://ollama.test/api/chat' && $request->data() === $expected);
        $this->assertNull($document->refresh()->tax_declaration_number);
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

    #[DataProvider('remarksResponses')]
    public function test_mapping_discards_only_blank_cancellation_templates(string $remarks, ?string $expected): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://ollama.test/api/chat' => Http::response([
                'message' => ['content' => json_encode(['remarks' => $remarks])],
            ]),
        ]);
        $user = User::factory()->create();
        $document = $this->document($user, ['ocr_status' => 'completed', 'ocr_text' => $remarks]);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => 'gpt-oss:20b'])
            ->assertOk()->assertJsonPath('fields.remarks', $expected);

        Http::assertSentCount(1);
    }

    /** @return array<string, array{string, string|null}> */
    public static function remarksResponses(): array
    {
        $blank = 'This declaration cancels TD No. ____ PIN ____ Previous A.V Php ____ Previous Owner: ____.';
        $populated = 'This declaration cancels TD No. TD-2020-123 PIN 012-345 Previous A.V Php 12000 Previous Owner: Test Owner.';
        $annotation = 'Subject to a 3-meter road right-of-way along the eastern boundary.';
        $printedNote = 'Notes: This declaration is for real property taxation purposes only and the valuation indicated herein is based on the schedule of unit market values under Ordinance No. 2011-11-168 and SP Resolution No. 2012-11-54 dated December 14, 2011 and January 25, 2012, respectively except for building machinery and other.';

        return [
            'empty printed template' => [$blank, null],
            'filled cancellation details' => [$populated, $populated],
            'property-specific remark' => [$annotation, $annotation],
            'printed taxation note with citations' => [$printedNote, $printedNote],
            'printed note and property annotation' => [$printedNote.' '.$annotation, $printedNote.' '.$annotation],
            'template and genuine annotation' => [$blank.' '.$annotation, $blank.' '.$annotation],
        ];
    }

    public function test_failed_field_save_rolls_back_declaration_property_and_owner_changes(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'tax_declaration_number' => 'TD-ORIGINAL',
            'lot_number' => 'LOT-ORIGINAL',
            'registered_owner' => 'Original Owner',
        ]);
        Exceptions::fake();
        Event::listen('eloquent.saving: '.Owner::class, function (): void {
            throw new RuntimeException('Owner could not be saved.');
        });

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'tax_declaration_number' => 'TD-CHANGED',
            'lot_number' => 'LOT-CHANGED',
            'registered_owner' => 'Changed Owner',
        ])->assertInternalServerError();

        $this->assertDatabaseHas('tax_declarations', ['id' => $document->tax_declaration_id, 'tax_declaration_number' => 'TD-ORIGINAL']);
        $this->assertDatabaseHas('properties', ['lot_number' => 'LOT-ORIGINAL']);
        $this->assertDatabaseHas('owners', ['name' => 'Original Owner']);
        $this->assertDatabaseMissing('tax_declarations', ['tax_declaration_number' => 'TD-CHANGED']);
        $this->assertDatabaseMissing('properties', ['lot_number' => 'LOT-CHANGED']);
        $this->assertDatabaseMissing('owners', ['name' => 'Changed Owner']);
        Exceptions::assertReported(RuntimeException::class);
    }

    public function test_field_save_rejects_a_payload_without_document_fields(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'ocr_status' => 'completed',
        ])->assertUnprocessable()->assertJsonValidationErrors('fields');

        $this->assertSame('pending', $document->refresh()->ocr_status);
        $this->assertDatabaseCount('tax_declarations', 0);
    }

    public function test_field_save_can_clear_a_supplied_field_without_clearing_other_fields(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['lot_number' => 'LOT-1', 'registered_owner' => 'Existing Owner']);

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'lot_number' => null,
        ])->assertOk()->assertJsonPath('document.lotNumber', null)->assertJsonPath('document.registeredOwner', 'Existing Owner');

        $this->assertDatabaseHas('properties', ['lot_number' => null]);
        $this->assertDatabaseHas('owners', ['name' => 'Existing Owner']);
    }

    public function test_field_save_rejects_self_linking_against_the_existing_number(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['tax_declaration_number' => 'TD-1']);

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'previous_tax_declaration_number' => 'td-1',
        ])->assertUnprocessable()->assertJsonValidationErrors('previous_tax_declaration_number');

        $this->assertNull($document->refresh()->previous_tax_declaration_number);
    }

    public function test_partial_owner_update_preserves_unsupplied_details_when_owner_is_shared(): void
    {
        $user = User::factory()->create();
        $first = $this->document($user, [
            'tax_declaration_number' => 'TD-A',
            'registered_owner' => 'Original Owner',
            'owner_address_street' => 'Old Street',
            'owner_address_barangay' => 'Original Barangay',
        ]);
        $second = $this->document($user, ['tax_declaration_number' => 'TD-B']);
        $owner = $first->taxDeclaration->owners->sole();
        $second->taxDeclaration->owners()->attach($owner->id, ['position' => 0]);

        $this->actingAs($user)->putJson(route('documents.fields', $first), [
            'owner_address_street' => 'Corrected Street',
        ])->assertOk()
            ->assertJsonPath('document.registeredOwner', 'Original Owner')
            ->assertJsonPath('document.ownerAddressStreet', 'Corrected Street')
            ->assertJsonPath('document.ownerAddressBarangay', 'Original Barangay');

        $this->assertSame('Old Street', $second->refresh()->owner_address_street);
        $this->assertDatabaseHas('owners', ['id' => $owner->id, 'name' => 'Original Owner', 'street' => 'Old Street']);
        $this->assertNotSame($owner->id, $first->refresh()->taxDeclaration->owners->sole()->id);
    }

    public function test_clearing_a_shared_owner_field_preserves_the_other_details(): void
    {
        $user = User::factory()->create();
        $first = $this->document($user, ['tax_declaration_number' => 'TD-A', 'registered_owner' => 'Original Owner', 'owner_address_street' => 'Old Street']);
        $second = $this->document($user, ['tax_declaration_number' => 'TD-B']);
        $owner = $first->taxDeclaration->owners->sole();
        $second->taxDeclaration->owners()->attach($owner->id, ['position' => 0]);

        $this->actingAs($user)->putJson(route('documents.fields', $first), [
            'owner_address_street' => null,
        ])->assertOk()->assertJsonPath('document.registeredOwner', 'Original Owner')->assertJsonPath('document.ownerAddressStreet', null);

        $this->assertSame('Original Owner', $first->refresh()->registered_owner);
        $this->assertNull($first->owner_address_street);
        $this->assertSame('Old Street', $second->refresh()->owner_address_street);
    }

    public function test_field_save_rejects_a_cycle_through_an_existing_declaration(): void
    {
        $user = User::factory()->create();
        $first = $this->document($user, ['tax_declaration_number' => 'TD-A']);
        $second = $this->document($user, ['tax_declaration_number' => 'TD-B', 'previous_tax_declaration_number' => 'TD-A']);

        $this->actingAs($user)->putJson(route('documents.fields', $first), [
            'previous_tax_declaration_number' => 'TD-B',
        ])->assertUnprocessable()->assertJsonValidationErrors('previous_tax_declaration_number');

        $this->assertNull($first->refresh()->taxDeclaration->previous_declaration_id);
        $this->assertSame($first->tax_declaration_id, $second->refresh()->taxDeclaration->previous_declaration_id);
    }

    public function test_resolving_an_unmatched_previous_number_cannot_create_a_cycle(): void
    {
        $user = User::factory()->create();
        $first = $this->document($user, ['tax_declaration_number' => 'TD-A', 'previous_tax_declaration_number' => 'TD-B']);
        $second = $this->document($user, ['previous_tax_declaration_number' => 'TD-A']);

        $this->actingAs($user)->putJson(route('documents.fields', $second), [
            'tax_declaration_number' => 'TD-B',
        ])->assertUnprocessable()->assertJsonValidationErrors('previous_tax_declaration_number');

        $this->assertNull($first->refresh()->taxDeclaration->previous_declaration_id);
        $this->assertNull($second->refresh()->tax_declaration_number);
    }

    public function test_documents_page_lists_the_mapping_models(): void
    {
        config([
            'services.groq.models' => ['openai/gpt-oss-120b'],
            'services.bedrock.models' => ['global.amazon.nova-2-lite-v1:0'],
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('mappingModels', 9)
                ->where('mappingModels.3', 'gpt-oss:20b')
                ->where('mappingModels.7', 'openai/gpt-oss-120b')
                ->where('mappingModels.8', 'global.amazon.nova-2-lite-v1:0'));
    }

    public function test_review_schema_exposes_field_limits_and_stable_section_identifiers(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('fieldSections', 5)
                ->where('fieldSections.0.id', 'declaration')
                ->where('fieldSections.0.fields.0.name', 'tax_declaration_number')
                ->where('fieldSections.0.fields.0.maxLength', 100)
                ->where('fieldSections.0.fields.1.type', 'date')
                ->where('fieldSections.1.id', 'property')
                ->where('fieldSections.2.id', 'owner')
                ->where('fieldSections.3.id', 'boundaries')
                ->where('fieldSections.4.id', 'remarks')
                ->where('fieldSections.4.fields.0.maxLength', 10000));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function document(User $user, array $overrides = []): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            ...$overrides,
        ]);
    }
}
