<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\DocumentType;
use App\Models\TaxDeclaration;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentMetadataTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_upload_can_wait_until_verification_for_its_document_type(): void
    {
        Storage::fake('local');
        Queue::fake();
        $book = Book::factory()->create();

        $this->actingAs(User::factory()->create())->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('scan.pdf', 128, 'application/pdf'),
            'book_id' => $book->id,
            'document_type_id' => null,
        ])->assertOk();

        $document = Document::query()->sole();
        $this->assertNull($document->document_type_id);
        $this->assertNull($document->tax_declaration_id);
        $this->assertSame($book->id, $document->book_id);
    }

    public function test_verification_saves_the_selected_type_with_its_metadata(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['document_type_id' => null]);
        $type = $this->memorandumType();

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'document_type_id' => $type->id,
            'title' => 'Verified memorandum',
            'letter_date' => '2026-11-17',
            'correspondent' => 'Records Office',
            'remarks' => 'Verified note',
            'tax_declaration_number' => 'UNSELECTED-TAX-FIELD',
        ])->assertOk()->assertJsonPath('document.documentTypeId', $type->id)
            ->assertJsonPath('document.usesTaxFields', false)
            ->assertJsonPath('document.title', 'Verified memorandum')
            ->assertJsonPath('document.letterDate', '2026-11-17')
            ->assertJsonPath('document.remarks', 'Verified note');

        $document->refresh();
        $this->assertSame($type->id, $document->document_type_id);
        $this->assertSame('Records Office', $document->correspondent?->name);
        $this->assertNull($document->tax_declaration_id);
        $this->assertDatabaseHas('document_audits', [
            'document_reference' => $document->id,
            'action' => 'fields_updated',
            'changes->document_type_id->after' => $type->id,
        ]);
    }

    public function test_verification_can_select_tax_fields_for_an_unclassified_upload(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['document_type_id' => null]);
        $type = DocumentType::taxDeclaration();

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'document_type_id' => $type->id,
            'tax_declaration_number' => 'TD-VERIFIED',
            'registered_owner' => 'Verified Owner',
        ])->assertOk()->assertJsonPath('document.documentTypeId', $type->id)
            ->assertJsonPath('document.usesTaxFields', true)
            ->assertJsonPath('document.taxDeclarationNumber', 'TD-VERIFIED')
            ->assertJsonPath('document.registeredOwner', 'Verified Owner');

        $this->assertNotNull($document->refresh()->tax_declaration_id);
    }

    public function test_the_selected_type_can_be_saved_without_unchecked_mapping_fields(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['document_type_id' => null]);
        $type = $this->memorandumType();

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            'document_type_id' => $type->id,
        ])->assertOk()->assertJsonPath('document.documentTypeId', $type->id);

        $document->refresh();
        $this->assertSame($type->id, $document->document_type_id);
        $this->assertNull($document->title);
        $this->assertNull($document->tax_declaration_id);
    }

    #[DataProvider('invalidVerificationTypes')]
    /** @param array<string, mixed> $fields */
    public function test_verification_rejects_a_missing_or_invalid_document_type(array $fields): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['document_type_id' => null]);

        $this->actingAs($user)->putJson(route('documents.fields', $document), [
            ...$fields, 'correspondent' => 'Must not save',
        ])->assertUnprocessable()->assertJsonValidationErrors('document_type_id');

        $document->refresh();
        $this->assertNull($document->document_type_id);
        $this->assertNull($document->correspondent_id);
    }

    /** @return array<string, array{array<string, mixed>}> */
    public static function invalidVerificationTypes(): array
    {
        return [
            'missing' => [[]],
            'empty' => [['document_type_id' => null]],
            'unavailable' => [['document_type_id' => 999999]],
        ];
    }

    public function test_an_unclassified_upload_can_list_attachments_before_saving_its_type(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, ['document_type_id' => null]);

        $this->actingAs($user)->postJson(route('documents.attachments.store', $document), [
            'description' => 'Verified enclosure', 'page' => 2,
        ])->assertOk()->assertJsonPath('document.attachments.0.description', 'Verified enclosure');

        $this->assertNull($document->refresh()->document_type_id);
        $this->assertSame(1, $document->attachments()->count());
    }

    public function test_a_custom_type_upload_stores_title_and_remarks_without_a_tax_declaration(): void
    {
        Storage::fake('local');
        Queue::fake();
        $book = Book::factory()->create();
        $type = $this->memorandumType();

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('memo.pdf', 128, 'application/pdf'),
                'book_id' => $book->id,
                'document_type_id' => $type->id,
                'title' => 'Request for records',
                'correspondent' => 'Office of the Governor',
                'letter_date' => '2024-08-15',
                'remarks' => 'For filing with the records office.',
                'tax_declaration_number' => 'TD-SHOULD-NOT-SAVE',
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertSame($type->id, $document->document_type_id);
        $this->assertSame('Request for records', $document->title);
        $this->assertSame('Office of the Governor', $document->correspondent?->name);
        $this->assertSame('2024-08-15', $document->letter_date?->toDateString());
        $this->assertSame('For filing with the records office.', $document->remarks);
        $this->assertNull($document->tax_declaration_id);
        $this->assertSame(0, TaxDeclaration::query()->count());
    }

    public function test_saving_metadata_updates_title_correspondent_and_remarks(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'title' => 'Application letter',
                'correspondent' => 'Municipal Treasurer',
                'letter_date' => '2024-08-15',
                'remarks' => 'Received at the window.',
            ])
            ->assertOk()
            ->assertJsonPath('document.title', 'Application letter')
            ->assertJsonPath('document.correspondent', 'Municipal Treasurer')
            ->assertJsonPath('document.letterDate', '2024-08-15')
            ->assertJsonPath('document.remarks', 'Received at the window.')
            ->assertJsonPath('document.attachments', []);

        $document->refresh();

        $this->assertSame('Application letter', $document->title);
        $this->assertSame('Municipal Treasurer', $document->correspondent?->name);
        $this->assertSame('2024-08-15', $document->letter_date?->toDateString());
        $this->assertSame('Received at the window.', $document->remarks);
    }

    public function test_a_blank_title_clears_the_stored_title(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
            'title' => 'Application letter',
            'letter_date' => '2024-08-15',
            'remarks' => 'Keep this note.',
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'title' => '',
            ])
            ->assertOk()
            ->assertJsonPath('document.title', null)
            ->assertJsonPath('document.letterDate', '2024-08-15')
            ->assertJsonPath('document.remarks', 'Keep this note.');

        $this->assertNull($document->refresh()->title);
        $this->assertSame('2024-08-15', $document->letter_date?->toDateString());
        $this->assertSame('Keep this note.', $document->remarks);
    }

    public function test_a_blank_letter_date_clears_the_stored_date(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
            'letter_date' => '2024-08-15',
            'remarks' => 'Keep this note.',
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'letter_date' => '',
            ])
            ->assertOk()
            ->assertJsonPath('document.letterDate', null)
            ->assertJsonPath('document.remarks', 'Keep this note.');

        $this->assertNull($document->refresh()->letter_date);
        $this->assertSame('Keep this note.', $document->remarks);
    }

    public function test_an_invalid_letter_date_is_rejected(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
            'letter_date' => '2024-08-15',
        ]);

        $this->actingAs($user)
            ->putJson(route('documents.fields', $document), [
                'letter_date' => 'not-a-date',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('letter_date');

        $this->assertSame('2024-08-15', $document->refresh()->letter_date?->toDateString());
    }

    public function test_a_tax_declaration_upload_ignores_the_letter_date(): void
    {
        Storage::fake('local');
        Queue::fake();
        $book = Book::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 128, 'application/pdf'),
                'book_id' => $book->id,
                'letter_date' => '2024-08-15',
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertTrue($document->usesTaxDeclarationFields());
        $this->assertNull($document->letter_date);
    }

    public function test_staff_can_list_an_attachment_and_page_on_a_custom_type_document(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
            'title' => 'Application letter',
        ]);

        $response = $this->actingAs($user)
            ->postJson(route('documents.attachments.store', $document), [
                'description' => 'Certified true copy of title',
                'page' => 3,
            ])
            ->assertOk()
            ->assertJsonPath('document.title', 'Application letter')
            ->assertJsonPath('document.attachments.0.description', 'Certified true copy of title')
            ->assertJsonPath('document.attachments.0.page', 3);

        $this->assertSame(
            ['id', 'description', 'page'],
            array_keys($response->json('document.attachments.0')),
        );

        $attachment = DocumentAttachment::query()->sole();

        $this->assertSame($document->id, $attachment->document_id);
        $this->assertSame('Certified true copy of title', $attachment->description);
        $this->assertSame(3, $attachment->page);
        $this->assertSame(1, $attachment->position);
    }

    public function test_staff_can_update_an_attachment_description_and_clear_its_page(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
        ]);
        $attachment = $this->attach($document, page: 2);

        $this->actingAs($user)
            ->patchJson(route('documents.attachments.update', [$document, $attachment]), [
                'description' => 'Sketch plan',
                'page' => 5,
            ])
            ->assertOk()
            ->assertJsonPath('document.attachments.0.description', 'Sketch plan')
            ->assertJsonPath('document.attachments.0.page', 5);

        $this->assertSame('Sketch plan', $attachment->refresh()->description);
        $this->assertSame(5, $attachment->page);

        $this->actingAs($user)
            ->patchJson(route('documents.attachments.update', [$document, $attachment]), [
                'page' => null,
            ])
            ->assertOk()
            ->assertJsonPath('document.attachments.0.page', null);

        $this->assertNull($attachment->refresh()->page);
        $this->assertSame('Sketch plan', $attachment->description);
    }

    public function test_staff_can_remove_an_attachment(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
        ]);
        $attachment = $this->attach($document);

        $this->actingAs($user)
            ->deleteJson(route('documents.attachments.destroy', [$document, $attachment]))
            ->assertOk()
            ->assertJsonPath('document.attachments', []);

        $this->assertModelMissing($attachment);
    }

    public function test_tax_declaration_documents_return_404_for_attachments(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user);

        $this->actingAs($user)
            ->postJson(route('documents.attachments.store', $document), [
                'description' => 'Certified true copy of title',
            ])
            ->assertNotFound();

        $this->assertSame(0, DocumentAttachment::query()->count());
    }

    public function test_an_attachment_from_another_document_returns_404(): void
    {
        $user = User::factory()->create();
        $type = $this->memorandumType();
        $document = $this->document($user, ['document_type_id' => $type->id]);
        $other = $this->document($user, [
            'document_type_id' => $type->id,
            'original_filename' => 'other.pdf',
            'storage_path' => 'documents/other.pdf',
        ]);
        $attachment = $this->attach($document);

        $this->actingAs($user)
            ->patchJson(route('documents.attachments.update', [$other, $attachment]), [
                'page' => 4,
            ])
            ->assertNotFound();

        $this->actingAs($user)
            ->deleteJson(route('documents.attachments.destroy', [$other, $attachment]))
            ->assertNotFound();

        $this->assertModelExists($attachment);
        $this->assertSame(1, $attachment->refresh()->page);
        $this->assertSame('Certified true copy of title', $attachment->description);
    }

    public function test_guests_cannot_store_attachments(): void
    {
        $document = $this->document(User::factory()->create(), [
            'document_type_id' => $this->memorandumType()->id,
        ]);

        $this->postJson(route('documents.attachments.store', $document), [
            'description' => 'Certified true copy of title',
        ])->assertUnauthorized();

        $this->assertSame(0, DocumentAttachment::query()->count());
    }

    public function test_invalid_attachment_listings_are_rejected(): void
    {
        $user = User::factory()->create();
        $document = $this->document($user, [
            'document_type_id' => $this->memorandumType()->id,
        ]);

        $this->actingAs($user)
            ->postJson(route('documents.attachments.store', $document), [
                'description' => '   ',
                'page' => 0,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['description', 'page']);

        $this->assertSame(0, DocumentAttachment::query()->count());
    }

    public function test_documents_page_and_upload_options_expose_metadata_field_sections(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('metadataFieldSections', 2)
                ->where('metadataFieldSections.0.id', 'document')
                ->where('metadataFieldSections.0.fields.0.name', 'title')
                ->where('metadataFieldSections.0.fields.1.name', 'correspondent')
                ->where('metadataFieldSections.0.fields.2.name', 'letter_date')
                ->where('metadataFieldSections.0.fields.2.type', 'date')
                ->where('metadataFieldSections.1.id', 'remarks')
                ->where('metadataFieldSections.1.fields.0.name', 'remarks'));

        $this->actingAs($user)
            ->getJson(route('documents.upload-options'))
            ->assertOk()
            ->assertJsonPath('metadataFieldSections.0.id', 'document')
            ->assertJsonPath('metadataFieldSections.0.fields.0.name', 'title')
            ->assertJsonPath('metadataFieldSections.0.fields.1.name', 'correspondent')
            ->assertJsonPath('metadataFieldSections.0.fields.2.name', 'letter_date')
            ->assertJsonPath('metadataFieldSections.0.fields.2.type', 'date')
            ->assertJsonPath('metadataFieldSections.1.id', 'remarks');
    }

    private function memorandumType(): DocumentType
    {
        return DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);
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

    private function attach(Document $document, int $page = 1): DocumentAttachment
    {
        return $document->attachments()->create([
            'description' => 'Certified true copy of title',
            'page' => $page,
            'position' => 1,
        ]);
    }
}
