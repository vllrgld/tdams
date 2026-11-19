<?php

namespace Tests\Feature\Documents;

use App\Jobs\OcrDocument;
use App\Models\Book;
use App\Models\Document;
use App\Models\DocumentAudit;
use App\Models\DocumentRoute;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentOcrEditor;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use LogicException;
use RuntimeException;
use Tests\TestCase;

class DocumentAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_incoming_upload_records_the_real_uploader_and_origin_office_before_switching_to_receiving(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $this->freezeTime();
        $office = Office::factory()->create(['can_upload_to_receiving' => true]);
        $user = User::factory()->create(['name' => 'Ana Reyes']);
        $receiving = Office::query()->where('is_receiving', true)->sole();

        $this->actingAs($user)->withSession(['current_office_id' => $office->id])
            ->postJson(route('documents.store'), [
                'filing_path' => Document::FILING_ROUTE,
                'file' => UploadedFile::fake()->create('incoming.pdf', 10, 'application/pdf'),
                'actor_id' => 999, 'actor_name' => 'Forged', 'actor_office_id' => 999,
            ])->assertOk()->assertJsonPath('switchedOffice', true);

        $entry = DocumentAudit::query()->sole();
        $document = Document::query()->sole();
        $this->assertSame('uploaded', $entry->action);
        $this->assertSame($document->id, $entry->document_id);
        $this->assertSame($user->id, $entry->actor_id);
        $this->assertSame('Ana Reyes', $entry->actor_name);
        $this->assertSame($office->id, $entry->actor_office_id);
        $this->assertSame($receiving->id, $entry->context['office']['id']);
        $this->assertSame('incoming.pdf', $entry->context['fileName']);
        $this->assertSame($document->tracking_code, $entry->context['trackingCode']);
        $this->assertSame(now()->toIso8601String(), $entry->occurred_at->toIso8601String());
        Queue::assertPushed(OcrDocument::class, 1);
    }

    public function test_archive_upload_keeps_the_original_filing_location_in_its_audit(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $book = Book::factory()->create(['label' => 'Original volume']);
        $this->actingAs(User::factory()->create())->postJson(route('documents.store'), [
            'book_id' => $book->id,
            'file' => UploadedFile::fake()->create('archive.pdf', 10, 'application/pdf'),
        ])->assertOk();
        $entry = DocumentAudit::query()->sole();
        $book->update(['label' => 'Renamed volume']);

        $this->assertSame('Original volume', $entry->refresh()->context['location']['item']);
        $this->assertSame($book->drawer->cabinet->name, $entry->context['location']['cabinet']);
        Queue::assertPushed(OcrDocument::class, 1);
    }

    public function test_metadata_changes_show_before_and_after_and_no_op_saves_do_not_add_activity(): void
    {
        $document = $this->document(['lot_number' => '1543']);
        $user = User::factory()->create(['name' => 'Bert Cruz']);
        $office = Office::query()->where('is_receiving', true)->sole();
        $this->actingAs($user)->putJson(route('documents.fields', $document), ['lot_number' => '1544', 'remarks' => 'Corrected remark'])->assertOk();
        $entry = $document->audits()->where('action', 'fields_updated')->sole();
        $this->assertSame(['before' => '1543', 'after' => '1544'], $entry->changes['lot_number']);
        $this->assertSame(['before' => null, 'after' => 'Corrected remark'], $entry->changes['remarks']);
        $this->assertCount(2, $entry->changes);
        $this->putJson(route('documents.fields', $document), ['lot_number' => '1544', 'remarks' => 'Corrected remark'])->assertOk();
        $this->assertSame(1, $document->audits()->where('action', 'fields_updated')->count());
        $user->update(['name' => 'Changed name']);
        $office->update(['name' => 'Changed office']);
        $this->assertSame('Bert Cruz', $entry->refresh()->actor_name);
        $this->assertSame('Receiving Office', $entry->actor_office_name);
    }

    public function test_a_failed_audit_insert_rolls_back_the_metadata_change(): void
    {
        $document = $this->document(['lot_number' => '1543']);
        $count = $document->audits()->count();
        Exceptions::fake();
        DocumentAudit::creating(static function (): never {
            throw new RuntimeException('Audit storage unavailable.');
        });

        $this->actingAs(User::factory()->create())->putJson(route('documents.fields', $document), ['lot_number' => '9999'])->assertServerError();

        $this->assertSame('1543', $document->refresh()->lot_number);
        $this->assertSame($count, $document->audits()->count());
        Exceptions::assertReported(RuntimeException::class);
    }

    public function test_an_upload_failure_rolls_back_the_audit_and_removes_the_stored_file(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        Exceptions::fake();
        $book = Book::factory()->create();
        DocumentAudit::creating(static function (): never {
            throw new RuntimeException('Audit storage unavailable.');
        });

        $this->actingAs(User::factory()->create())->postJson(route('documents.store'), [
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-FAILED',
            'file' => UploadedFile::fake()->create('failed.pdf', 10, 'application/pdf'),
        ])->assertServerError();

        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_audits', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
        Queue::assertNothingPushed();
        Exceptions::assertReported(RuntimeException::class);
    }

    public function test_shared_property_edits_are_recorded_on_each_affected_document(): void
    {
        $first = $this->document(['tax_declaration_number' => 'TD-A', 'pin' => 'PIN-1', 'lot_number' => '1543']);
        $second = $this->document(['tax_declaration_number' => 'TD-B', 'pin' => 'PIN-1']);
        $staff = User::factory()->create();
        $this->actingAs($staff)->putJson(route('documents.fields', $first), ['lot_number' => '1544'])->assertOk();

        $entry = $second->audits()->where('action', 'fields_updated')->sole();
        $this->assertSame('1544', $second->refresh()->lot_number);
        $this->assertSame(['before' => '1543', 'after' => '1544'], $entry->changes['lot_number']);
        $this->assertTrue($entry->context['sharedRecord']);
        $this->assertSame($staff->id, $entry->actor_id);
    }

    public function test_automatic_previous_declaration_resolution_is_recorded_on_the_following_document(): void
    {
        $follower = $this->document(['tax_declaration_number' => 'TD-NEW', 'previous_tax_declaration_number' => 'TD-OLD']);
        $this->document(['tax_declaration_number' => 'TD-OLD']);

        $entry = $follower->audits()->where('action', 'declaration_linked')->sole();
        $this->assertTrue($entry->context['automatic']);
        $this->assertSame(['before' => null, 'after' => 'TD-OLD'], $entry->changes['previous_declaration']);
    }

    public function test_staff_linking_a_previous_declaration_records_the_link_and_actor(): void
    {
        $this->document(['tax_declaration_number' => 'TD-OLD']);
        $document = $this->document(['tax_declaration_number' => 'TD-NEW']);
        $staff = User::factory()->create();
        $this->actingAs($staff)->patch(route('documents.update', $document), ['previous_tax_declaration_number' => 'TD-OLD'])->assertRedirect(route('documents.index'));

        $entry = $document->audits()->where('action', 'declaration_linked')->sole();
        $this->assertSame($staff->id, $entry->actor_id);
        $this->assertSame(['before' => null, 'after' => 'TD-OLD'], $entry->changes['previous_tax_declaration_number']);
    }

    public function test_release_routing_and_receipt_record_both_offices_and_follow_the_document(): void
    {
        $source = Office::query()->where('name', Office::PA_NAME)->sole();
        $destination = Office::factory()->create(['name' => 'Finance Office']);
        $sender = User::factory()->create(['name' => 'Sender']);
        $receiver = User::factory()->create(['name' => 'Receiver']);
        $document = $this->document(['office_id' => $source->id, 'filing_path' => Document::FILING_ROUTE]);
        $routing = DocumentRoute::factory()->create();
        foreach ([$source, $destination] as $index => $office) {
            $routing->steps()->create(['office_id' => $office->id, 'name' => $office->name, 'position' => $index + 1]);
        }
        $this->actingAs($sender)->withSession(['current_office_id' => $source->id]);
        $this->postJson(route('documents.office-actions.release'), [
            'document_id' => $document->id, 'office_id' => $source->id, 'document_route_id' => $routing->id,
        ])->assertOk();
        $release = $document->audits()->where('action', 'released')->sole();
        $this->assertSame($sender->id, $release->actor_id);
        $this->assertSame($source->id, $release->context['fromOffice']['id']);
        $this->assertSame($destination->id, $release->context['toOffice']['id']);
        $this->assertSame($routing->name, $release->context['routing']['name']);
        $this->assertCount(2, $release->context['routing']['steps']);
        $this->assertSame(1, $document->audits()->where('action', 'routing_changed')->count());
        $count = $document->audits()->count();
        $this->postJson(route('documents.office-actions.release'), ['document_id' => $document->id, 'office_id' => $source->id])->assertUnprocessable();
        $this->assertSame($count, $document->audits()->count());

        $this->actingAs($receiver)->withSession(['current_office_id' => $destination->id])
            ->postJson(route('documents.office-actions.receive'), ['document_id' => $document->id, 'office_id' => $destination->id])->assertOk();
        $receipt = $document->audits()->where('action', 'received')->sole();
        $this->assertSame($receiver->id, $receipt->actor_id);
        $this->assertSame($destination->id, $receipt->actor_office_id);
        $this->getJson(route('documents.audit', $document))->assertOk()->assertJsonPath('data.0.action', 'received');
        $this->withSession(['current_office_id' => $source->id])->getJson(route('documents.audit', $document))->assertNotFound();
    }

    public function test_ocr_review_corrections_and_retries_record_real_changes_without_duplicate_confirmations(): void
    {
        Queue::fake([OcrDocument::class]);
        $document = $this->document(['ocr_text' => 'Revislon', 'ocr_pages' => ['Revislon'], 'ocr_regions' => [['page' => 1, 'text' => 'Revislon', 'x' => 0, 'y' => 0, 'width' => 1, 'height' => 1]]]);
        $user = User::factory()->create();
        $this->actingAs($user);
        $revision = DocumentOcrEditor::revision($document);
        $this->patchJson(route('documents.ocr.review', $document), ['reviewed' => true, 'revision' => $revision])->assertOk();
        $this->patchJson(route('documents.ocr.review', $document), ['reviewed' => true, 'revision' => $revision])->assertOk();
        $this->assertSame(1, $document->audits()->where('action', 'ocr_reviewed')->count());
        $this->patchJson(route('documents.ocr.regions.update', [$document, 0]), ['text' => 'Revision', 'revision' => $revision])->assertOk();
        $entry = $document->audits()->where('action', 'ocr_corrected')->sole();
        $this->assertSame(['before' => 'Revislon', 'after' => 'Revision'], $entry->changes['text']);
        $this->assertSame(['before' => true, 'after' => false], $entry->changes['ocr_reviewed']);
        $this->assertSame(1, $entry->context['page']);
        $this->patchJson(route('documents.ocr.regions.update', [$document, 0]), ['text' => 'Wrong', 'revision' => $revision])->assertUnprocessable();
        $this->assertSame(1, $document->audits()->where('action', 'ocr_corrected')->count());
        $document->refresh()->forceFill(['ocr_status' => 'failed'])->saveQuietly();
        $this->postJson(route('documents.ocr.retry', $document))->assertOk();
        $this->postJson(route('documents.ocr.retry', $document))->assertOk();
        $this->assertSame(1, $document->audits()->where('action', 'ocr_retried')->count());
        Queue::assertPushed(OcrDocument::class, 1);
    }

    public function test_ocr_background_failures_are_system_events_and_repeated_failure_callbacks_do_not_duplicate_them(): void
    {
        Storage::fake('local');
        $document = $this->document(['ocr_status' => 'pending']);
        $this->actingAs(User::factory()->create());
        OcrDocument::dispatchSync($document->id);
        (new OcrDocument($document->id))->failed(new RuntimeException('Duplicate failure callback.'));

        $entries = $document->audits()->whereIn('action', ['ocr_started', 'ocr_failed'])->orderBy('id')->get();
        $this->assertSame(['ocr_started', 'ocr_failed'], $entries->pluck('action')->all());
        foreach ($entries as $entry) {
            $this->assertSame('system', $entry->actor_type);
            $this->assertNull($entry->actor_id);
            $this->assertNull($entry->actor_office_id);
        }
    }

    public function test_attachment_add_edit_and_removal_are_audited_with_their_actual_values(): void
    {
        $type = DocumentType::query()->create(['name' => 'Letter', 'slug' => 'audit-letter', 'uses_tax_declaration_fields' => false]);
        $document = $this->document(['document_type_id' => $type->id]);
        $this->actingAs(User::factory()->create())->postJson(route('documents.attachments.store', $document), ['description' => 'Enclosure', 'page' => 2])->assertOk();
        $attachment = $document->attachments()->sole();
        $this->patchJson(route('documents.attachments.update', [$document, $attachment]), ['description' => 'Correct enclosure'])->assertOk();
        $this->patchJson(route('documents.attachments.update', [$document, $attachment]), ['description' => 'Correct enclosure'])->assertOk();
        $this->deleteJson(route('documents.attachments.destroy', [$document, $attachment]))->assertOk();
        $entries = $document->audits()->where('action', 'like', 'attachment_%')->orderBy('id')->get();
        $this->assertSame(['attachment_added', 'attachment_updated', 'attachment_removed'], $entries->pluck('action')->all());
        $this->assertSame(['before' => 'Enclosure', 'after' => 'Correct enclosure'], $entries[1]->changes['description']);
        $this->assertSame(['before' => 'Correct enclosure', 'after' => null], $entries[2]->changes['description']);
    }

    public function test_mapping_proposals_and_failures_are_logged_without_saving_suggestions_or_provider_secrets(): void
    {
        Http::preventStrayRequests();
        $document = $this->document(['lot_number' => '1543', 'ocr_text' => 'Lot No. 1543']);
        $endpoint = 'https://groq.test/openai/v1/chat/completions';
        Http::fake([$endpoint => Http::sequence()
            ->push(['choices' => [['finish_reason' => 'stop', 'message' => ['content' => '{"lot_number":"9999"}']]]])
            ->push(['error' => ['message' => 'private-provider-detail']], 429)]);
        $this->actingAs(User::factory()->create())->postJson(route('documents.map', $document), ['model' => 'openai/gpt-oss-120b'])->assertOk();
        $this->postJson(route('documents.map', $document), ['model' => 'openai/gpt-oss-120b'])->assertUnprocessable();
        $this->assertSame('1543', $document->refresh()->lot_number);
        $this->assertSame(1, $document->audits()->where('action', 'mapping_generated')->count());
        $this->assertSame(1, $document->audits()->where('action', 'mapping_failed')->count());
        $this->getJson(route('documents.audit', $document))->assertOk()->assertDontSee('private-provider-detail');
        Http::assertSentCount(2);
    }

    public function test_audit_is_read_only_office_scoped_and_cursor_paginated_without_duplicate_entries(): void
    {
        $this->freezeTime();
        $document = $this->document();
        $other = $this->document(['office_id' => Office::factory()->create()->id]);
        DocumentAudit::factory()->count(26)->create(['document_id' => $document->id, 'document_reference' => $document->id]);
        foreach (['file_accessed', 'ocr_completed'] as $action) {
            DocumentAudit::factory()->count(30)->create(['document_id' => $document->id, 'document_reference' => $document->id, 'action' => $action]);
        }
        $this->getJson(route('documents.audit', $document))->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->getJson(route('documents.audit', $document))->assertForbidden();
        $this->actingAs(User::factory()->create());
        $first = $this->getJson(route('documents.audit', $document))->assertOk()->assertJsonCount(25, 'data');
        $second = $this->getJson(route('documents.audit', ['document' => $document->id, 'cursor' => $first->json('nextCursor')]))->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('nextCursor', null);
        $ids = [...array_column($first->json('data'), 'id'), ...array_column($second->json('data'), 'id')];
        $this->assertCount(27, array_unique($ids));
        $this->assertSame($document->audits()->whereIn('action', ['uploaded', 'fields_updated'])->orderByDesc('id')->pluck('id')->all(), $ids);
        $this->getJson(route('documents.audit', $other))->assertNotFound();
        $this->patchJson(route('documents.audit', $document), ['action' => 'forged'])->assertMethodNotAllowed();
        $this->assertSame(87, $document->audits()->count());
    }

    public function test_activity_ocr_and_all_filters_exclude_file_requests(): void
    {
        $this->freezeTime();
        $document = $this->document();
        foreach (['fields_updated', 'routing_changed', 'released', 'received', 'status_updated', 'ocr_started', 'ocr_completed', 'mapping_generated', 'file_accessed'] as $action) {
            DocumentAudit::factory()->create(['document_id' => $document->id, 'document_reference' => $document->id, 'action' => $action]);
        }
        $this->actingAs(User::factory()->create());

        $activity = $this->getJson(route('documents.audit', $document))->assertOk();
        $ocr = $this->getJson(route('documents.audit', ['document' => $document->id, 'filter' => 'ocr']))->assertOk();
        $all = $this->getJson(route('documents.audit', ['document' => $document->id, 'filter' => 'all']))->assertOk();

        $this->assertSame(['status_updated', 'received', 'released', 'routing_changed', 'fields_updated', 'uploaded'], array_column($activity->json('data'), 'action'));
        $this->assertSame(['mapping_generated', 'ocr_completed', 'ocr_started'], array_column($ocr->json('data'), 'action'));
        $this->assertSame(['mapping_generated', 'ocr_completed', 'ocr_started', 'status_updated', 'received', 'released', 'routing_changed', 'fields_updated', 'uploaded'], array_column($all->json('data'), 'action'));
        $all->assertJsonPath('data.3.label', 'Document status updated');
        $this->getJson(route('documents.audit', ['document' => $document->id, 'filter' => 'file_accessed']))->assertUnprocessable()->assertJsonValidationErrors('filter');
    }

    public function test_upload_entries_are_concise_without_discarding_the_stored_audit(): void
    {
        Queue::fake([OcrDocument::class]);
        Storage::fake('local');
        $user = User::factory()->create(['name' => 'Ana Reyes']);
        $book = Book::factory()->create();
        $this->actingAs($user)->postJson(route('documents.store'), [
            'book_id' => $book->id,
            'file' => UploadedFile::fake()->create('audit.pdf', 10, 'application/pdf'),
            'lot_number' => '1543',
        ])->assertOk();
        $document = Document::query()->sole();

        $this->getJson(route('documents.audit', $document))->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.actor.name', 'Ana Reyes')
            ->assertJsonPath('data.0.actingOffice', 'Receiving Office')
            ->assertJsonPath('data.0.context', [])
            ->assertJsonPath('data.0.changes', []);

        $entry = $document->audits()->sole();
        $this->assertSame('audit.pdf', $entry->context['fileName']);
        $this->assertSame(['before' => null, 'after' => '1543'], $entry->changes['lot_number']);
    }

    public function test_audit_entries_cannot_be_edited_or_deleted_individually(): void
    {
        $entry = $this->document()->audits()->sole();
        foreach (['update', 'delete'] as $operation) {
            try {
                $operation === 'update' ? $entry->update(['action' => 'forged']) : $entry->delete();
                $this->fail('An audit entry was modified.');
            } catch (LogicException) {
                $this->assertSame('uploaded', $entry->refresh()->action);
            }
        }
    }

    public function test_the_first_request_cannot_bypass_office_scoping_without_a_session_selection(): void
    {
        $document = $this->document(['office_id' => Office::factory()->create()->id]);

        $this->actingAs(User::factory()->create())->getJson(route('documents.audit', $document))->assertNotFound();
    }

    public function test_viewing_original_and_ocr_files_or_reading_status_does_not_add_audit_activity(): void
    {
        Storage::fake('local');
        $document = $this->document();
        Storage::disk('local')->put($document->storage_path, '%PDF-1.4 test');
        $count = $document->audits()->count();
        $this->actingAs(User::factory()->create())->get(route('documents.view', $document))->assertOk();
        $this->get(route('documents.ocr-pdf', $document))->assertOk();
        $document->forceFill(['ocr_pdf_path' => 'documents/ocr.pdf'])->saveQuietly();
        Storage::disk('local')->put('documents/ocr.pdf', '%PDF-1.4 OCR test');
        $this->get(route('documents.ocr-pdf', $document))->assertOk();
        $this->getJson(route('documents.audit', $document))->assertOk();
        $this->getJson(route('documents.ocr', $document))->assertOk();
        $this->assertSame($count, $document->audits()->count());
    }

    public function test_existing_upload_and_transfer_records_are_imported_without_inventing_the_original_office(): void
    {
        $document = $this->document();
        $receiving = Office::query()->where('is_receiving', true)->sole();
        $other = Office::factory()->create();
        $sender = User::factory()->create();
        $transfer = $document->transfers()->create(['from_office_id' => $receiving->id, 'to_office_id' => $other->id, 'released_by' => $sender->id, 'released_at' => now()]);
        $migration = require database_path('migrations/2026_11_15_185407_create_document_audits_table.php');
        $migration->down();
        $migration->up();
        $upload = $document->audits()->where('action', 'uploaded')->sole();
        $this->assertTrue($upload->imported);
        $this->assertSame($document->uploaded_by, $upload->actor_id);
        $this->assertSame($document->created_at->toIso8601String(), $upload->occurred_at->toIso8601String());
        $this->assertNull($upload->actor_office_id);
        $this->assertNull($upload->context['office']);
        $release = $document->audits()->where('action', 'released')->sole();
        $this->assertTrue($release->imported);
        $this->assertSame($sender->id, $release->actor_id);
        $this->assertSame($receiving->id, $release->actor_office_id);
        $this->assertSame($transfer->id, $release->context['transferId']);
    }

    public function test_deleting_a_document_preserves_its_audit_but_the_explicit_local_reset_clears_all_audit_records(): void
    {
        Storage::fake('local');
        $document = $this->document();
        $entry = $document->audits()->sole();
        DB::table('documents')->where('id', $document->id)->delete();
        $this->assertNull($entry->refresh()->document_id);
        $this->assertSame($document->id, $entry->document_reference);
        $this->actingAs(User::factory()->create())->delete(route('data.destroy'), ['confirmation' => 'RESET'])->assertRedirect();
        $this->assertDatabaseCount('document_audits', 0);
    }

    /** @param array<string, mixed> $attributes */
    private function document(array $attributes = []): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'audit.pdf', 'storage_path' => 'documents/audit.pdf',
            'mime_type' => 'application/pdf', 'file_size' => 1024,
            'uploaded_by' => User::factory()->create()->id, 'ocr_status' => 'completed',
            ...$attributes,
        ]);
    }
}
