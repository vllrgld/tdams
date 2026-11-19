<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\TrackingCodeSetting;
use App\Models\User;
use App\Services\Documents\DocumentTrackingCodes;
use App\Services\Documents\DocumentWriter;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class DocumentTrackingCodesTest extends TestCase
{
    use RefreshDatabase;

    public function test_routed_documents_get_unique_codes_but_archived_documents_do_not(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-15 08:00:00'));
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $archive = $this->document($user, $office);
        $first = $this->document($user, $office, ['filing_path' => 'route']);
        $second = $this->document($user, $office, ['filing_path' => 'route']);
        $this->assertNull($archive->tracking_code);
        $this->assertMatchesRegularExpression('/^DTMS-2026-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/', $first->tracking_code);
        $this->assertNotSame($first->tracking_code, $second->tracking_code);
        $this->assertNull($first->document_route_id);
    }

    public function test_random_collisions_are_retried_without_changing_existing_codes(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-15 08:00:00'));
        $user = User::factory()->create();
        $office = Office::factory()->create();
        Str::createRandomStringsUsingSequence(['7K9M4R2X', '7K9M4R2X', '9Q8P6V3T']);
        try {
            $first = $this->document($user, $office, ['filing_path' => 'route']);
            $second = $this->document($user, $office, ['filing_path' => 'route']);
            $this->assertSame('DTMS-2026-7K9M-4R2X', $first->tracking_code);
            $this->assertSame('DTMS-2026-9Q8P-6V3T', $second->tracking_code);
        } finally {
            Str::createRandomStringsNormally();
        }
    }

    public function test_guests_cannot_view_change_or_assign_tracking_codes(): void
    {
        $this->get(route('tracking-codes.edit'))->assertRedirect(route('login'));
        $this->putJson(route('tracking-codes.update'), ['prefix' => 'PGIN'])->assertUnauthorized();
        $this->postJson(route('tracking-codes.assign'))->assertUnauthorized();
    }

    public function test_prefix_changes_apply_only_to_future_codes(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $existing = $this->document($user, $office, ['filing_path' => 'route']);
        $code = $existing->tracking_code;
        $this->actingAs($user)->put(route('tracking-codes.update'), ['prefix' => ' pgin '])->assertRedirect(route('tracking-codes.edit'));
        $this->assertSame('PGIN', TrackingCodeSetting::current()->prefix);
        $this->assertStringStartsWith('PGIN-', $this->document($user, $office, ['filing_path' => 'route'])->tracking_code);
        $this->assertSame($code, app(DocumentTrackingCodes::class)->assign($existing));
        $this->get(route('tracking-codes.edit'))->assertInertia(fn (Assert $page) => $page->component('settings/tracking-codes')->where('prefix', 'PGIN')->where('missingCount', 0));
    }

    #[TestWith(['A'])]
    #[TestWith(['1PGIN'])]
    #[TestWith(['PG-IN'])]
    #[TestWith(['PREFIXTOOLONG'])]
    #[TestWith([['PGIN']])]
    public function test_invalid_prefixes_are_rejected(mixed $prefix): void
    {
        $this->actingAs(User::factory()->create())->putJson(route('tracking-codes.update'), ['prefix' => $prefix])->assertUnprocessable()->assertJsonValidationErrors('prefix');
        $this->assertSame('DTMS', TrackingCodeSetting::current()->prefix);
    }

    public function test_missing_codes_can_be_filled_without_touching_archived_documents(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $routed = $this->document($user, $office, ['filing_path' => 'route']);
        $routed->tracking_code = null;
        $routed->save();
        $archive = $this->document($user, $office);
        $this->actingAs($user)->post(route('tracking-codes.assign'))->assertRedirect(route('tracking-codes.edit'));
        $this->assertNotNull($routed->refresh()->tracking_code);
        $this->assertNull($archive->refresh()->tracking_code);
        $code = $routed->tracking_code;
        $this->artisan('documents:assign-tracking-codes')->expectsOutput('Assigned 0 tracking codes.')->assertSuccessful();
        $this->assertSame($code, $routed->refresh()->tracking_code);
    }

    public function test_first_release_assigns_a_code_and_moves_an_archived_document_into_routing(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $destination = Office::factory()->create();
        $book = Book::factory()->create();
        $document = $this->document($user, $office, ['book_id' => $book->id, 'position' => 1]);
        $this->assertNull($document->tracking_code);
        $response = $this->actingAs($user)->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.release'), [
            'document_id' => $document->id, 'office_id' => $office->id, 'destination_office_id' => $destination->id,
        ])->assertOk();
        $document->refresh();
        $this->assertNotNull($document->tracking_code);
        $this->assertSame($document->tracking_code, $response->json('trackingCode'));
        $this->assertSame('route', $document->filing_path);
        $this->assertNull($document->book_id);
        $this->assertNull($document->position);
    }

    public function test_tracking_codes_find_release_and_receive_documents_across_offices(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $destination = Office::factory()->create();
        $other = Office::factory()->create();
        $document = $this->document($user, $office, ['filing_path' => 'route']);
        $code = $document->tracking_code;
        $this->actingAs($user)->withSession(['current_office_id' => $office->id]);
        $this->getJson(route('documents.office-actions.index', ['action' => 'release', 'q' => strtolower($code)]))->assertJsonCount(1, 'documents')->assertJsonPath('documents.0.trackingCode', $code);
        $this->postJson(route('documents.office-actions.release'), ['tracking_code' => strtolower($code), 'office_id' => $office->id, 'destination_office_id' => $destination->id])->assertOk();
        $this->withSession(['current_office_id' => $other->id])->postJson(route('documents.office-actions.receive'), ['tracking_code' => $code, 'office_id' => $other->id])->assertOk();
        $this->withSession(['current_office_id' => $destination->id])->postJson(route('documents.office-actions.receive'), ['tracking_code' => $code, 'office_id' => $destination->id])->assertNotFound();
        $this->assertSame($other->id, $document->refresh()->office_id);
        $this->assertSame($code, $document->tracking_code);
    }

    /** @param array<string, mixed> $attributes */
    private function document(User $user, Office $office, array $attributes = []): Document
    {
        $type = DocumentType::query()->firstOrCreate(['slug' => 'letter'], ['name' => 'Letter', 'uses_tax_declaration_fields' => false]);

        return app(DocumentWriter::class)->create([
            'office_id' => $office->id, 'document_type_id' => $type->id, 'title' => 'Office memo',
            'original_filename' => 'memo.pdf', 'storage_path' => 'documents/memo.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 1024, 'uploaded_by' => $user->id, 'ocr_status' => 'completed', ...$attributes,
        ]);

    }
}
