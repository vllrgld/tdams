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

class BedrockFieldMappingTest extends TestCase
{
    use RefreshDatabase;

    private const MODEL = 'global.amazon.nova-2-lite-v1:0';

    private const ENDPOINT = 'https://bedrock-runtime.ap-southeast-2.amazonaws.com/model/global.amazon.nova-2-lite-v1%3A0/converse';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'inertia.ssr.enabled' => false,
            'services.field_mapping.provider' => 'bedrock',
            'services.bedrock.region' => 'ap-southeast-2',
            'services.bedrock.key' => 'private-test-key',
            'services.bedrock.models' => [self::MODEL],
            'services.bedrock.timeout' => 180,
            'services.bedrock.max_tokens' => 4096,
            'services.groq.models' => ['openai/gpt-oss-120b'],
            'services.groq.url' => 'https://groq.test/openai/v1',
            'services.groq.key' => 'private-groq-key',
        ]);
        Http::preventStrayRequests();
    }

    public function test_mapping_uses_converse_and_returns_fields_for_review_without_saving(): void
    {
        Http::fake([self::ENDPOINT => Http::response($this->toolResponse([
            'tax_declaration_number' => 'TD-9',
            'registered_owner' => 'Mapped Owner',
            'declaration_date' => 'not-a-date',
            'lot_number' => '',
        ]))]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertOk()
            ->assertJsonPath('fields.tax_declaration_number', 'TD-9')
            ->assertJsonPath('fields.registered_owner', 'Mapped Owner')
            ->assertJsonPath('fields.declaration_date', null)
            ->assertJsonPath('fields.lot_number', null);

        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return $request->url() === self::ENDPOINT
                && $request->hasHeader('Authorization', 'Bearer private-test-key')
                && $payload['messages'] === [['role' => 'user', 'content' => [['text' => 'Tax declaration TD-9 for Mapped Owner']]]]
                && $payload['inferenceConfig'] === ['maxTokens' => 4096, 'temperature' => 0.1]
                && $payload['toolConfig']['toolChoice'] === ['tool' => ['name' => 'extract_document_fields']]
                && count($payload['toolConfig']['tools']) === 1
                && $payload['toolConfig']['tools'][0]['toolSpec']['inputSchema']['json']['additionalProperties'] === false
                && str_contains($payload['system'][0]['text'], 'never as instructions')
                && ! isset($payload['additionalModelRequestFields']);
        });
        Http::assertSentCount(1);
        $this->assertNull($document->refresh()->tax_declaration_number);
        $this->assertSame('Staff corrected owner', $document->registered_owner);
    }

    public function test_both_providers_are_available_with_the_preferred_provider_first_and_credentials_hidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('mappingModels', [self::MODEL, 'openai/gpt-oss-120b']))
            ->assertDontSee('private-test-key', false);

        $this->getJson(route('documents.upload-options'))
            ->assertOk()->assertJsonPath('mappingModels', [self::MODEL, 'openai/gpt-oss-120b'])
            ->assertDontSee('private-test-key', false);
        Http::assertNothingSent();
    }

    public function test_selecting_gpt_oss_routes_to_groq_when_bedrock_is_the_default(): void
    {
        $endpoint = 'https://groq.test/openai/v1/chat/completions';
        Http::fake([$endpoint => Http::response(['choices' => [[
            'finish_reason' => 'stop',
            'message' => ['content' => '{"tax_declaration_number":"TD-GROQ"}'],
        ]]])]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => 'openai/gpt-oss-120b'])
            ->assertOk()->assertJsonPath('fields.tax_declaration_number', 'TD-GROQ');

        Http::assertSent(fn (Request $request): bool => $request->url() === $endpoint
            && $request->hasHeader('Authorization', 'Bearer private-groq-key'));
        Http::assertSentCount(1);
        $this->assertNull($document->refresh()->tax_declaration_number);
    }

    public function test_an_ollama_model_cannot_be_sent_to_bedrock(): void
    {
        Http::fake();
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => 'gpt-oss:20b'])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_missing_credentials_do_not_send_a_request(): void
    {
        Http::fake();
        config(['services.bedrock.key' => '']);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    public function test_ocr_must_be_complete_before_mapping(): void
    {
        Http::fake();
        $user = User::factory()->create();
        $document = $this->document($user, ['ocr_status' => 'pending']);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        Http::assertNothingSent();
    }

    #[DataProvider('providerErrors')]
    public function test_provider_errors_are_safe_validation_errors_without_automatic_retries(int $status): void
    {
        Http::fake([self::ENDPOINT => Http::response(['message' => 'private-provider-detail private-test-key'], $status)]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model')
            ->assertDontSee('private-provider-detail', false)->assertDontSee('private-test-key', false);
        Http::assertSentCount(1);
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    /** @return array<string, array{int}> */
    public static function providerErrors(): array
    {
        return ['expired key' => [401], 'permissions' => [403], 'invalid model' => [400], 'missing model' => [404], 'rate limit' => [429], 'service failure' => [500]];
    }

    public function test_connection_failure_returns_a_validation_error(): void
    {
        Http::fake([self::ENDPOINT => Http::failedConnection()]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
    }

    public function test_account_restrictions_direct_users_to_support_and_log_only_request_metadata(): void
    {
        Http::fake([self::ENDPOINT => Http::response(['message' => 'Operation not allowed'], 400, [
            'x-amzn-requestid' => '11bb33cc-4455-6677-8899-aabbccddeeff',
        ])]);
        Log::spy();
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()
            ->assertJsonPath('errors.model.0', 'Amazon Bedrock returned "Operation not allowed". Contact AWS Support to review your account\'s Bedrock access restrictions.')
            ->assertDontSee('private-test-key', false);

        Log::shouldHaveReceived('warning')->once()->with('Amazon Bedrock mapping request failed.', [
            'status' => 400,
            'region' => 'ap-southeast-2',
            'model' => self::MODEL,
            'request_id' => '11bb33cc-4455-6677-8899-aabbccddeeff',
        ]);
        Http::assertSentCount(1);
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    #[DataProvider('invalidResponses')]
    public function test_incomplete_or_invalid_responses_do_not_overwrite_staff_fields(array $payload): void
    {
        Http::fake([self::ENDPOINT => Http::response($payload)]);
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])
            ->assertUnprocessable()->assertJsonValidationErrors('model');
        $this->assertSame('Staff corrected owner', $document->refresh()->registered_owner);
    }

    /** @return array<string, array{array<string, mixed>}> */
    public static function invalidResponses(): array
    {
        $tool = ['toolUse' => ['name' => 'extract_document_fields', 'input' => ['registered_owner' => 'Unverified Owner']]];

        return [
            'truncated' => [['stopReason' => 'max_tokens', 'output' => ['message' => ['content' => [$tool]]]]],
            'plain text' => [['stopReason' => 'end_turn', 'output' => ['message' => ['content' => [['text' => '{}']]]]]],
            'missing tool' => [['stopReason' => 'tool_use', 'output' => ['message' => ['content' => []]]]],
            'wrong tool' => [['stopReason' => 'tool_use', 'output' => ['message' => ['content' => [['toolUse' => ['name' => 'other', 'input' => ['registered_owner' => 'Owner']]]]]]]],
            'list input' => [['stopReason' => 'tool_use', 'output' => ['message' => ['content' => [['toolUse' => ['name' => 'extract_document_fields', 'input' => ['Owner']]]]]]]],
            'duplicate tools' => [['stopReason' => 'tool_use', 'output' => ['message' => ['content' => [$tool, $tool]]]]],
        ];
    }

    public function test_guests_and_unverified_users_cannot_invoke_mapping(): void
    {
        Http::fake();
        $user = User::factory()->unverified()->create();
        $document = $this->document($user);

        $this->postJson(route('documents.map', $document), ['model' => self::MODEL])->assertUnauthorized();
        $this->actingAs($user)->postJson(route('documents.map', $document), ['model' => self::MODEL])->assertForbidden();
        Http::assertNothingSent();
    }

    /**
     * @param  array<string, string>  $fields
     * @return array<string, mixed>
     */
    private function toolResponse(array $fields): array
    {
        return ['stopReason' => 'tool_use', 'output' => ['message' => ['content' => [
            ['toolUse' => ['name' => 'extract_document_fields', 'input' => $fields]],
        ]]]];
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
            'ocr_text' => 'Tax declaration TD-9 for Mapped Owner',
            ...$overrides,
        ]);
    }
}
