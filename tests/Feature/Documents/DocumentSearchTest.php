<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
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
            'boundary_south' => ['boundary_south', 'South Marker Unique', 'South Marker'],
            'boundary_east' => ['boundary_east', 'East Marker Unique', 'East Marker'],
            'boundary_west' => ['boundary_west', 'West Marker Unique', 'West Marker'],
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

        foreach (Document::SEARCH_FIELDS as $columns) {
            if ($columns === null) {
                continue;
            }

            foreach ($columns as $column) {
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
     * @param  array<string, mixed>  $attributes
     */
    private function makeDocument(User $user, array $attributes = []): Document
    {
        static $count = 0;
        $count++;

        return Document::query()->create([
            'original_filename' => "scan-{$count}.pdf",
            'storage_path' => "documents/scan-{$count}.pdf",
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            ...$attributes,
        ]);
    }
}
