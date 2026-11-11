<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentOcrEditor;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OcrReviewFilterTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('reviewFilters')]
    public function test_ocr_review_filter_matches_the_displayed_review_status(?string $filter, array $expected): void
    {
        $this->actingAs(User::factory()->create());
        $this->document('reviewed', 'completed', true);
        $this->document('not-reviewed', 'completed');
        $this->document('pending', 'pending');
        $this->document('failed', 'failed');
        $this->document('old-review', 'processing', true);

        $this->get(route('documents.index', $filter === null ? [] : ['ocr_review' => $filter, 'direction' => 'asc']))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('filters.ocr_review', $filter ?? 'all')
            ->where('documents.total', count($expected))
            ->where('documents.data', fn ($documents): bool => collect($documents)->pluck('originalFilename')->sort()->values()->all() === $expected));
    }

    /** @return array<string, array{string|null, list<string>}> */
    public static function reviewFilters(): array
    {
        $all = ['failed.pdf', 'not-reviewed.pdf', 'old-review.pdf', 'pending.pdf', 'reviewed.pdf'];

        return [
            'default' => [null, $all],
            'all' => ['all', $all],
            'reviewed' => ['reviewed', ['reviewed.pdf']],
            'not reviewed' => ['unreviewed', ['failed.pdf', 'not-reviewed.pdf', 'old-review.pdf', 'pending.pdf']],
        ];
    }

    public function test_review_filter_combines_with_search_and_dates_without_leaking_other_matches(): void
    {
        $this->actingAs(User::factory()->create());
        $matching = ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2024-07-23'];
        $expected = $this->document('match', 'completed', false, $matching);
        $this->document('reviewed', 'completed', true, $matching);
        $this->document('other-owner', 'completed', false, [...$matching, 'registered_owner' => 'Beta Owner']);
        $this->document('other-date', 'completed', false, [...$matching, 'declaration_date' => '2020-01-01']);
        $this->document('failed-other-owner', 'failed', true, [...$matching, 'registered_owner' => 'Beta Owner']);

        $this->get(route('documents.index', [
            'q' => 'Alpha', 'field' => 'registered_owner', 'ocr_review' => 'unreviewed',
            'declaration_date_from' => '2024-01-01', 'declaration_date_to' => '2024-12-31',
            'sort' => 'declaration_date', 'direction' => 'asc',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('documents.total', 1)->where('documents.data.0.id', $expected->id)
            ->where('filters.ocr_review', 'unreviewed')->where('filters.sort', 'declaration_date')
            ->where('filters.q', 'Alpha')->where('filters.declaration_date_from', '2024-01-01'));
    }

    public function test_filtering_happens_before_pagination_and_pagination_keeps_the_filter(): void
    {
        $this->actingAs(User::factory()->create());
        for ($index = 0; $index < 25; $index++) {
            $this->document('reviewed-'.$index, 'completed', true);
        }
        $this->document('not-reviewed', 'completed');

        $this->get(route('documents.index', ['ocr_review' => 'reviewed']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)->has('documents.data', 24)
                ->where('documents.last_page', 2)
                ->where('documents.next_page_url', fn ($url): bool => str_contains($url, 'ocr_review=reviewed')));
        $this->get(route('documents.index', ['ocr_review' => 'reviewed', 'page' => 2]))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)->has('documents.data', 1)
                ->where('documents.data.0.originalFilename', 'reviewed-0.pdf'));
    }

    public function test_reviewing_a_document_moves_it_between_the_filtered_results(): void
    {
        $document = $this->document('sample', 'completed');
        $this->actingAs(User::factory()->create());
        $this->get(route('documents.index', ['ocr_review' => 'unreviewed']))->assertInertia(fn (Assert $page) => $page->where('documents.total', 1));

        $this->patchJson(route('documents.ocr.review', $document), [
            'reviewed' => true, 'revision' => DocumentOcrEditor::revision($document),
        ])->assertOk();

        $this->get(route('documents.index', ['ocr_review' => 'unreviewed']))->assertInertia(fn (Assert $page) => $page->where('documents.total', 0));
        $this->get(route('documents.index', ['ocr_review' => 'reviewed']))->assertInertia(fn (Assert $page) => $page->where('documents.data.0.id', $document->id));
        $this->get(route('documents.index'))->assertInertia(fn (Assert $page) => $page->where('filters.ocr_review', 'all')->where('documents.total', 1));
    }

    #[DataProvider('invalidFilters')]
    public function test_invalid_review_filters_are_rejected(mixed $filter): void
    {
        $this->actingAs(User::factory()->create())->getJson(route('documents.index', ['ocr_review' => $filter]))
            ->assertUnprocessable()->assertJsonValidationErrors('ocr_review');
    }

    /** @return array<string, array{mixed}> */
    public static function invalidFilters(): array
    {
        return ['unknown value' => ['verified'], 'array' => [['reviewed']]];
    }

    /** @param array<string, mixed> $fields */
    private function document(string $name, string $status, bool $reviewed = false, array $fields = []): Document
    {
        $document = app(DocumentWriter::class)->create([
            'original_filename' => $name.'.pdf', 'storage_path' => 'documents/'.$name.'.pdf',
            'mime_type' => 'application/pdf', 'file_size' => 8, 'ocr_status' => $status, 'ocr_text' => 'OCR text',
            ...$fields,
        ]);
        if ($reviewed) {
            $document->forceFill(['ocr_reviewed_at' => now()])->saveQuietly();
        }

        return $document;
    }
}
