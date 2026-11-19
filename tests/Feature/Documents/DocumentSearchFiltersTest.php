<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentSearchFiltersTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{string, string, list<string>}> */
    public static function letterDateRanges(): array
    {
        return [
            'inclusive' => ['2026-07-01', '2026-07-31', ['end.pdf', 'start.pdf']],
            'start only' => ['2026-07-31', '', ['after.pdf', 'end.pdf']],
            'end only' => ['', '2026-07-01', ['start.pdf', 'before.pdf']],
            'single day' => ['2026-07-01', '2026-07-01', ['start.pdf']],
            'no match' => ['2025-01-01', '2025-12-31', []],
        ];
    }

    /** @param list<string> $expected */
    #[DataProvider('letterDateRanges')]
    public function test_letter_date_ranges_are_inclusive_and_use_the_letter_date_by_default(string $from, string $to, array $expected): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->letterType();
        foreach (['before' => '2026-06-30', 'start' => '2026-07-01', 'end' => '2026-07-31', 'after' => '2026-08-01', 'undated' => null] as $name => $date) {
            $this->document(['document_type_id' => $type->id, 'original_filename' => "{$name}.pdf", 'letter_date' => $date]);
        }
        $this->document(['declaration_date' => '2026-07-01']);

        $this->get(route('documents.index', ['letter_date_from' => $from, 'letter_date_to' => $to]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('filters.date_field', 'letter_date')
            ->where('filters.letter_date_from', $from)->where('filters.letter_date_to', $to)
            ->where('documents.total', count($expected))
            ->where('documents.data', fn (Collection $documents): bool => $documents->pluck('originalFilename')->all() === $expected));
    }

    public function test_switching_date_fields_filters_only_the_selected_date_and_preserves_date_added_and_office_scope(): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->letterType();
        $letter = $this->document(['document_type_id' => $type->id, 'letter_date' => '2026-07-10']);
        $declaration = $this->document(['declaration_date' => '2026-07-10']);
        $this->document(['document_type_id' => $type->id, 'letter_date' => '2026-07-10', 'office_id' => Office::factory()->create()->id]);
        $outside = $this->document(['document_type_id' => $type->id, 'letter_date' => '2026-07-10']);
        $outside->forceFill(['created_at' => '2020-01-01 12:00:00'])->save();
        $bounds = ['letter_date_from' => '2026-07-01', 'letter_date_to' => '2026-07-31', 'declaration_date_from' => '2026-07-01', 'declaration_date_to' => '2026-07-31', 'date_added_from' => today()->toDateString(), 'date_added_to' => today()->toDateString(), 'date_timezone' => 'UTC'];

        foreach (['letter_date' => $letter, 'declaration_date' => $declaration] as $field => $match) {
            $this->get(route('documents.index', [...$bounds, 'date_field' => $field]))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('filters.date_field', $field)->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id)
                ->where('filters.'.($field === 'letter_date' ? 'declaration_date_from' : 'letter_date_from'), ''));
        }
    }

    public function test_date_filter_starts_with_date_of_letter_and_legacy_declaration_links_remain_supported(): void
    {
        $this->actingAs(User::factory()->create());
        $this->get(route('documents.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('filters.date_field', 'letter_date'));
        $this->get(route('documents.index', ['declaration_date_from' => '2026-01-01']))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('filters.date_field', 'declaration_date'));
    }

    /** @return array<string, array{array<string, mixed>, string}> */
    public static function invalidLetterDateFilters(): array
    {
        return [
            'invalid field' => [['date_field' => 'created_at'], 'date_field'],
            'field array' => [['date_field' => ['letter_date']], 'date_field'],
            'impossible date' => [['letter_date_from' => '2026-02-30'], 'letter_date_from'],
            'date array' => [['letter_date_to' => ['2026-07-01']], 'letter_date_to'],
            'reversed range' => [['letter_date_from' => '2026-07-31', 'letter_date_to' => '2026-07-01'], 'letter_date_to'],
        ];
    }

    /** @param array<string, mixed> $filters */
    #[DataProvider('invalidLetterDateFilters')]
    public function test_invalid_letter_date_filters_are_rejected(array $filters, string $field): void
    {
        $this->actingAs(User::factory()->create())->get(route('documents.index', $filters))
            ->assertSessionHasErrors($field);
    }

    /** @return array<string, array{string, bool, string, bool}> */
    public static function dateSearches(): array
    {
        return [
            'month name' => ['July', false, 'letter_date', true],
            'month abbreviation' => ['jul', false, 'letter_date', true],
            'punctuated abbreviation' => ['JUL.', false, 'letter_date', true],
            'month and year' => ['July 2026', false, 'letter_date', true],
            'displayed date' => ['July 28, 2026', false, 'letter_date', true],
            'day first' => ['28 Jul 2026', false, 'letter_date', true],
            'ISO date' => ['2026-07-28', false, 'letter_date', true],
            'ISO month' => ['2026-07', false, 'letter_date', true],
            'year' => ['2026', false, 'letter_date', true],
            'incorrect day matching year digits' => ['July 26', false, 'letter_date', false],
            'incorrect year' => ['July 2025', false, 'letter_date', false],
            'incorrect month' => ['June', false, 'letter_date', false],
            'punctuation only' => ['.', false, 'letter_date', false],
            'invalid day' => ['July 32', false, 'letter_date', false],
            'general All search' => ['July', false, 'all', true],
            'tax All search' => ['July', true, 'all', true],
            'tax displayed date' => ['Jul 28, 2026', true, 'all', true],
        ];
    }

    #[DataProvider('dateSearches')]
    public function test_search_understands_month_names_and_preserves_numeric_dates(string $query, bool $tax, string $field, bool $matches): void
    {
        $this->actingAs(User::factory()->create());
        $type = $tax ? DocumentType::taxDeclaration() : $this->letterType();
        $dateField = $tax ? 'declaration_date' : 'letter_date';
        $match = $this->document(['document_type_id' => $type->id, $dateField => '2026-07-28']);
        $this->document(['document_type_id' => $type->id, $dateField => '2025-08-20']);
        $this->document(['document_type_id' => $type->id]);

        $this->get(route('documents.index', ['q' => $query, 'field' => $field, 'type' => $type->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.field', $field)
                ->where('documents.total', $matches ? 1 : 0)
                ->where('documents.data', fn (Collection $data): bool => ! $matches || $data->pluck('id')->all() === [$match->id]));
    }

    /** @return array<string, array{string, string, string}> */
    public static function textSearches(): array
    {
        return [
            'title case and words' => ['title', 'Annual BUDGET Circular', 'budget annual'],
            'correspondent apostrophe' => ['correspondent', "Governor's Office", "governor's office"],
            'remarks' => ['remarks', 'Revision approved', 'revision approved'],
            'OCR content' => ['content', "Lot number 1543\nTumingad", '1543 tumingad'],
            'literal percent' => ['title', 'Budget 50% approved', '50%'],
            'literal underscore' => ['title', 'Reference A_12', 'A_12'],
            'escape character and percent' => ['remarks', 'Note!50% approved', 'Note!50%'],
        ];
    }

    #[DataProvider('textSearches')]
    public function test_each_text_filter_searches_only_its_selected_data(string $field, string $value, string $query): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->letterType();
        $column = $field === 'content' ? 'ocr_text' : $field;
        $match = $this->document(['document_type_id' => $type->id, $column => $value]);
        $otherColumn = $field === 'title' ? 'remarks' : 'title';
        $this->document(['document_type_id' => $type->id, $otherColumn => $value]);
        $this->document(['document_type_id' => $type->id, $column => 'Reference AX12 Budget 500 approved']);

        $this->get(route('documents.index', ['q' => $query, 'field' => $field, 'type' => $type->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.field', $field)
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_all_search_combines_metadata_terms_without_changing_text_to_a_date(): void
    {
        $this->actingAs(User::factory()->create());
        $type = $this->letterType();
        $match = $this->document(['document_type_id' => $type->id, 'title' => 'July budget', 'correspondent' => 'Finance Office']);
        $this->document(['document_type_id' => $type->id, 'letter_date' => '2026-07-28']);
        $this->document(['document_type_id' => $type->id, 'title' => 'July only']);

        $this->get(route('documents.index', ['q' => 'july finance']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_header_search_covers_other_metadata_and_keeps_office_isolation(): void
    {
        $this->actingAs(User::factory()->create());
        $attributes = [
            'document_type_id' => $this->letterType()->id,
            'title' => 'Budget circular',
            'correspondent' => 'Finance Office',
            'remarks' => 'Approved revision',
            'letter_date' => '2026-07-28',
        ];
        $match = $this->document($attributes);
        $this->document([...$attributes, 'office_id' => Office::factory()->create()->id]);

        foreach (['budget circular', 'finance office', 'approved revision', 'July 28, 2026', 'budget finance'] as $query) {
            $this->getJson(route('documents.search', ['q' => $query]))
                ->assertOk()
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.id', $match->id);
        }
    }

    private function letterType(): DocumentType
    {
        return DocumentType::query()->create([
            'name' => 'Letter',
            'slug' => 'letter',
            'uses_tax_declaration_fields' => false,
        ]);
    }

    /** @param array<string, mixed> $attributes */
    private function document(array $attributes): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'search.pdf',
            'storage_path' => 'documents/search.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            ...$attributes,
        ]);
    }
}
