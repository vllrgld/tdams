<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentType;
use App\Models\Drawer;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentFilingPathTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        Storage::fake('local');
    }

    public function test_an_upload_without_a_path_is_archived_in_the_selected_book(): void
    {
        $book = Book::factory()->create();

        $this->actingAs(User::factory()->create())
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('declaration.pdf', 128, 'application/pdf'),
                'book_id' => $book->id,
            ])
            ->assertOk()
            ->assertJsonStructure(['id']);

        $document = Document::query()->sole();

        $this->assertSame(Document::FILING_ARCHIVE, $document->filing_path);
        $this->assertSame(Document::STATUS_ARCHIVED, $document->status);
        $this->assertSame($book->id, $document->book_id);
        $this->assertNull($document->document_route_id);
    }

    public function test_uploads_cannot_assign_fixed_routing_even_from_pa(): void
    {
        $route = DocumentRoute::factory()->withSteps()->create();
        $pa = Office::query()->where('name', Office::PA_NAME)->sole();
        $this->actingAs(User::factory()->create())
            ->withSession(['current_office_id' => $pa->id])
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('memo.pdf', 128, 'application/pdf'),
                'filing_path' => Document::FILING_ROUTE,
                'document_route_id' => $route->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_route_id');
        $this->assertDatabaseCount('documents', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
    }

    public function test_office_documents_uploaded_for_archiving_have_archived_status_and_cannot_be_approved(): void
    {
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $book = Book::factory()->for(Drawer::factory()->for(Cabinet::factory()->for($office)))->create();
        $type = DocumentType::query()->create(['name' => 'Letter', 'slug' => 'letter', 'uses_tax_declaration_fields' => false]);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);

        $this->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('letter.pdf', 128, 'application/pdf'),
            'document_type_id' => $type->id, 'filing_path' => Document::FILING_ARCHIVE, 'book_id' => $book->id,
        ])->assertOk();

        $document = Document::query()->sole();
        $this->assertSame(Document::STATUS_ARCHIVED, $document->status);
        $this->assertNull($document->tracking_code);
        $this->getJson(route('documents.workflow.show', $document))->assertOk()
            ->assertJsonPath('status', 'archived')->assertJsonPath('label', 'Archived')
            ->assertJsonPath('canTakeAction', false)
            ->assertJsonPath('actionBlock', 'Archived documents do not require approval actions.');
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])->assertForbidden();
        $this->assertSame(Document::STATUS_ARCHIVED, $document->refresh()->status);
        $this->assertSame(0, $document->audits()->where('action', 'status_updated')->count());
    }

    public function test_existing_archive_statuses_are_corrected_once_without_changing_incoming_documents(): void
    {
        $type = DocumentType::query()->create(['name' => 'Letter', 'slug' => 'letter', 'uses_tax_declaration_fields' => false]);
        $attributes = ['document_type_id' => $type->id, 'original_filename' => 'letter.pdf', 'storage_path' => 'documents/letter.pdf', 'mime_type' => 'application/pdf', 'file_size' => 128];
        $archive = app(DocumentWriter::class)->create($attributes);
        $archive->forceFill(['status' => 'under_review'])->saveQuietly();
        $tax = app(DocumentWriter::class)->create([...$attributes, 'document_type_id' => DocumentType::taxDeclaration()->id]);
        $tax->forceFill(['status' => 'under_review'])->saveQuietly();
        $incoming = app(DocumentWriter::class)->create([...$attributes, 'filing_path' => Document::FILING_ROUTE]);
        $migration = require database_path('migrations/2026_11_16_023317_normalize_archived_document_statuses.php');

        $migration->up();
        $migration->up();

        $this->assertSame(Document::STATUS_ARCHIVED, $archive->refresh()->status);
        $this->assertSame(Document::STATUS_ARCHIVED, $tax->refresh()->status);
        $this->assertSame(Document::STATUS_UNDER_REVIEW, $incoming->refresh()->status);
        $entry = $archive->audits()->where('action', 'status_updated')->sole();
        $this->assertSame('Under review', $entry->changes['status']['before']);
        $this->assertSame('Archived', $entry->changes['status']['after']);
        $this->assertSame('archive_upload', $entry->context['reason']);
        $this->assertSame(1, $tax->audits()->where('action', 'status_updated')->count());
        $this->assertSame(0, $incoming->audits()->where('action', 'status_updated')->count());
    }

    public function test_incoming_uploads_start_in_receiving_and_remain_accessible_for_ocr_review(): void
    {
        $office = Office::factory()->create();
        $receiving = Office::query()->where('is_receiving', true)->sole();
        $receiving->update(['name' => 'Central Receiving']);

        $this->actingAs(User::factory()->create())
            ->withSession(['current_office_id' => $office->id])
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('memo.pdf', 128, 'application/pdf'),
                'filing_path' => Document::FILING_ROUTE,
                'office_id' => $office->id,
            ])
            ->assertOk()
            ->assertJsonPath('switchedOffice', true)
            ->assertJsonPath('office.officeId', $receiving->id)
            ->assertJsonPath('office.officeName', 'Central Receiving')
            ->assertJsonPath('office.officePermissions.canUploadToReceiving', true)
            ->assertSessionHas('current_office_id', $receiving->id);

        $document = Document::query()->sole();
        $this->assertSame($receiving->id, $document->office_id);
        $this->assertNull($document->document_route_id);
        $this->assertNull($document->book_id);
        $this->assertNotNull($document->tracking_code);
        $this->assertSame(Document::STATUS_UNDER_REVIEW, $document->status);
        $this->getJson(route('documents.ocr', $document))->assertOk();
    }

    public function test_a_document_can_be_routed_without_a_fixed_sequence_of_offices(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('memo.pdf', 128, 'application/pdf'),
                'filing_path' => Document::FILING_ROUTE,
            ])
            ->assertOk();

        $document = Document::query()->sole();
        $this->assertSame(Document::FILING_ROUTE, $document->filing_path);
        $this->assertNull($document->document_route_id);
        $this->assertNotNull($document->tracking_code);
    }

    public function test_an_archive_upload_still_requires_a_book(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('declaration.pdf', 128, 'application/pdf'),
                'filing_path' => Document::FILING_ARCHIVE,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('book_id');

        $this->assertSame(0, Document::query()->count());
    }

    public function test_upload_to_receiving_permission_can_be_disabled_without_blocking_archiving(): void
    {
        $office = Office::factory()->create(['can_upload_to_receiving' => false, 'can_route_documents' => true]);
        $book = Book::factory()->for(Drawer::factory()->for(Cabinet::factory()->for($office)))->create();
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('incoming.pdf', 128, 'application/pdf'),
            'filing_path' => Document::FILING_ROUTE,
        ])->assertForbidden();
        $this->assertDatabaseCount('documents', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));

        $this->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('archive.pdf', 128, 'application/pdf'),
            'filing_path' => Document::FILING_ARCHIVE, 'book_id' => $book->id,
        ])->assertOk()->assertJsonPath('switchedOffice', false);
        $this->assertSame($office->id, Document::query()->sole()->office_id);

        $office->update(['can_upload_to_receiving' => true]);
        $this->postJson(route('documents.store'), [
            'file' => UploadedFile::fake()->create('incoming.pdf', 128, 'application/pdf'),
            'filing_path' => Document::FILING_ROUTE,
        ])->assertOk()->assertJsonPath('switchedOffice', true);
    }

    public function test_incoming_documents_can_move_from_receiving_to_pa_for_routing_assignment(): void
    {
        $receiving = Office::query()->where('is_receiving', true)->sole();
        $pa = Office::query()->where('name', Office::PA_NAME)->sole();
        $destination = Office::factory()->create();
        $route = DocumentRoute::factory()->create();
        foreach ([$pa, $destination] as $position => $office) {
            $route->steps()->create(['office_id' => $office->id, 'name' => $office->name, 'position' => $position + 1]);
        }

        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $pa->id])
            ->postJson(route('documents.store'), [
                'file' => UploadedFile::fake()->create('letter.pdf', 128, 'application/pdf'),
                'filing_path' => Document::FILING_ROUTE,
            ])->assertOk();
        $document = Document::query()->sole();
        $code = $document->tracking_code;
        $this->assertSame($receiving->id, $document->office_id);

        $this->postJson(route('documents.office-actions.release'), [
            'office_id' => $receiving->id, 'tracking_code' => $code, 'destination_office_id' => $pa->id,
        ])->assertOk();
        $this->assertNull($document->refresh()->document_route_id);
        $this->withSession(['current_office_id' => $pa->id])->postJson(route('documents.office-actions.receive'), [
            'office_id' => $pa->id, 'tracking_code' => $code,
        ])->assertOk();
        $this->postJson(route('documents.office-actions.release'), [
            'office_id' => $pa->id, 'tracking_code' => $code, 'document_route_id' => $route->id,
        ])->assertOk();
        $this->assertSame($route->id, $document->refresh()->document_route_id);
        $this->assertSame($code, $document->tracking_code);
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $destination->id, 'received_at' => null]);
    }
}
