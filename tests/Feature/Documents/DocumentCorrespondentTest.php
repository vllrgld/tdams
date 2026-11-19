<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Correspondent;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\DocumentType;
use App\Models\TaxDeclaration;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentCorrespondentTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_upload_without_a_type_is_filed_as_a_tax_declaration(): void
    {
        Storage::fake('local');
        Queue::fake();
        $book = Book::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 128, 'application/pdf'),
                'book_id' => $book->id,
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertSame(DocumentType::taxDeclaration()->id, $document->document_type_id);
        $this->assertNull($document->correspondent_id);
    }

    public function test_a_custom_type_stores_the_correspondent_and_does_not_create_a_tax_declaration(): void
    {
        Storage::fake('local');
        Queue::fake();
        $book = Book::factory()->create();
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('memo.pdf', 128, 'application/pdf'),
                'book_id' => $book->id,
                'document_type_id' => $type->id,
                'correspondent' => 'Office of the Governor',
                'tax_declaration_number' => 'TD-SHOULD-NOT-SAVE',
                'registered_owner' => 'Should Not Save',
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertSame($type->id, $document->document_type_id);
        $this->assertSame('Office of the Governor', $document->correspondent?->name);
        $this->assertNull($document->tax_declaration_id);
        $this->assertNull($document->tax_declaration_number);
        $this->assertNull($document->registered_owner);
        $this->assertSame(0, TaxDeclaration::query()->count());
    }

    public function test_saving_a_mapped_correspondent_reuses_the_same_record(): void
    {
        $user = User::factory()->create();
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
        ]);
        $second = app(DocumentWriter::class)->create([
            'original_filename' => 'second.pdf',
            'storage_path' => 'documents/second.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'correspondent' => 'Office of the Governor',
            ])
            ->assertOk()
            ->assertJsonPath('document.correspondent', 'Office of the Governor');

        $this->actingAs($user)
            ->putJson(route('documents.fields', $second), [
                'correspondent' => 'office of the governor',
            ])
            ->assertOk()
            ->assertJsonPath('document.correspondent', 'Office of the Governor');

        $this->assertSame(1, Correspondent::query()->count());
        $this->assertSame($document->refresh()->correspondent_id, $second->refresh()->correspondent_id);
    }

    public function test_a_blank_correspondent_clears_the_link(): void
    {
        $user = User::factory()->create();
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'correspondent' => 'Office of the Governor',
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'correspondent' => '',
            ])
            ->assertOk()
            ->assertJsonPath('document.correspondent', null);

        $this->assertNull($document->refresh()->correspondent_id);
    }

    public function test_mapping_a_custom_type_requests_title_correspondent_and_remarks(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://groq.test/openai/v1/chat/completions' => Http::response(['choices' => [['finish_reason' => 'stop',
                'message' => [
                    'content' => json_encode([
                        'correspondent' => 'Office of the Governor',
                        'letter_date' => '2024-08-15',
                        'tax_declaration_number' => 'TD-9',
                        'registered_owner' => 'Mapped Owner',
                    ]),
                ],
            ]]]),
        ]);
        $user = User::factory()->create();
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'memo.pdf',
            'storage_path' => 'documents/memo.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'document_type_id' => $type->id,
            'ocr_status' => 'completed',
            'ocr_text' => 'From the Office of the Governor',
        ]);

        $response = $this->actingAs($user)->postJson(route('documents.map', $document), [
            'model' => 'openai/gpt-oss-120b',
        ]);

        $response->assertOk()->assertJsonPath('fields.correspondent', 'Office of the Governor');
        $this->assertSame(['title', 'correspondent', 'letter_date', 'remarks', 'attachments'], array_keys($response->json('fields')));
        $this->assertNull($response->json('fields.title'));
        $this->assertSame('2024-08-15', $response->json('fields.letter_date'));
        $this->assertNull($response->json('fields.remarks'));
        $this->assertSame([], $response->json('fields.attachments'));
        $this->assertNull($document->refresh()->correspondent_id);
        $this->assertSame(0, TaxDeclaration::query()->count());
        $this->assertSame(0, DocumentAttachment::query()->count());

        Http::assertSent(function ($request): bool {
            return $request->url() === 'https://groq.test/openai/v1/chat/completions'
                && $request['response_format']['json_schema']['schema']['required'] === ['title', 'correspondent', 'letter_date', 'remarks', 'title_suggestions', 'attachments']
                && ($request['response_format']['json_schema']['schema']['properties']['title_suggestions']['minItems'] ?? null) === 2
                && ($request['response_format']['json_schema']['schema']['properties']['title_suggestions']['maxItems'] ?? null) === 2
                && ($request['response_format']['json_schema']['schema']['properties']['attachments']['type'] ?? null) === 'array'
                && str_contains($request['messages'][0]['content'], 'shared document fields')
                && str_contains($request['messages'][0]['content'], 'Dates must be YYYY-MM-DD.')
                && str_contains($request['messages'][0]['content'], 'Return an empty list when none are listed.');
        });
    }

    public function test_mapping_a_custom_type_returns_listed_attachments_without_saving_them(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://groq.test/openai/v1/chat/completions' => Http::response(['choices' => [['finish_reason' => 'stop',
                'message' => [
                    'content' => json_encode([
                        'attachments' => [
                            ['description' => 'Certified true copy of title', 'page' => '3'],
                            ['description' => 'Sketch plan', 'page' => ''],
                        ],
                    ]),
                ],
            ]]]),
        ]);
        $user = User::factory()->create();
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'memo.pdf',
            'storage_path' => 'documents/memo.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'document_type_id' => $type->id,
            'ocr_status' => 'completed',
            'ocr_text' => "Enclosure:\n1. Certified true copy of title, page 3\n2. Sketch plan",
        ]);

        $this->actingAs($user)
            ->postJson(route('documents.map', $document), [
                'model' => 'openai/gpt-oss-120b',
            ])
            ->assertOk()
            ->assertJsonPath('fields.attachments.0.description', 'Certified true copy of title')
            ->assertJsonPath('fields.attachments.0.page', 3)
            ->assertJsonPath('fields.attachments.1.description', 'Sketch plan')
            ->assertJsonPath('fields.attachments.1.page', null);

        $this->assertSame(0, DocumentAttachment::query()->count());
    }

    public function test_mapping_a_custom_type_discards_blank_and_invalid_attachments(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://groq.test/openai/v1/chat/completions' => Http::response(['choices' => [['finish_reason' => 'stop',
                'message' => [
                    'content' => json_encode([
                        'attachments' => [
                            '',
                            '___',
                            ['description' => '   ', 'page' => '2'],
                            ['description' => 'Deed of sale', 'page' => 'page one'],
                            ['description' => 'deed of sale', 'page' => '4'],
                        ],
                    ]),
                ],
            ]]]),
        ]);
        $user = User::factory()->create();
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'memo.pdf',
            'storage_path' => 'documents/memo.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'document_type_id' => $type->id,
            'ocr_status' => 'completed',
            'ocr_text' => 'Attached: Deed of sale',
        ]);

        $response = $this->actingAs($user)->postJson(route('documents.map', $document), [
            'model' => 'openai/gpt-oss-120b',
        ]);

        $response->assertOk()
            ->assertJsonPath('fields.attachments.0.description', 'Deed of sale')
            ->assertJsonPath('fields.attachments.0.page', null);
        $this->assertCount(1, $response->json('fields.attachments'));
        $this->assertSame(0, DocumentAttachment::query()->count());
    }

    public function test_mapping_a_custom_type_discards_an_invalid_letter_date(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://groq.test/openai/v1/chat/completions' => Http::response(['choices' => [['finish_reason' => 'stop',
                'message' => [
                    'content' => json_encode([
                        'letter_date' => '15 August 2024',
                    ]),
                ],
            ]]]),
        ]);
        $user = User::factory()->create();
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'memo.pdf',
            'storage_path' => 'documents/memo.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'document_type_id' => $type->id,
            'ocr_status' => 'completed',
            'ocr_text' => 'Dated 15 August 2024',
        ]);

        $this->actingAs($user)
            ->postJson(route('documents.map', $document), [
                'model' => 'openai/gpt-oss-120b',
            ])
            ->assertOk()
            ->assertJsonPath('fields.letter_date', null);
    }
}
