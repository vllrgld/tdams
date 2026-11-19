<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentStatusFilterTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<string> $expected */
    #[DataProvider('statusFilters')]
    public function test_status_filter_matches_non_tax_documents_and_all_keeps_tax_documents(?string $filter, array $expected): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->type();
        $this->document('review', $type->id);
        $this->document('progress', $type->id, ['status' => 'in_progress']);
        $this->document('completed', $type->id, ['status' => 'completed']);
        $this->document('archived', $type->id, ['filing_path' => Document::FILING_ARCHIVE]);
        $this->document('tax', DocumentType::taxDeclaration()->id);

        $this->get(route('documents.index', $filter === null ? [] : ['status' => $filter]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('filters.status', $filter ?? 'all')
            ->where('documents.total', count($expected))
            ->where('documents.data', fn (Collection $documents): bool => $documents->pluck('originalFilename')->sort()->values()->all() === $expected));
    }

    /** @return array<string, array{string|null, list<string>}> */
    public static function statusFilters(): array
    {
        $all = ['archived.pdf', 'completed.pdf', 'progress.pdf', 'review.pdf', 'tax.pdf'];

        return [
            'default' => [null, $all],
            'all' => ['all', $all],
            'under review' => ['under_review', ['review.pdf']],
            'in progress' => ['in_progress', ['progress.pdf']],
            'completed' => ['completed', ['completed.pdf']],
            'archived' => ['archived', ['archived.pdf']],
        ];
    }

    public function test_status_filter_combines_with_type_search_dates_and_ocr_review(): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->type();
        $attributes = ['status' => 'completed', 'title' => 'Alpha request', 'ocr_reviewed_at' => now(), 'created_at' => '2026-07-15 12:00:00'];
        $expected = $this->document('match', $type->id, $attributes);
        $this->document('other-status', $type->id, [...$attributes, 'status' => 'under_review']);
        $this->document('other-title', $type->id, [...$attributes, 'title' => 'Beta request']);
        $this->document('other-date', $type->id, [...$attributes, 'created_at' => '2025-07-15 12:00:00']);
        $this->document('unreviewed', $type->id, [...$attributes, 'ocr_reviewed_at' => null]);
        $otherType = DocumentType::query()->create(['name' => 'Letter', 'slug' => 'letter', 'uses_tax_declaration_fields' => false]);
        $this->document('other-type', $otherType->id, $attributes);

        $this->get(route('documents.index', [
            'status' => 'completed', 'type' => $type->id, 'q' => 'Alpha', 'field' => 'title',
            'date_added_from' => '2026-07-01', 'date_added_to' => '2026-07-31',
            'ocr_review' => 'reviewed', 'direction' => 'asc',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('filters.status', 'completed')
            ->where('documents.total', 1)
            ->where('documents.data.0.id', $expected->id)
            ->where('documents.data.0.status', 'completed'));
    }

    public function test_status_filter_is_applied_before_pagination_and_kept_on_following_pages(): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->type();
        for ($index = 0; $index < 25; $index++) {
            $this->document('completed-'.$index, $type->id, ['status' => 'completed']);
        }
        $this->document('review', $type->id);

        $this->get(route('documents.index', ['status' => 'completed']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)->has('documents.data', 24)
                ->where('documents.last_page', 2)
                ->where('documents.next_page_url', fn ($url): bool => str_contains($url, 'status=completed')));
        $this->get(route('documents.index', ['status' => 'completed', 'page' => 2]))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)->has('documents.data', 1)
                ->where('documents.data.0.originalFilename', 'completed-0.pdf'));
    }

    public function test_tax_type_clears_the_inapplicable_status_filter(): void
    {
        $this->actingAs(User::factory()->create());
        $expected = $this->document('tax', DocumentType::taxDeclaration()->id);
        $this->document('memo', $this->type()->id);

        $this->get($this->taxDocumentsIndex(['status' => 'completed']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.status', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $expected->id));
    }

    public function test_status_filter_cannot_return_documents_from_another_office(): void
    {
        $office = Office::factory()->create();
        $otherOffice = Office::factory()->create();
        $type = $this->type();
        $expected = $this->document('local', $type->id, ['status' => 'completed', 'office_id' => $office->id]);
        $this->document('other-office', $type->id, ['status' => 'completed', 'office_id' => $otherOffice->id]);

        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id])
            ->get(route('documents.index', ['status' => 'completed']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 1)->where('documents.data.0.id', $expected->id));
    }

    public function test_saved_status_moves_the_document_between_filtered_results(): void
    {
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $document = $this->document('memo', $this->type()->id, ['office_id' => $office->id]);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->get(route('documents.index', ['status' => 'under_review']))
            ->assertInertia(fn (Assert $page) => $page->where('documents.total', 1));

        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])->assertOk();

        $this->get(route('documents.index', ['status' => 'under_review']))
            ->assertInertia(fn (Assert $page) => $page->where('documents.total', 0));
        $this->get(route('documents.index', ['status' => 'approved']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.data.0.id', $document->id)
                ->where('documents.data.0.status', 'approved'));
    }

    #[DataProvider('invalidFilters')]
    public function test_invalid_status_filters_are_rejected(mixed $filter): void
    {
        $this->actingAs(User::factory()->create())->getJson(route('documents.index', ['status' => $filter]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status' => 'Choose an available document status.']);
    }

    public function test_approved_and_disapproved_documents_can_be_filtered_separately(): void
    {
        $type = $this->type();
        $approved = $this->document('approved', $type->id, ['status' => 'approved']);
        $disapproved = $this->document('disapproved', $type->id, ['status' => 'disapproved']);
        $this->actingAs(User::factory()->create());

        $this->get(route('documents.index', ['status' => 'approved']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('documents.total', 1)->where('documents.data.0.id', $approved->id));
        $this->get(route('documents.index', ['status' => 'disapproved']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('documents.total', 1)->where('documents.data.0.id', $disapproved->id));
    }

    /** @return array<string, array{mixed}> */
    public static function invalidFilters(): array
    {
        return ['unknown status' => ['invented'], 'array' => [['completed']]];
    }

    private function type(): DocumentType
    {
        return DocumentType::query()->create(['name' => 'Memorandum', 'slug' => 'memorandum', 'uses_tax_declaration_fields' => false]);
    }

    /** @param array<string, mixed> $attributes */
    private function document(string $name, int $typeId, array $attributes = []): Document
    {
        $document = app(DocumentWriter::class)->create([
            'original_filename' => $name.'.pdf', 'storage_path' => 'documents/'.$name.'.pdf',
            'document_type_id' => $typeId, 'mime_type' => 'application/pdf', 'file_size' => 8,
            'ocr_status' => 'completed', 'ocr_text' => 'OCR text', ...$attributes,
            'filing_path' => $attributes['filing_path'] ?? Document::FILING_ROUTE,
        ]);

        $document->forceFill(Arr::only($attributes, ['created_at', 'ocr_reviewed_at']))->saveQuietly();

        return $document;
    }
}
