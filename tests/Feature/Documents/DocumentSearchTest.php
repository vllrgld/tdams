<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentSearchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: mixed, 2: string}>
     */
    public static function searchableFieldProvider(): array
    {
        return [
            'tax_declaration_number' => ['tax_declaration_number', 'TD-SRCH-00481', 'TD-SRCH'],
            'declaration_date' => ['declaration_date', '2018-04-21', '2018-04-21'],
            'lot_number' => ['lot_number', 'LOT-SRCH-99', 'LOT-SRCH'],
            'registered_owner' => ['registered_owner', 'Unique Owner Name', 'Unique Owner'],
            'municipality' => ['municipality', 'Searchville', 'Searchville'],
            'barangay' => ['barangay', 'Barangay Search', 'Barangay Search'],
            'title_number' => ['title_number', 'T-SRCH-55', 'T-SRCH'],
            'property_location_street' => ['property_location_street', 'Search Street', 'Search Street'],
            'property_location_barangay' => ['property_location_barangay', 'Prop Brgy Unique', 'Prop Brgy'],
            'property_location_district' => ['property_location_district', 'District Search', 'District Search'],
            'property_location_municipality' => ['property_location_municipality', 'Prop Municipality Unique', 'Prop Municipality'],
            'owner_address_street' => ['owner_address_street', 'Owner Search Ave', 'Owner Search'],
            'owner_address_barangay' => ['owner_address_barangay', 'Owner Brgy Unique', 'Owner Brgy Unique'],
            'owner_address_district' => ['owner_address_district', 'Owner District Unique', 'Owner District'],
            'owner_address_city_municipality' => ['owner_address_city_municipality', 'Owner City Unique', 'Owner City'],
            'province' => ['province', 'Search Province', 'Search Province'],
            'boundary_north' => ['boundary_north', 'North Marker Unique', 'North Marker'],
            'boundary_northeast' => ['boundary_northeast', 'Northeast Marker Unique', 'Northeast Marker'],
            'boundary_east' => ['boundary_east', 'East Marker Unique', 'East Marker'],
            'boundary_southeast' => ['boundary_southeast', 'Southeast Marker Unique', 'Southeast Marker'],
            'boundary_south' => ['boundary_south', 'South Marker Unique', 'South Marker'],
            'boundary_southwest' => ['boundary_southwest', 'Southwest Marker Unique', 'Southwest Marker'],
            'boundary_west' => ['boundary_west', 'West Marker Unique', 'West Marker'],
            'boundary_northwest' => ['boundary_northwest', 'Northwest Marker Unique', 'Northwest Marker'],
            'area' => ['area', '4321.2500', '4321.25'],
            'remarks' => ['remarks', 'Confidential survey note unique', 'Confidential survey'],
        ];
    }

    public function test_every_searchable_column_is_covered_by_the_field_provider(): void
    {
        $this->assertSame(
            Document::SEARCHABLE_COLUMNS,
            array_keys(self::searchableFieldProvider()),
        );
        $this->assertNotContains('pin', Document::SEARCHABLE_COLUMNS);
        $this->assertNotContains('previous_tax_declaration_number', Document::SEARCHABLE_COLUMNS);
        $this->assertNotContains('original_filename', Document::SEARCHABLE_COLUMNS);
        $this->assertNotContains('mime_type', Document::SEARCHABLE_COLUMNS);
        $this->assertSame(array_keys(Document::SEARCH_FIELDS), array_column(Document::searchFieldOptions(), 'value'));
        $this->assertSame(array_keys(Document::SEARCH_FIELDS), array_keys(Document::SEARCH_FIELD_LABELS));

        foreach (Document::SEARCH_FIELDS as $field => $columns) {
            if ($columns === null) {
                continue;
            }

            foreach ($columns as $column) {
                if ($field === 'content') {
                    $this->assertSame('ocr_text', $column);

                    continue;
                }

                $this->assertContains($column, Document::SEARCHABLE_COLUMNS);
            }
        }
    }

    #[DataProvider('searchableFieldProvider')]
    public function test_search_matches_a_document_on_each_available_field(string $column, mixed $value, string $query): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            $column => $value,
            'tax_declaration_number' => $column === 'tax_declaration_number' ? $value : 'TD-OTHER-0001',
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0002',
            'registered_owner' => 'Unrelated Owner',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => $query]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', $query)
                ->where('filters.field', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_search_does_not_match_pin_values(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0001',
            'pin' => '999-11-222-333',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => '999-11-222']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('documents.total', 0)
                ->has('documents.data', 0));
    }

    public function test_search_does_not_match_previous_declaration_or_filename(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0001',
            'previous_tax_declaration_number' => 'TD-PREV-888',
            'original_filename' => 'unique-scan-file.pdf',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'TD-PREV-888']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('documents.total', 0));

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'unique-scan-file']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('documents.total', 0));
    }

    public function test_search_can_be_limited_to_a_selected_field(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'registered_owner' => 'Alpha Owner',
            'lot_number' => 'LOT-A',
        ]);
        $this->makeDocument($user, [
            'registered_owner' => 'Beta Owner',
            'remarks' => 'Alpha Owner mentioned in remarks',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha',
                'field' => 'registered_owner',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', 'Alpha')
                ->where('filters.field', 'registered_owner')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id)
                ->where('searchFields.0.value', 'all')
                ->where('searchFields.0.label', 'All')
                ->where('searchFields.1.label', 'Tax declaration')
                ->where('searchFields.2.label', 'Owner'));
    }

    public function test_property_location_search_covers_grouped_location_columns(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'property_location_street' => 'Unique Location Street',
        ]);
        $this->makeDocument($user, [
            'owner_address_street' => 'Unique Location Street',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Unique Location',
                'field' => 'property_location',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.field', 'property_location')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_location_search_includes_province(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'province' => 'Ilocos Norte Unique',
        ]);
        $this->makeDocument($user, [
            'owner_address_city_municipality' => 'Ilocos Norte Unique',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Ilocos Norte Unique',
                'field' => 'property_location',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.field', 'property_location')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_invalid_search_field_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha',
                'field' => 'pin',
            ]))
            ->assertSessionHasErrors('field');
    }

    public function test_search_requires_every_term_to_match_the_same_document(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'registered_owner' => 'Alpha Owner',
            'lot_number' => 'LOT-Z',
        ]);
        $this->makeDocument($user, [
            'registered_owner' => 'Alpha Owner',
            'lot_number' => 'LOT-A',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'Alpha LOT-Z']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', 'Alpha LOT-Z')
                ->where('filters.field', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_content_search_matches_ocr_text_and_ignores_metadata_only_documents(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0001',
            'ocr_status' => 'completed',
            'ocr_text' => "Owner\fHidden mineral rights unique phrase",
            'ocr_pages' => ['Owner', 'Hidden mineral rights unique phrase'],
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0002',
            'registered_owner' => 'Hidden mineral rights unique phrase',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'mineral rights unique',
                'field' => 'content',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', 'mineral rights unique')
                ->where('filters.field', 'content')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id)
                ->where('searchFields.6.value', 'content')
                ->where('searchFields.6.label', 'Content'));
    }

    public function test_all_search_matches_a_phrase_that_exists_only_in_ocr_text(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0001',
            'ocr_status' => 'completed',
            'ocr_text' => 'Unindexed cadastral monument unique',
        ]);
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-OTHER-0002',
            'remarks' => 'Unrelated remarks',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'cadastral monument unique']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', 'cadastral monument unique')
                ->where('filters.field', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_search_returns_an_empty_result_when_nothing_matches(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'tax_declaration_number' => 'TD-2026-00481',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'no-such-document']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', 'no-such-document')
                ->where('filters.field', 'all')
                ->where('documents.total', 0)
                ->has('documents.data', 0));
    }

    public function test_blank_search_returns_the_full_archive(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, ['tax_declaration_number' => 'TD-ONE']);
        $this->makeDocument($user, ['tax_declaration_number' => 'TD-TWO']);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => '   ']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', '')
                ->where('filters.field', 'all')
                ->where('documents.total', 2));
    }

    public function test_guests_cannot_search_documents(): void
    {
        $this->get(route('documents.index', ['q' => 'TD']))
            ->assertRedirect(route('login'));
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: list<string>}>
     */
    public static function declarationDateRangeProvider(): array
    {
        return [
            'inclusive range' => ['2024-01-01', '2024-12-31', ['end.pdf', 'middle.pdf', 'start.pdf']],
            'start only' => ['2024-12-31', '', ['after.pdf', 'end.pdf']],
            'end only' => ['', '2024-01-01', ['start.pdf', 'before.pdf']],
            'single day' => ['2024-06-15', '2024-06-15', ['middle.pdf']],
            'no matches' => ['2020-01-01', '2020-12-31', []],
            'cleared range includes undated documents' => ['', '', ['undated.pdf', 'after.pdf', 'end.pdf', 'middle.pdf', 'start.pdf', 'before.pdf']],
        ];
    }

    #[DataProvider('declarationDateRangeProvider')]
    public function test_declaration_date_filters_use_inclusive_bounds_and_allow_open_ranges(string $from, string $to, array $filenames): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        foreach ([
            'before' => '2023-12-31',
            'start' => '2024-01-01',
            'middle' => '2024-06-15',
            'end' => '2024-12-31',
            'after' => '2025-01-01',
            'undated' => null,
        ] as $name => $date) {
            $this->makeDocument($user, ['original_filename' => $name.'.pdf', 'declaration_date' => $date]);
        }

        $this->actingAs($user)
            ->get(route('documents.index', ['declaration_date_from' => $from, 'declaration_date_to' => $to]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.declaration_date_from', $from)
                ->where('filters.declaration_date_to', $to)
                ->where('documents.total', count($filenames))
                ->where('documents.data', fn ($data): bool => collect($data)->pluck('originalFilename')->all() === $filenames));
    }

    public function test_declaration_date_range_combines_with_the_selected_search_field(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2024-06-15']);
        $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2023-06-15']);
        $this->makeDocument($user, ['registered_owner' => 'Beta Owner', 'declaration_date' => '2024-06-15']);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha', 'field' => 'registered_owner',
                'declaration_date_from' => '2024-01-01', 'declaration_date_to' => '2024-12-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.q', 'Alpha')
                ->where('filters.field', 'registered_owner')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: string, 3: list<string>}>
     */
    public static function dateAddedRangeProvider(): array
    {
        return [
            'Manila whole day' => ['2024-06-15', '2024-06-15', 'Asia/Manila', ['end.pdf', 'middle.pdf', 'start.pdf']],
            'start only' => ['2024-06-15', '', 'Asia/Manila', ['after.pdf', 'end.pdf', 'middle.pdf', 'start.pdf']],
            'end only' => ['', '2024-06-15', 'Asia/Manila', ['end.pdf', 'middle.pdf', 'start.pdf', 'before.pdf']],
            'UTC whole day' => ['2024-06-15', '2024-06-15', 'UTC', ['after.pdf', 'end.pdf', 'middle.pdf']],
            'no matches' => ['2024-06-01', '2024-06-01', 'Asia/Manila', []],
            'cleared dates' => ['', '', 'Asia/Manila', ['after.pdf', 'end.pdf', 'middle.pdf', 'start.pdf', 'before.pdf']],
        ];
    }

    #[DataProvider('dateAddedRangeProvider')]
    public function test_date_added_filters_include_the_whole_local_day_and_allow_open_ranges(string $from, string $to, string $timezone, array $filenames): void
    {
        $user = User::factory()->create();
        foreach ([
            'before' => '2024-06-14 15:59:59',
            'start' => '2024-06-14 16:00:00',
            'middle' => '2024-06-15 04:00:00',
            'end' => '2024-06-15 15:59:59',
            'after' => '2024-06-15 16:00:00',
        ] as $name => $timestamp) {
            $this->makeDocument($user, ['original_filename' => $name.'.pdf', 'created_at' => $timestamp]);
        }

        $this->actingAs($user)
            ->get(route('documents.index', ['date_added_from' => $from, 'date_added_to' => $to, 'date_timezone' => $timezone]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.date_added_from', $from)
                ->where('filters.date_added_to', $to)
                ->where('filters.date_timezone', $timezone)
                ->where('documents.total', count($filenames))
                ->where('documents.data', fn ($data): bool => collect($data)->pluck('originalFilename')->all() === $filenames));
    }

    public function test_both_date_ranges_and_text_search_must_match_the_same_document(): void
    {
        $user = User::factory()->create();
        $match = $this->makeDocument($user, [
            'registered_owner' => 'Alpha Owner', 'declaration_date' => '1990-06-15', 'created_at' => '2024-06-15 04:00:00',
        ]);
        $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '1991-06-15', 'created_at' => '2024-06-15 04:00:00']);
        $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '1990-06-15', 'created_at' => '2023-06-15 04:00:00']);
        $this->makeDocument($user, ['registered_owner' => 'Beta Owner', 'declaration_date' => '1990-06-15', 'created_at' => '2024-06-15 04:00:00']);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha', 'field' => 'registered_owner',
                'declaration_date_from' => '1990-01-01', 'declaration_date_to' => '1990-12-31',
                'date_added_from' => '2024-06-15', 'date_added_to' => '2024-06-15', 'date_timezone' => 'Asia/Manila',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $match->id));
    }

    public function test_date_filter_is_applied_before_pagination_and_preserved_in_page_links(): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        $first = $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2024-06-15']);
        $last = $first;
        for ($index = 0; $index < 24; $index++) {
            $last = $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2024-06-15']);
        }
        $this->makeDocument($user, ['registered_owner' => 'Alpha Owner', 'declaration_date' => '2023-06-15']);

        $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha', 'field' => 'registered_owner',
                'direction' => 'asc', 'sort' => 'declaration_date',
                'declaration_date_from' => '2024-01-01', 'declaration_date_to' => '2024-12-31',
                'date_added_from' => today()->toDateString(), 'date_added_to' => today()->toDateString(), 'date_timezone' => 'UTC',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)
                ->where('documents.per_page', 24)
                ->where('documents.current_page', 1)
                ->where('documents.last_page', 2)
                ->has('documents.data', 24));

        $response = $this->actingAs($user)
            ->get(route('documents.index', [
                'q' => 'Alpha', 'field' => 'registered_owner', 'page' => 2,
                'direction' => 'asc', 'sort' => 'declaration_date',
                'declaration_date_from' => '2024-01-01', 'declaration_date_to' => '2024-12-31',
                'date_added_from' => today()->toDateString(), 'date_added_to' => today()->toDateString(), 'date_timezone' => 'UTC',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)
                ->where('documents.current_page', 2)
                ->has('documents.data', 1)
                ->where('documents.data.0.id', $last->id));

        parse_str((string) parse_url($response->inertiaProps('documents.prev_page_url'), PHP_URL_QUERY), $query);
        $this->assertSame([
            'q' => 'Alpha', 'field' => 'registered_owner',
            'direction' => 'asc', 'sort' => 'declaration_date',
            'declaration_date_from' => '2024-01-01', 'declaration_date_to' => '2024-12-31',
            'date_added_from' => today()->toDateString(), 'date_added_to' => today()->toDateString(), 'date_timezone' => 'UTC',
            'page' => '1',
        ], $query);
    }

    /**
     * @return array<string, array{0: array<string, mixed>, 1: string, 2: string}>
     */
    public static function invalidDateFilterProvider(): array
    {
        return [
            'impossible start date' => [['declaration_date_from' => '2024-02-30'], 'declaration_date_from', 'Enter a valid declaration start date in YYYY-MM-DD format.'],
            'malformed end date' => [['declaration_date_to' => '12/31/2024'], 'declaration_date_to', 'Enter a valid declaration end date in YYYY-MM-DD format.'],
            'relative start date' => [['declaration_date_from' => 'yesterday'], 'declaration_date_from', 'Enter a valid declaration start date in YYYY-MM-DD format.'],
            'timestamp instead of date' => [['declaration_date_to' => '2024-12-31T12:00:00Z'], 'declaration_date_to', 'Enter a valid declaration end date in YYYY-MM-DD format.'],
            'array instead of date' => [['declaration_date_from' => ['2024-01-01']], 'declaration_date_from', 'Enter a valid declaration start date in YYYY-MM-DD format.'],
            'reversed range' => [['declaration_date_from' => '2024-12-31', 'declaration_date_to' => '2024-01-01'], 'declaration_date_to', 'The end date must be on or after the start date.'],
            'invalid date added start' => [['date_added_from' => '2024-02-30'], 'date_added_from', 'Enter a valid date added start date in YYYY-MM-DD format.'],
            'invalid date added end' => [['date_added_to' => 'yesterday'], 'date_added_to', 'Enter a valid date added end date in YYYY-MM-DD format.'],
            'date added array' => [['date_added_from' => ['2024-01-01']], 'date_added_from', 'Enter a valid date added start date in YYYY-MM-DD format.'],
            'reversed date added range' => [['date_added_from' => '2024-12-31', 'date_added_to' => '2024-01-01'], 'date_added_to', 'The date added end date must be on or after the start date.'],
            'invalid timezone' => [['date_timezone' => 'Invalid/Timezone'], 'date_timezone', 'Choose a valid timezone for the date added filter.'],
            'timezone array' => [['date_timezone' => ['UTC']], 'date_timezone', 'Choose a valid timezone for the date added filter.'],
        ];
    }

    #[DataProvider('invalidDateFilterProvider')]
    public function test_invalid_date_filters_are_rejected(array $filters, string $field, string $message): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('documents.index', $filters))
            ->assertSessionHasErrors([$field => $message]);
    }

    public function test_document_previews_include_readable_ocr_text_without_the_full_ocr_payload(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'ocr_text' => "  Tax declaration\n\nOwner\tName\fLot 12  ",
            'ocr_status' => 'completed',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.data.0.ocrTextExcerpt', 'Tax declaration Owner Name Lot 12')
                ->missing('documents.data.0.ocr_text')
                ->missing('documents.data.0.ocr_pages')
                ->missing('documents.data.0.ocr_regions'));
    }

    public function test_document_preview_ocr_text_is_limited_to_a_short_excerpt(): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, [
            'ocr_text' => str_repeat('a', 600).'Omitted text at the end',
            'ocr_status' => 'completed',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.data.0.ocrTextExcerpt', str_repeat('a', 600).'...'));
    }

    /** @return array<string, array{0: string|null}> */
    public static function unavailableOcrTextProvider(): array
    {
        return [
            'not processed' => [null],
            'blank OCR result' => [" \n\t\f "],
        ];
    }

    #[DataProvider('unavailableOcrTextProvider')]
    public function test_document_previews_have_no_excerpt_when_ocr_text_is_unavailable(?string $text): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, ['ocr_text' => $text]);

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.data.0.ocrTextExcerpt', null));
    }

    /** @return array<string, array{0: string, 1: list<string>}> */
    public static function sortDirectionProvider(): array
    {
        return [
            'ascending' => ['asc', ['old.pdf', 'new.pdf', 'tie.pdf']],
            'descending' => ['desc', ['tie.pdf', 'new.pdf', 'old.pdf']],
        ];
    }

    /** @param list<string> $filenames */
    #[DataProvider('sortDirectionProvider')]
    public function test_documents_sort_by_date_added_with_a_stable_order_for_equal_times(string $direction, array $filenames): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, ['original_filename' => 'new.pdf', 'created_at' => '2026-02-02 12:00:00']);
        $this->makeDocument($user, ['original_filename' => 'old.pdf', 'created_at' => '2026-02-01 12:00:00']);
        $this->makeDocument($user, ['original_filename' => 'tie.pdf', 'created_at' => '2026-02-02 12:00:00']);

        $this->actingAs($user)
            ->get(route('documents.index', ['direction' => $direction]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.direction', $direction)
                ->where('documents.total', 3)
                ->where('documents.data', fn ($data): bool => collect($data)->pluck('originalFilename')->all() === $filenames));
    }

    /** @return array<string, array{0: string, 1: list<string>}> */
    public static function declarationSortProvider(): array
    {
        return [
            'ascending, missing dates last' => ['asc', ['early.pdf', 'late.pdf', 'undated.pdf', 'unlinked.pdf']],
            'descending, missing dates last' => ['desc', ['late.pdf', 'early.pdf', 'unlinked.pdf', 'undated.pdf']],
        ];
    }

    /** @param list<string> $filenames */
    #[DataProvider('declarationSortProvider')]
    public function test_documents_sort_by_declaration_date_with_missing_dates_last(string $direction, array $filenames): void
    {
        $user = User::factory()->create();
        $this->makeDocument($user, ['original_filename' => 'early.pdf', 'declaration_date' => '2020-01-01', 'created_at' => '2026-02-02 12:00:00']);
        $this->makeDocument($user, ['original_filename' => 'late.pdf', 'declaration_date' => '2025-01-01', 'created_at' => '2026-02-01 12:00:00']);
        $this->makeDocument($user, ['original_filename' => 'undated.pdf', 'registered_owner' => 'Undated Owner']);
        $this->makeDocument($user, ['original_filename' => 'unlinked.pdf']);

        $this->actingAs($user)
            ->get(route('documents.index', ['sort' => 'declaration_date', 'direction' => $direction]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.sort', 'declaration_date')
                ->where('filters.direction', $direction)
                ->where('documents.total', 4)
                ->where('documents.data', fn ($data): bool => collect($data)->pluck('originalFilename')->all() === $filenames));
    }

    /** @return array<string, array{0: array<string, mixed>, 1: string, 2: string}> */
    public static function invalidSortProvider(): array
    {
        return [
            'unknown direction' => [['direction' => 'sideways'], 'direction', 'Choose ascending or descending order.'],
            'SQL direction expression' => [['direction' => 'asc; DROP TABLE documents'], 'direction', 'Choose ascending or descending order.'],
            'array instead of direction' => [['direction' => ['asc']], 'direction', 'Choose ascending or descending order.'],
            'unknown field' => [['sort' => 'registered_owner'], 'sort', 'Choose date added or declaration date.'],
            'SQL sort expression' => [['sort' => 'created_at; DROP TABLE documents'], 'sort', 'Choose date added or declaration date.'],
            'array instead of field' => [['sort' => ['created_at']], 'sort', 'Choose date added or declaration date.'],
        ];
    }

    /** @param array<string, mixed> $filters */
    #[DataProvider('invalidSortProvider')]
    public function test_invalid_sort_options_are_rejected(array $filters, string $field, string $message): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('documents.index', $filters))
            ->assertSessionHasErrors([$field => $message]);
    }

    public function test_documents_with_equal_upload_times_have_a_stable_order(): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        $first = $this->makeDocument($user, ['tax_declaration_number' => 'TD-ORDER-1']);
        $second = $this->makeDocument($user, ['tax_declaration_number' => 'TD-ORDER-2']);

        $this->actingAs($user)
            ->get(route('documents.index', ['q' => 'TD-ORDER']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.data.0.id', $second->id)
                ->where('documents.data.1.id', $first->id)
                ->where('filters.direction', 'desc')
                ->where('filters.sort', 'created_at')
                ->where('documents.total', 2));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makeDocument(User $user, array $attributes = []): Document
    {
        static $count = 0;
        $count++;

        $document = app(DocumentWriter::class)->create([
            'original_filename' => "scan-{$count}.pdf",
            'storage_path' => "documents/scan-{$count}.pdf",
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            ...$attributes,
        ]);

        if (array_key_exists('created_at', $attributes)) {
            $document->forceFill(['created_at' => $attributes['created_at']])->saveQuietly();
        }

        return $document;
    }
}
