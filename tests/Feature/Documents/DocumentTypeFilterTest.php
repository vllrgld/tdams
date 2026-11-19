<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentTypeFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_type_filter_returns_only_documents_of_the_selected_type(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');
        $this->document('tax');
        $expected = $this->document('memo', $memo->id);

        $this->get(route('documents.index', ['type' => $memo->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', (string) $memo->id)
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $expected->id));
    }

    public function test_all_types_includes_tax_declarations_and_defaults_to_other_search_fields(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');
        $this->document('tax');
        $this->document('memo', $memo->id);
        $tax = DocumentType::taxDeclaration();

        foreach ([[], ['type' => 'all']] as $query) {
            $this->get(route('documents.index', $query))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('filters.type', 'all')
                    ->where('filters.search_mode', 'all')
                    ->where('documents.total', 2)
                    ->where('searchFields', [
                        ['value' => 'all', 'label' => 'All'],
                        ['value' => 'correspondent', 'label' => 'Correspondent'],
                        ['value' => 'title', 'label' => 'Title'],
                        ['value' => 'letter_date', 'label' => 'Date of letter'],
                        ['value' => 'remarks', 'label' => 'Remarks'],
                        ['value' => 'content', 'label' => 'Content'],
                    ])
                    ->where('documentTypes', fn ($types): bool => collect($types)->firstWhere('id', $memo->id)['documentCount'] === 1
                        && collect($types)->firstWhere('id', $tax->id)['documentCount'] === 1));
        }
    }

    public function test_tax_search_mode_keeps_every_type_and_uses_tax_search_fields(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');
        $this->document('tax');
        $this->document('memo', $memo->id);

        $this->get(route('documents.index', ['search_mode' => 'tax']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', 'all')
                ->where('filters.search_mode', 'tax')
                ->where('documents.total', 2)
                ->where('searchFields.1.label', 'Tax declaration'));
    }

    public function test_tax_type_filter_returns_tax_declarations_and_tax_search_fields(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');
        $expected = $this->document('tax');
        $this->document('memo', $memo->id);
        $tax = DocumentType::taxDeclaration();

        $this->get(route('documents.index', ['type' => $tax->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', (string) $tax->id)
                ->where('filters.search_mode', 'tax')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $expected->id)
                ->where('searchFields.1.label', 'Tax declaration'));
    }

    public function test_a_non_tax_type_exposes_only_its_own_search_fields(): void
    {
        $this->actingAs(User::factory()->create());
        $application = $this->type('Application', 'application');
        $expected = $this->document('app', $application->id);

        $this->get(route('documents.index', ['type' => $application->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', (string) $application->id)
                ->where('filters.search_mode', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $expected->id)
                ->where('searchFields', [
                    ['value' => 'all', 'label' => 'All'],
                    ['value' => 'correspondent', 'label' => 'Correspondent'],
                    ['value' => 'title', 'label' => 'Title'],
                    ['value' => 'letter_date', 'label' => 'Date of letter'],
                    ['value' => 'remarks', 'label' => 'Remarks'],
                    ['value' => 'content', 'label' => 'Content'],
                ]));
    }

    public function test_type_filter_combines_with_search_without_returning_other_types(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');
        $this->document('tax', null, 'Alpha shared');
        $expected = $this->document('memo', $memo->id, 'Alpha shared');
        $this->document('other-memo', $memo->id, 'Beta only');

        $this->get(route('documents.index', ['q' => 'Alpha', 'type' => $memo->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 1)
                ->where('documents.data.0.id', $expected->id)
                ->where('filters.type', (string) $memo->id)
                ->where('filters.q', 'Alpha'));
    }

    public function test_type_filter_is_applied_before_pagination_and_pagination_keeps_the_type(): void
    {
        $this->actingAs(User::factory()->create());
        $memo = $this->type('Memorandum', 'memorandum');

        for ($index = 0; $index < 25; $index++) {
            $this->document('memo-'.$index, $memo->id);
        }

        $this->document('tax');

        $this->get(route('documents.index', ['type' => $memo->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('documents.total', 25)
                ->has('documents.data', 24)
                ->where('documents.last_page', 2)
                ->where('documents.next_page_url', fn (mixed $url): bool => is_string($url) && str_contains($url, 'type='.$memo->id)));
    }

    public function test_invalid_search_mode_returns_422(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('documents.index', ['search_mode' => 'owners']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['search_mode' => 'Choose all or tax search fields.']);
    }

    #[DataProvider('invalidTypes')]
    public function test_invalid_type_filter_returns_422(mixed $type): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('documents.index', ['type' => $type]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type' => 'Choose a document type.']);
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function invalidTypes(): array
    {
        return [
            'unknown id' => [999999],
            'name' => ['memorandum'],
        ];
    }

    private function type(string $name, string $slug): DocumentType
    {
        return DocumentType::query()->create([
            'name' => $name,
            'slug' => $slug,
            'uses_tax_declaration_fields' => false,
        ]);
    }

    private function document(string $name, ?int $typeId = null, string $ocrText = 'OCR text'): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => $name.'.pdf',
            'storage_path' => 'documents/'.$name.'.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'ocr_status' => 'completed',
            'ocr_text' => $ocrText,
            ...($typeId === null ? [] : ['document_type_id' => $typeId]),
        ]);
    }
}
