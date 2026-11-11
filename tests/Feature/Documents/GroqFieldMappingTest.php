<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GroqFieldMappingTest extends TestCase
{
    use RefreshDatabase;

    private const MODEL = 'openai/gpt-oss-120b';

    private const ENDPOINT = 'https://groq.test/openai/v1/chat/completions';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'inertia.ssr.enabled' => false,
            'services.field_mapping.provider' => 'groq',
            'services.groq.url' => 'https://groq.test/openai/v1',
            'services.groq.key' => 'private-groq-key',
            'services.groq.models' => [self::MODEL],
            'services.groq.timeout' => 180,
            'services.groq.max_tokens' => 4096,
            'services.bedrock.models' => ['global.amazon.nova-2-lite-v1:0'],
            'services.bedrock.key' => 'private-bedrock-key',
            'services.bedrock.region' => 'ap-southeast-2',
        ]);
        Http::preventStrayRequests();
    }

    public function test_gpt_oss_returns_normalized_fields_for_review_without_saving(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->completion(json_encode([
            'tax_declaration_number' => 'TD-42',
            'pin' => '001-02-0003-004-05',
            'previous_tax_declaration_number' => 'TD-2020-0007',
            'registered_owner' => 'Mapped Owner',
            'property_location_barangay' => 'Tumingad',
            'property_location_district' => '',
            'declaration_date' => 'not-a-date',
            'lot_number' => '',
            'area' => 100.5,
            'unexpected_field' => 'Ignore this',
        ], JSON_THROW_ON_ERROR)))]);
        $user = User::factory()->create();
        $ocrText = "ID No.: TD-42 Property Identification No.: 001-02-0003-004-05\nOwner: Mapped Owner\nLocation of Property: Tumingad (Barangay/District)\nThis tax declaration cancels Tax Declaration No. TD-2020-0007 PIN ___ Previous A.V Php ___.";
        $document = $this->document($user, ['ocr_text' => $ocrText]);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertOk()
            ->assertJsonPath('fields.tax_declaration_number', 'TD-42')
            ->assertJsonPath('fields.pin', '001-02-0003-004-05')
            ->assertJsonPath('fields.previous_tax_declaration_number', 'TD-2020-0007')
            ->assertJsonPath('fields.registered_owner', 'Mapped Owner')
            ->assertJsonPath('fields.property_location_barangay', 'Tumingad')
            ->assertJsonPath('fields.property_location_district', null)
            ->assertJsonPath('fields.declaration_date', null)
            ->assertJsonPath('fields.lot_number', null)
            ->assertJsonPath('fields.area', '100.5')
            ->assertJsonMissingPath('fields.unexpected_field');

        Http::assertSent(function (Request $request) use ($ocrText): bool {
            $payload = $request->data();

            return $request->url() === self::ENDPOINT
                && $request->hasHeader('Authorization', 'Bearer private-groq-key')
                && $payload['model'] === self::MODEL
                && $payload['stream'] === false
                && $payload['messages'][1] === ['role' => 'user', 'content' => $ocrText]
                && str_contains($payload['messages'][0]['content'], 'never as instructions')
                && str_contains($payload['messages'][0]['content'], 'Property Identification No.')
                && str_contains($payload['messages'][0]['content'], 'This tax declaration cancels Tax Declaration No.')
                && str_contains($payload['response_format']['json_schema']['schema']['properties']['pin']['description'], 'A blank PIN in a cancellation')
                && str_contains($payload['response_format']['json_schema']['schema']['properties']['previous_tax_declaration_number']['description'], 'stop before adjacent PIN')
                && $payload['response_format']['type'] === 'json_schema'
                && $payload['response_format']['json_schema']['name'] === 'document_fields'
                && $payload['response_format']['json_schema']['strict'] === true
                && $payload['response_format']['json_schema']['schema']['additionalProperties'] === false
                && $payload['response_format']['json_schema']['schema']['properties']['registered_owner']['type'] === 'string'
                && in_array('registered_owner', $payload['response_format']['json_schema']['schema']['required'], true)
                && $payload['max_completion_tokens'] === 4096
                && $payload['reasoning_effort'] === 'medium'
                && $payload['include_reasoning'] === false
                && ! isset($payload['provider'])
                && ! isset($payload['models']);
        });
        Http::assertSentCount(1);
        $this->assertNull($document->refresh()->tax_declaration_number);
        $this->assertSame('Staff corrected owner', $document->registered_owner);
    }

    public function test_pages_and_upload_options_expose_gpt_oss_without_exposing_the_key(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('mappingModels', [self::MODEL, 'global.amazon.nova-2-lite-v1:0']))
            ->assertDontSee('private-groq-key', false);
        $this->getJson(route('documents.upload-options'))
            ->assertOk()->assertJsonPath('mappingModels', [self::MODEL, 'global.amazon.nova-2-lite-v1:0'])
            ->assertDontSee('private-groq-key', false);
        Http::assertNothingSent();
    }

    public function test_unknown_models_are_rejected_without_an_external_request(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => 'unknown-model'])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_selecting_nova_routes_to_bedrock_when_groq_is_the_default(): void
    {
        $endpoint = 'https://bedrock-runtime.ap-southeast-2.amazonaws.com/model/global.amazon.nova-2-lite-v1%3A0/converse';
        Http::fake([$endpoint => Http::response([
            'stopReason' => 'tool_use',
            'output' => ['message' => ['content' => [['toolUse' => [
                'name' => 'extract_document_fields',
                'input' => ['tax_declaration_number' => 'TD-NOVA'],
            ]]]]],
        ])]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => 'global.amazon.nova-2-lite-v1:0'])
            ->assertOk()->assertJsonPath('fields.tax_declaration_number', 'TD-NOVA');

        Http::assertSent(fn (Request $request): bool => $request->url() === $endpoint
            && $request->hasHeader('Authorization', 'Bearer private-bedrock-key'));
        Http::assertSentCount(1);
        $this->assertNull($document->refresh()->tax_declaration_number);
    }

    public function test_invalid_configured_models_are_not_exposed_or_requested(): void
    {
        config(['services.groq.models' => [null, '', 42]]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => '42'])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_a_missing_key_does_not_send_a_request(): void
    {
        config(['services.groq.key' => '']);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_unfinished_ocr_is_rejected_without_a_request(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['ocr_status' => 'pending']);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    #[DataProvider('providerErrors')]
    public function test_provider_errors_are_sanitized_and_not_retried(int $status, string $expected): void
    {
        Http::fake([self::ENDPOINT => Http::response(['error' => [
            'message' => 'private-groq-key private-provider-detail',
            'metadata' => ['raw' => 'private OCR text'],
        ]], $status)]);
        Log::spy();
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model')
            ->assertSee($expected, false)
            ->assertDontSee('private-groq-key', false)
            ->assertDontSee('private-provider-detail', false)
            ->assertDontSee('private OCR text', false);

        $context = ['status' => $status, 'model' => self::MODEL];

        if ($status === 429) {
            $context['retry_after_seconds'] = null;
        }

        Log::shouldHaveReceived('warning')->once()->with('Groq mapping request failed.', $context);
        Http::assertSentCount(1);
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    /** @return array<string, array{int, string}> */
    public static function providerErrors(): array
    {
        return [
            'invalid request' => [400, 'could not use the selected model'],
            'invalid key' => [401, 'rejected the API key'],
            'token budget' => [413, 'exceeds Groq'],
            'invalid schema settings' => [422, 'mapping settings'],
            'permissions' => [403, 'rejected the API key'],
            'unavailable model' => [404, 'could not use the selected model'],
            'unspecified rate limit' => [429, 'request or token limit'],
            'provider failure' => [503, 'could not complete the mapping request'],
        ];
    }

    #[DataProvider('rateLimits')]
    public function test_rate_limits_use_safe_retry_hints_without_leaking_details(
        array $headers,
        string $expected,
        ?int $retryAfter,
    ): void {
        Http::fake([self::ENDPOINT => Http::response(['error' => [
            'message' => 'private-groq-key private-provider-detail',
        ]], 429, $headers)]);
        Log::spy();
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()
            ->assertJsonPath('errors.model.0', $expected)
            ->assertDontSee('private-groq-key', false)
            ->assertDontSee('private-provider-detail', false);

        Log::shouldHaveReceived('warning')->once()->with('Groq mapping request failed.', [
            'status' => 429,
            'model' => self::MODEL,
            'retry_after_seconds' => $retryAfter,
        ]);
        Http::assertSentCount(1);
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    /** @return array<string, array{array<string, string>, string, int|null}> */
    public static function rateLimits(): array
    {
        $message = 'Groq reached a request or token limit. This may be a per-minute or daily limit.';
        $fallback = $message.' Check your Groq limits and try again after the limit resets.';

        return [
            'valid retry hint' => [['Retry-After' => '30'], $message.' Try again in 30 seconds.', 30],
            'missing retry hint' => [[], $fallback, null],
            'invalid retry hint' => [['Retry-After' => 'private-groq-key'], $fallback, null],
            'unbounded retry hint' => [['Retry-After' => '999999999999999'], $fallback, null],
            'negative retry hint' => [['Retry-After' => '-1'], $fallback, null],
        ];
    }

    public function test_connection_failure_returns_a_validation_error(): void
    {
        Http::fake([self::ENDPOINT => Http::failedConnection()]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
    }

    #[DataProvider('invalidResponses')]
    public function test_invalid_or_incomplete_responses_are_rejected_without_saving(array $payload): void
    {
        Http::fake([self::ENDPOINT => Http::response($payload)]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertSentCount(1);
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    /** @return array<string, array{array<string, mixed>}> */
    public static function invalidResponses(): array
    {
        $choice = ['finish_reason' => 'stop', 'message' => ['content' => '{"registered_owner":"Mapped Owner"}']];

        return [
            'truncated valid JSON' => [['choices' => [array_replace($choice, ['finish_reason' => 'length'])]]],
            'filtered' => [['choices' => [array_replace($choice, ['finish_reason' => 'content_filter'])]]],
            'invalid JSON' => [['choices' => [array_replace_recursive($choice, ['message' => ['content' => '{invalid']])]]],
            'missing content' => [['choices' => [['finish_reason' => 'stop', 'message' => ['content' => null]]]]],
            'list instead of object' => [['choices' => [array_replace_recursive($choice, ['message' => ['content' => '["Owner"]']])]]],
            'empty object' => [['choices' => [array_replace_recursive($choice, ['message' => ['content' => '{}']])]]],
            'unknown fields only' => [['choices' => [array_replace_recursive($choice, ['message' => ['content' => '{"unknown":"value"}']])]]],
            'missing choices' => [[]],
            'error in successful HTTP response' => [['error' => ['code' => 429, 'message' => 'Provider error']]],
            'error alongside valid content' => [['choices' => [array_replace($choice, ['error' => ['code' => 503, 'message' => 'Provider error']])]]],
        ];
    }

    public function test_oversized_ocr_text_is_rejected_without_silently_truncating_it(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['ocr_text' => str_repeat('ñ', 100001)]);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('model')
            ->assertSee('too long to map', false);

        Http::assertNothingSent();
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    public function test_ocr_text_at_the_character_limit_preserves_multibyte_characters(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->completion('{"tax_declaration_number":"TD-42"}'))]);
        $user = User::factory()->create();
        $document = $this->document($user, ['ocr_text' => str_repeat('ñ', 100000)]);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])->assertOk();

        Http::assertSent(fn (Request $request): bool => $request['messages'][1]['content'] === str_repeat('ñ', 100000));
    }

    /** @return array<string, mixed> */
    private function completion(string $content): array
    {
        return ['choices' => [['finish_reason' => 'stop', 'message' => ['role' => 'assistant', 'content' => $content]]]];
    }

    /** @param array<string, mixed> $overrides */
    private function document(User $user, array $overrides = []): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'registered_owner' => 'Staff corrected owner',
            'ocr_status' => 'completed',
            'ocr_text' => 'Tax declaration TD-42 for Mapped Owner',
            ...$overrides,
        ]);
    }
}
