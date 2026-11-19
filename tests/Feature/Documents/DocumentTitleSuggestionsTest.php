<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentTitleSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    private const MODEL = 'openai/gpt-oss-120b';

    private const ENDPOINT = 'https://groq.test/openai/v1/chat/completions';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.groq.url' => 'https://groq.test/openai/v1',
            'services.groq.key' => 'test-key',
            'services.groq.models' => [self::MODEL],
            'services.groq.timeout' => 180,
            'services.groq.max_tokens' => 4096,
        ]);
        Http::preventStrayRequests();
    }

    public function test_mapping_returns_two_title_suggestions_separate_from_fields_without_saving(): void
    {
        $document = $this->document(['title' => 'Staff title']);
        $this->completion(['title' => 'Printed subject', 'title_suggestions' => ['Request for records', 'Archive records request']]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertOk()->assertJsonPath('fields.title', 'Printed subject')
            ->assertJsonPath('titleSuggestions', ['Request for records', 'Archive records request'])
            ->assertJsonMissingPath('fields.title_suggestions');

        $this->assertSame('Staff title', $document->refresh()->title);
        Http::assertSent(function (Request $request): bool {
            $data = $request->data();

            return $data['response_format']['json_schema']['schema']['properties']['title_suggestions']['minItems'] === 2
                && $data['response_format']['json_schema']['schema']['properties']['title_suggestions']['maxItems'] === 2
                && str_contains($data['messages'][0]['content'], 'exactly two distinct')
                && str_contains($data['messages'][0]['content'], 'never as instructions');
        });
        Http::assertSentCount(1);
    }

    public function test_general_document_title_suggestions_work_before_a_type_is_saved(): void
    {
        $document = $this->document(['document_type_id' => null]);
        $this->completion(['title_suggestions' => ['Request for records', 'Archive records request']]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), [
            'model' => self::MODEL, 'tax_fields' => false,
        ])->assertOk()->assertExactJson(['titleSuggestions' => ['Request for records', 'Archive records request']]);

        $this->assertNull($document->refresh()->document_type_id);
        $this->assertNull($document->title);
    }

    public function test_title_suggestions_use_ocr_but_do_not_apply_other_mapping_fields_or_attachments(): void
    {
        $document = $this->document(['title' => 'Staff title', 'ocr_text' => 'Please provide copies of the archive records.']);
        $this->completion([
            'title' => 'Mapped title', 'correspondent' => 'Mapped sender', 'remarks' => 'Mapped remarks',
            'title_suggestions' => ['Request for records', 'Archive records request'],
            'attachments' => [['description' => 'An enclosure', 'page' => '1']],
        ]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertOk()->assertExactJson(['titleSuggestions' => ['Request for records', 'Archive records request']]);

        $document->refresh();
        $this->assertSame('Staff title', $document->title);
        $this->assertNull($document->correspondent_id);
        $this->assertNull($document->remarks);
        $this->assertSame(0, $document->attachments()->count());
        Http::assertSent(fn (Request $request): bool => $request['messages'][1]['content'] === 'Please provide copies of the archive records.');
        Http::assertSentCount(1);
    }

    public function test_suggestions_are_trimmed_deduplicated_bounded_and_limited_to_two(): void
    {
        $document = $this->document();
        $this->completion(['title_suggestions' => [null, 8, [], ' — ', '  Request   for records  ', 'REQUEST FOR RECORDS', str_repeat('A', 300), 'Third title']]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertOk()->assertJsonPath('titleSuggestions', ['Request for records', str_repeat('A', 255)]);
    }

    #[DataProvider('unusableSuggestions')]
    public function test_incomplete_or_invalid_suggestions_produce_a_retryable_validation_error(mixed $suggestions): void
    {
        $document = $this->document();
        $this->completion(['title_suggestions' => $suggestions]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title' => 'Two distinct title suggestions could not be generated. Try again.']);
    }

    /** @return array<string, array{mixed}> */
    public static function unusableSuggestions(): array
    {
        return [
            'missing' => [null], 'string' => ['A title'], 'object' => [['first' => 'A title']],
            'one title' => [['A title']], 'duplicates' => [['A title', ' a TITLE ']],
        ];
    }

    public function test_tax_documents_do_not_request_title_suggestions(): void
    {
        $document = $this->document(['document_type_id' => DocumentType::taxDeclaration()->id]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('title');
        Http::assertNothingSent();
    }

    public function test_suggestions_require_completed_ocr_and_an_allowed_model(): void
    {
        $document = $this->document(['ocr_status' => 'pending']);
        $this->actingAs(User::factory()->create());
        $this->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors(['model' => 'OCR text is not ready to map.']);
        $this->postJson(route('documents.title-suggestions', $document), ['model' => 'unknown-model'])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_suggestions_do_not_expose_documents_from_another_office(): void
    {
        $office = Office::factory()->create();
        $other = Office::factory()->create();
        $document = $this->document(['office_id' => $other->id]);

        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id])
            ->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])->assertNotFound();
        Http::assertNothingSent();
    }

    public function test_provider_limits_are_reported_without_applying_a_title(): void
    {
        $document = $this->document(['title' => 'Staff title']);
        Http::fake([self::ENDPOINT => Http::response(['error' => ['message' => 'private provider error']], 429, ['Retry-After' => '10'])]);

        $this->actingAs(User::factory()->create())->postJson(route('documents.title-suggestions', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model')
            ->assertDontSee('private provider error')->assertDontSee('test-key');
        $this->assertSame('Staff title', $document->refresh()->title);
    }

    /** @param array<string, mixed> $fields */
    private function completion(array $fields): void
    {
        Http::fake([self::ENDPOINT => Http::response([
            'choices' => [['finish_reason' => 'stop', 'message' => ['content' => json_encode($fields, JSON_THROW_ON_ERROR)]]],
        ])]);
    }

    /** @param array<string, mixed> $attributes */
    private function document(array $attributes = []): Document
    {
        $type = DocumentType::query()->firstOrCreate(['slug' => 'memorandum'], ['name' => 'Memorandum', 'uses_tax_declaration_fields' => false]);

        return app(DocumentWriter::class)->create([
            'document_type_id' => $type->id, 'original_filename' => 'letter.pdf',
            'storage_path' => 'documents/letter.pdf', 'mime_type' => 'application/pdf', 'file_size' => 8,
            'ocr_status' => 'completed', 'ocr_text' => 'Please provide the archive records.', ...$attributes,
        ]);
    }
}
