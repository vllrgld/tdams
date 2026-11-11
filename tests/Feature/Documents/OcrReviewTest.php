<?php

namespace Tests\Feature\Documents;

use App\Http\Resources\DocumentResource;
use App\Jobs\OcrDocument;
use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentOcrEditor;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OcrReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_review_records_the_staff_member_and_time_without_changing_text_or_metadata(): void
    {
        $this->freezeTime();
        $document = $this->document();
        $user = User::factory()->create();
        $this->actingAs($user);
        $revision = DocumentOcrEditor::revision($document);

        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $revision, 'ocr_reviewed_by' => 999])
            ->assertOk()->assertJsonPath('reviewedAt', now()->toIso8601String())
            ->assertJsonPath('text', 'General Revislon')->assertJsonPath('revision', $revision);

        $document->refresh();
        $this->assertSame($user->id, $document->ocr_reviewed_by);
        $this->assertSame(now()->toIso8601String(), $document->ocr_reviewed_at->toIso8601String());
        $this->assertSame('General Revislon', $document->ocr_text);
        $this->assertSame('Staff metadata', $document->remarks);
        $this->getJson(route('documents.ocr', $document))->assertOk()->assertJsonPath('reviewedAt', now()->toIso8601String());

        $this->get(route('documents.index'))->assertInertia(fn (Assert $page) => $page
            ->where('documents.data.0.ocrReviewedAt', now()->toIso8601String()));
    }

    public function test_review_can_be_removed_and_repeated_confirmation_preserves_the_original_reviewer(): void
    {
        $this->freezeTime();
        $document = $this->document();
        $first = User::factory()->create();
        $revision = DocumentOcrEditor::revision($document);
        $this->actingAs($first)->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $revision])->assertOk();
        $reviewedAt = $document->refresh()->ocr_reviewed_at->toIso8601String();

        $this->travel(1)->minutes();
        $this->actingAs(User::factory()->create())->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $revision])
            ->assertOk()->assertJsonPath('reviewedAt', $reviewedAt);
        $this->assertSame($first->id, $document->refresh()->ocr_reviewed_by);

        $this->patchJson($this->endpoint($document), ['reviewed' => false, 'revision' => $revision])
            ->assertOk()->assertJsonPath('reviewedAt', null);
        $this->assertNull($document->refresh()->ocr_reviewed_at);
        $this->assertNull($document->ocr_reviewed_by);
    }

    public function test_guests_cannot_change_ocr_review(): void
    {
        $document = $this->document();
        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => DocumentOcrEditor::revision($document)])
            ->assertUnauthorized();
        $this->assertNull($document->refresh()->ocr_reviewed_at);
    }

    #[DataProvider('unreviewableResults')]
    public function test_only_completed_ocr_with_text_can_be_marked_reviewed(string $status, ?string $text): void
    {
        $document = $this->document();
        $document->forceFill(['ocr_status' => $status, 'ocr_text' => $text])->saveQuietly();
        $this->actingAs(User::factory()->create())->patchJson($this->endpoint($document), [
            'reviewed' => true, 'revision' => DocumentOcrEditor::revision($document),
        ])->assertUnprocessable()->assertJsonValidationErrors('reviewed');
        $this->assertNull($document->refresh()->ocr_reviewed_at);
    }

    /** @return array<string, array{string, string|null}> */
    public static function unreviewableResults(): array
    {
        return ['pending' => ['pending', 'Old text'], 'processing' => ['processing', 'Old text'], 'failed' => ['failed', 'Old text'], 'empty' => ['completed', '   '], 'missing' => ['completed', null]];
    }

    public function test_missing_invalid_and_stale_review_requests_are_rejected(): void
    {
        $document = $this->document();
        $this->actingAs(User::factory()->create());
        $this->patchJson($this->endpoint($document), [])->assertUnprocessable()->assertJsonValidationErrors(['reviewed', 'revision']);
        $this->patchJson($this->endpoint($document), ['reviewed' => 'reviewed', 'revision' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors(['reviewed', 'revision']);
        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => str_repeat('a', 64)])
            ->assertUnprocessable()->assertJsonValidationErrors('revision');
        $this->assertNull($document->refresh()->ocr_reviewed_at);
    }

    public function test_correcting_a_block_clears_review_and_a_stale_comparison_cannot_reapprove_it(): void
    {
        $document = $this->document();
        $this->actingAs(User::factory()->create());
        $revision = DocumentOcrEditor::revision($document);
        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $revision])->assertOk();

        $response = $this->patchJson(route('documents.ocr.regions.update', ['document' => $document, 'region' => 0]), [
            'text' => 'General Revision', 'revision' => $revision,
        ])->assertOk()->assertJsonPath('reviewedAt', null)->assertJsonPath('text', 'General Revision');
        $this->assertNull($document->refresh()->ocr_reviewed_at);
        $this->assertNull($document->ocr_reviewed_by);
        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $revision])->assertUnprocessable();
        $this->patchJson($this->endpoint($document), ['reviewed' => true, 'revision' => $response->json('revision')])->assertOk();
    }

    public function test_editing_metadata_keeps_the_ocr_review(): void
    {
        $document = $this->document();
        $this->actingAs(User::factory()->create())->patchJson($this->endpoint($document), [
            'reviewed' => true, 'revision' => DocumentOcrEditor::revision($document),
        ])->assertOk();
        app(DocumentWriter::class)->updateFields($document, ['remarks' => 'Corrected metadata']);
        $document->refresh();
        $this->assertNotNull($document->ocr_reviewed_at);
        $this->assertSame('General Revislon', $document->ocr_text);
        $this->assertSame('Corrected metadata', $document->remarks);
    }

    public function test_retry_clears_review_before_queuing_another_ocr_attempt(): void
    {
        Queue::fake([OcrDocument::class]);
        $document = $this->document();
        $user = User::factory()->create();
        $document->forceFill(['ocr_status' => 'failed', 'ocr_reviewed_at' => now(), 'ocr_reviewed_by' => $user->id])->saveQuietly();

        $this->actingAs($user)->postJson(route('documents.ocr.retry', $document))
            ->assertOk()->assertJsonPath('status', 'pending')->assertJsonPath('reviewedAt', null);
        $this->assertNull($document->refresh()->ocr_reviewed_at);
        $this->assertNull($document->ocr_reviewed_by);
        Queue::assertPushed(OcrDocument::class, fn (OcrDocument $job): bool => $job->documentId === $document->id);
    }

    public function test_a_new_ocr_job_does_not_carry_a_previous_review_into_new_text(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response(['text' => 'New OCR', 'pages' => ['New OCR'], 'page_count' => 1]),
            'http://127.0.0.1:8001/v1/pdf' => Http::response('%PDF-preview', 200, ['Content-Type' => 'application/pdf']),
            'http://127.0.0.1:8001/v1/thumbnail' => Http::response('', 503),
        ]);
        Storage::fake('local');
        $document = $this->document();
        Storage::disk('local')->put($document->storage_path, '%PDF-original');
        $document->forceFill(['ocr_status' => 'pending', 'ocr_reviewed_at' => now(), 'ocr_reviewed_by' => User::factory()->create()->id])->saveQuietly();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();
        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('New OCR', $document->ocr_text);
        $this->assertNull($document->ocr_reviewed_at);
        $this->assertNull($document->ocr_reviewed_by);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'http://127.0.0.1:8001/v1/ocr');
    }

    public function test_unreviewed_documents_expose_a_null_review_in_all_document_payloads(): void
    {
        $document = $this->document();
        $this->assertNull((new DocumentResource($document))->resolve()['ocrReviewedAt']);
        $this->actingAs(User::factory()->create())->getJson(route('documents.ocr', $document))
            ->assertOk()->assertJsonPath('reviewedAt', null);
    }

    private function document(): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'sample.pdf', 'storage_path' => 'documents/sample.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 8, 'ocr_status' => 'completed', 'ocr_text' => 'General Revislon', 'ocr_pages' => ['General Revislon'],
            'ocr_regions' => [['page' => 1, 'text' => 'General Revislon', 'box' => [10, 10, 90, 20], 'pageWidth' => 100, 'pageHeight' => 100]],
            'remarks' => 'Staff metadata',
        ]);
    }

    private function endpoint(Document $document): string
    {
        return route('documents.ocr.review', $document);
    }
}
