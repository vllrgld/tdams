<?php

namespace Tests\Feature\Documents;

use App\Jobs\DeleteDocumentFiles;
use App\Jobs\OcrDocument;
use App\Models\Book;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentTransfer;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class DocumentDeletionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{string}> */
    public static function filingKinds(): array
    {
        return ['book' => ['book'], 'folder' => ['folder']];
    }

    #[DataProvider('filingKinds')]
    public function test_deletion_cleans_files_and_related_records_and_closes_filing_position_gaps(string $kind): void
    {
        Storage::fake('local');
        $book = Book::factory()->create(['kind' => $kind]);
        $first = $this->document(['book_id' => $book->id, 'position' => 1]);
        $middle = $this->document(['book_id' => $book->id, 'position' => 2]);
        $last = $this->document(['book_id' => $book->id, 'position' => 4]);
        $other = $this->document(['book_id' => Book::factory()->create()->id, 'position' => 7]);
        $middle->forceFill(['ocr_pdf_path' => 'documents/ocr/custom.pdf', 'thumbnail_path' => 'documents/thumbnails/custom.jpg', 'ocr_text' => 'OCR', 'ocr_pages' => ['Page'], 'ocr_regions' => [['page' => 1, 'text' => 'Region']]])->save();
        $middle->attachments()->create(['description' => 'Attachment', 'page' => 1, 'position' => 1]);
        $paths = [$middle->storage_path, $middle->ocr_pdf_path, $middle->thumbnail_path, 'documents/ocr/'.$middle->id.'.pdf', 'documents/thumbnails/'.$middle->id.'.jpg'];
        foreach ([...$paths, $first->storage_path, $last->storage_path, $other->storage_path] as $path) {
            Storage::disk('local')->put($path, 'contents');
        }
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $middle))->assertOk()->assertJsonPath('cleanupPending', false);
        foreach (['documents' => 'id', 'document_attachments' => 'document_id', 'document_audits' => 'document_id'] as $table => $column) {
            $this->assertDatabaseMissing($table, [$column => $middle->id]);
        }
        Storage::disk('local')->assertMissing($paths);
        Storage::disk('local')->assertExists([$first->storage_path, $last->storage_path, $other->storage_path]);
        $this->assertSame(1, $first->refresh()->position);
        $this->assertSame(2, $last->refresh()->position);
        $this->assertSame(7, $other->refresh()->position);
        $this->assertSame(3, $book->nextDocumentPosition());
        $this->assertDatabaseHas('books', ['id' => $book->id]);
        $this->deleteJson(route('documents.destroy', $middle))->assertNotFound();
    }

    public function test_exclusive_metadata_and_previous_placeholders_are_removed(): void
    {
        Storage::fake('local');
        $document = $this->document(['tax_declaration_number' => 'TD-DELETE', 'pin' => 'PIN-DELETE', 'registered_owner' => 'Exclusive Owner', 'previous_tax_declaration_number' => 'TD-PLACEHOLDER', 'correspondent' => 'Exclusive Correspondent']);
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $document))->assertOk();
        foreach (['tax_declarations', 'properties', 'owners', 'declaration_owners', 'correspondents', 'document_audits'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseHas('document_types', ['slug' => 'tax-declaration']);
    }

    public function test_shared_metadata_and_files_survive_until_the_last_document_is_deleted(): void
    {
        Storage::fake('local');
        $attributes = ['tax_declaration_number' => 'TD-SHARED', 'pin' => 'PIN-SHARED', 'registered_owner' => 'Shared Owner', 'correspondent' => 'Shared Correspondent'];
        $first = $this->document($attributes);
        $second = $this->document($attributes);
        $second->forceFill(['storage_path' => $first->storage_path])->save();
        Storage::disk('local')->put($first->storage_path, 'shared');
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $first))->assertOk();
        $this->assertDatabaseHas('tax_declarations', ['id' => $first->tax_declaration_id]);
        $this->assertNotNull($second->refresh()->taxDeclaration?->property);
        $this->assertSame('Shared Owner', $second->registered_owner);
        $this->assertNotNull($second->correspondent);
        Storage::disk('local')->assertExists($first->storage_path);
        $this->deleteJson(route('documents.destroy', $second))->assertOk();
        Storage::disk('local')->assertMissing($first->storage_path);
        foreach (['tax_declarations', 'properties', 'owners', 'correspondents'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    public function test_shared_property_and_owner_records_are_kept_when_an_exclusive_declaration_is_removed(): void
    {
        Storage::fake('local');
        $first = $this->document(['tax_declaration_number' => 'TD-A', 'pin' => 'PIN-COMMON', 'registered_owner' => 'Shared Owner']);
        $second = $this->document(['tax_declaration_number' => 'TD-B', 'pin' => 'PIN-COMMON']);
        $declaration = $first->taxDeclaration;
        $this->assertNotNull($declaration);
        $owner = $declaration->owners()->firstOrFail();
        $secondDeclaration = $second->taxDeclaration;
        $this->assertNotNull($secondDeclaration);
        $secondDeclaration->owners()->attach($owner->id, ['position' => 0]);

        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $first))->assertOk();
        $this->assertDatabaseMissing('tax_declarations', ['id' => $declaration->id]);
        $this->assertDatabaseHas('properties', ['id' => $secondDeclaration->property_id]);
        $this->assertDatabaseHas('owners', ['id' => $owner->id]);
        $this->assertSame('Shared Owner', $second->refresh()->registered_owner);
    }

    public function test_a_declaration_needed_by_another_documents_history_is_preserved(): void
    {
        Storage::fake('local');
        $previous = $this->document(['tax_declaration_number' => 'TD-PREVIOUS', 'pin' => 'PIN-HISTORY', 'registered_owner' => 'Historical Owner']);
        $following = $this->document(['tax_declaration_number' => 'TD-FOLLOWING', 'previous_tax_declaration_number' => 'TD-PREVIOUS']);
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $previous))->assertOk();
        $this->assertSame($previous->tax_declaration_id, $following->refresh()->taxDeclaration?->previous_declaration_id);
        $this->deleteJson(route('documents.destroy', $following))->assertOk();
        foreach (['tax_declarations', 'owners', 'properties'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    public function test_transfer_endorsement_and_audit_history_are_removed_but_reusable_routing_is_kept(): void
    {
        Storage::fake('local');
        $office = Office::query()->where('is_receiving', true)->sole();
        $user = User::factory()->create();
        $route = DocumentRoute::factory()->create();
        $step = $route->steps()->create(['name' => $office->name, 'office_id' => $office->id, 'position' => 1, 'can_take_action' => true, 'needs_endorsement' => true]);
        $document = $this->document(['filing_path' => Document::FILING_ROUTE, 'document_route_id' => $route->id]);
        $document->endorsements()->create(['document_route_step_id' => $step->id, 'office_id' => $office->id, 'endorsed_by' => $user->id, 'endorsed_at' => now(), 'routing_version' => 1]);
        DocumentTransfer::query()->create(['document_id' => $document->id, 'from_office_id' => Office::factory()->create()->id, 'to_office_id' => $office->id, 'released_by' => $user->id, 'received_by' => $user->id, 'released_at' => now(), 'received_at' => now()]);
        $this->actingAs($user)->deleteJson(route('documents.destroy', $document))->assertOk();
        foreach (['document_transfers', 'document_endorsements', 'document_audits'] as $table) {
            $this->assertDatabaseMissing($table, ['document_id' => $document->id]);
        }
        $this->assertDatabaseHas('document_routes', ['id' => $route->id]);
        $this->assertDatabaseHas('document_route_steps', ['id' => $step->id]);
    }

    public function test_deletion_requires_a_verified_user_in_the_holding_office(): void
    {
        Storage::fake('local');
        $document = $this->document();
        Storage::disk('local')->put($document->storage_path, 'keep');
        $this->deleteJson(route('documents.destroy', $document))->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->deleteJson(route('documents.destroy', $document))->assertForbidden();
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => Office::factory()->create()->id])->deleteJson(route('documents.destroy', $document))->assertNotFound();
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
        Storage::disk('local')->assertExists($document->storage_path);
    }

    public function test_in_transit_documents_cannot_be_deleted(): void
    {
        $document = $this->document(['filing_path' => Document::FILING_ROUTE]);
        $user = User::factory()->create();
        DocumentTransfer::query()->create(['document_id' => $document->id, 'from_office_id' => $document->office_id, 'to_office_id' => null, 'released_by' => $user->id, 'released_at' => now()]);
        $this->actingAs($user)->deleteJson(route('documents.destroy', $document))->assertNotFound();
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
    }

    public function test_active_ocr_blocks_deletion_and_a_pending_job_cannot_recreate_a_deleted_document(): void
    {
        Storage::fake('local');
        $document = $this->document(['ocr_status' => 'processing']);
        Storage::disk('local')->put($document->storage_path, 'keep');
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $document))->assertUnprocessable()->assertJsonValidationErrors('document');
        Storage::disk('local')->assertExists($document->storage_path);
        $document->forceFill(['ocr_status' => 'pending'])->save();
        $this->deleteJson(route('documents.destroy', $document))->assertOk();
        app()->call([new OcrDocument($document->id), 'handle']);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        $this->assertDatabaseCount('document_audits', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
    }

    public function test_database_failure_rolls_back_records_without_deleting_files(): void
    {
        Storage::fake('local');
        Exceptions::fake();
        $document = $this->document(['tax_declaration_number' => 'TD-ROLLBACK']);
        Storage::disk('local')->put($document->storage_path, 'keep');
        Event::listen('eloquent.deleting: '.Document::class, function (): never {
            throw new RuntimeException('Deletion failed.');
        });
        try {
            $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $document))->assertInternalServerError();
        } finally {
            Event::forget('eloquent.deleting: '.Document::class);
        }
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
        $this->assertDatabaseHas('document_audits', ['document_id' => $document->id]);
        Storage::disk('local')->assertExists($document->storage_path);
        Exceptions::assertReported(RuntimeException::class);
    }

    public function test_storage_failure_is_reported_and_the_exact_paths_are_queued_for_retry(): void
    {
        Queue::fake([DeleteDocumentFiles::class]);
        Exceptions::fake();
        $document = $this->document();
        $disk = Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('delete')->twice()->andReturn(false, true);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $document))->assertOk()->assertJsonPath('cleanupPending', true);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Queue::assertPushed(DeleteDocumentFiles::class, function (DeleteDocumentFiles $job) use ($document): bool {
            $this->assertContains($document->storage_path, $job->paths);
            $job->handle();

            return true;
        });
        Exceptions::assertReported(RuntimeException::class);
    }

    public function test_invalid_storage_paths_do_not_delete_records_or_unrelated_files(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('account.txt', 'keep');
        $document = $this->document(['storage_path' => 'documents/../account.txt']);
        $this->actingAs(User::factory()->create())->deleteJson(route('documents.destroy', $document))->assertUnprocessable()->assertJsonValidationErrors('document');
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
        Storage::disk('local')->assertExists('account.txt');
    }

    /** @param array<string, mixed> $attributes */
    private function document(array $attributes = []): Document
    {
        $name = fake()->uuid().'.pdf';

        return app(DocumentWriter::class)->create(['original_filename' => $name, 'storage_path' => 'documents/'.$name, 'mime_type' => 'application/pdf', 'file_size' => 128, 'ocr_status' => 'completed', ...$attributes]);
    }
}
