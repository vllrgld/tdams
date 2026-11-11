<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use App\Services\Ocr\OcrContentParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OcrCorrectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_correction_is_saved_with_its_coordinates_and_original_reading(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/sample.pdf', 'original scan');
        $region = [...$this->region('Lot No. 1548'), 'kind' => 'line', 'words' => [['text' => '1548', 'box' => [10, 10, 40, 20]]]];
        $document = $this->document('Lot No. 1548', [$region]);
        $this->actingAs(User::factory()->create());
        $revision = $this->revision($document);

        $response = $this->patchJson($this->endpoint($document), ['text' => 'Lot No. 1543', 'revision' => $revision, 'pin' => 'unrequested']);

        $response->assertOk()->assertJsonPath('text', 'Lot No. 1543')
            ->assertJsonPath('regions.0.text', 'Lot No. 1543')
            ->assertJsonPath('regions.0.box', [10, 10, 90, 20])
            ->assertJsonPath('regions.0.corrected', true)
            ->assertJsonPath('pageContents.0.0.text', 'Lot No. 1543');
        $this->assertNotSame($revision, $response->json('revision'));
        $document->refresh();
        $this->assertSame(['Lot No. 1543'], $document->ocr_pages);
        $this->assertSame('Lot No. 1548', $document->ocr_regions[0]['originalText']);
        $this->assertArrayNotHasKey('words', $response->json('regions.0'));
        $this->assertSame('TD-UNCHANGED', $document->tax_declaration_number);
        $this->assertSame('999', $document->lot_number);
        $this->assertNull($document->pin);
        $this->assertSame('original scan', Storage::disk('local')->get('documents/sample.pdf'));
        $this->getJson(route('documents.ocr', $document))->assertOk()->assertJsonPath('regions.0.text', 'Lot No. 1543');
    }

    public function test_only_the_chosen_duplicate_on_the_chosen_page_is_corrected(): void
    {
        $document = $this->document("Same\nSame\fSame", [$this->region('Same'), $this->region('Same'), $this->region('Same', 2)]);
        $this->actingAs(User::factory()->create());

        $response = $this->patchJson($this->endpoint($document, 1), ['text' => 'Corrected', 'revision' => $this->revision($document)]);

        $response->assertOk()->assertJsonPath('text', "Same\nCorrected\fSame");
        $this->assertSame(['Same', 'Corrected', 'Same'], array_column($document->refresh()->ocr_regions, 'text'));
        $this->patchJson($this->endpoint($document, 1), ['text' => 'Final', 'revision' => $response->json('revision')])->assertOk();
        $this->assertSame('Same', $document->refresh()->ocr_regions[1]['originalText']);
        $this->assertSame(['Same'."\n".'Final', 'Same'], $document->ocr_pages);
    }

    public function test_a_numeric_block_does_not_replace_part_of_another_identifier(): void
    {
        $document = $this->document("PIN 1543\n154", [$this->region('154')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => '155', 'revision' => $this->revision($document)])
            ->assertOk()->assertJsonPath('text', "PIN 1543\n155");

        $this->assertSame("PIN 1543\n155", $document->refresh()->ocr_text);
    }

    public function test_preceding_regions_disambiguate_repeated_text_within_other_blocks(): void
    {
        $document = $this->document("Owner: Old\nRemarks: Old", [$this->region('Owner: Old'), $this->region('Old')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document, 1), ['text' => 'New', 'revision' => $this->revision($document)])
            ->assertOk()->assertJsonPath('text', "Owner: Old\nRemarks: New");

        $this->assertSame('Owner: Old', $document->refresh()->ocr_regions[0]['text']);
    }

    public function test_corrected_markup_is_reparsed_without_losing_table_structure(): void
    {
        $before = '<table><tr><td>Lot</td><td>1548</td></tr></table>';
        $after = '<table><tr><td>Lot</td><td>1543</td></tr></table>';
        $document = $this->document($before, [[...$this->region($before), 'content' => [['type' => 'text', 'text' => 'stale content']]]]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => $after, 'revision' => $this->revision($document)])
            ->assertOk()->assertJsonPath('pageContents.0.0.rows.0.1.text', '1543')
            ->assertJsonPath('regions.0.content.0.rows.0.1.text', '1543');

        $this->assertSame($after, $document->refresh()->ocr_text);
    }

    public function test_region_text_missing_from_page_text_remains_available_to_text_and_mapping(): void
    {
        $document = $this->document('CCT', [$this->region('Lot No. 1548')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => 'Lot No. 1543', 'revision' => $this->revision($document)])
            ->assertOk()->assertJsonPath('text', "CCT\nLot No. 1543");

        $document->refresh();
        $mapping = json_decode(app(OcrContentParser::class)->mappingText($document->ocr_text, $document->ocr_regions), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('Lot No. 1543', $mapping['pages'][0]['regions'][0]['text']);
        $this->assertTrue($mapping['pages'][0]['regions'][0]['corrected']);
        $this->assertArrayNotHasKey('originalText', $mapping['pages'][0]['regions'][0]);
    }

    public function test_mapping_receives_saved_corrections_as_verified_ocr_evidence(): void
    {
        $document = $this->document('Lot No. 1548', [$this->region('Lot No. 1548')]);
        $this->actingAs(User::factory()->create());
        $this->patchJson($this->endpoint($document), ['text' => 'Lot No. 1543', 'revision' => $this->revision($document)])->assertOk();
        Http::preventStrayRequests();
        Http::fake(['https://ollama.test/api/chat' => Http::response(['message' => ['content' => '{"lot_number":"1543"}']])]);

        $this->postJson(route('documents.map', $document), ['model' => 'gpt-oss:20b'])
            ->assertOk()->assertJsonPath('fields.lot_number', '1543');

        Http::assertSent(function (Request $request): bool {
            $input = json_decode($request['messages'][1]['content'], true, flags: JSON_THROW_ON_ERROR);

            return $input['pages'][0]['text'] === 'Lot No. 1543'
                && $input['pages'][0]['regions'][0]['text'] === 'Lot No. 1543'
                && $input['pages'][0]['regions'][0]['corrected'] === true;
        });
        $this->assertSame('999', $document->refresh()->lot_number);
    }

    public function test_displayed_region_indices_remain_correct_when_invalid_provider_entries_are_filtered(): void
    {
        $document = $this->document('Old', [['page' => 1, 'text' => null], $this->region('Old')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => 'New', 'revision' => $this->revision($document)])
            ->assertOk()->assertJsonPath('regions.0.text', 'New');

        $this->assertSame('New', $document->refresh()->ocr_regions[1]['text']);
        $this->assertNull($document->ocr_regions[0]['text']);
    }

    public function test_a_stale_editor_cannot_overwrite_a_newer_correction(): void
    {
        $document = $this->document('Old', [$this->region('Old')]);
        $this->actingAs(User::factory()->create());
        $revision = $this->revision($document);
        $this->patchJson($this->endpoint($document), ['text' => 'First', 'revision' => $revision])->assertOk();

        $this->patchJson($this->endpoint($document), ['text' => 'Stale', 'revision' => $revision])
            ->assertUnprocessable()->assertJsonValidationErrors('text');

        $this->assertSame('First', $document->refresh()->ocr_text);
    }

    public function test_guests_cannot_correct_ocr_text(): void
    {
        $document = $this->document('Old', [$this->region('Old')]);

        $this->patchJson($this->endpoint($document), ['text' => 'New', 'revision' => str_repeat('a', 64)])->assertUnauthorized();

        $this->assertSame('Old', $document->refresh()->ocr_text);
    }

    #[DataProvider('invalidCorrections')]
    public function test_invalid_corrections_do_not_change_the_result(mixed $text): void
    {
        $document = $this->document('Old', [$this->region('Old')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => $text, 'revision' => $this->revision($document)])
            ->assertUnprocessable()->assertJsonValidationErrors('text');

        $this->assertSame('Old', $document->refresh()->ocr_text);
    }

    public static function invalidCorrections(): array
    {
        return ['blank' => ['   '], 'non-string' => [[]], 'too long' => [str_repeat('a', 20001)], 'page separator' => ["New\fPage"]];
    }

    public function test_unknown_regions_and_missing_revisions_are_rejected(): void
    {
        $document = $this->document('Old', [$this->region('Old')]);
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document, 10), ['text' => 'New', 'revision' => $this->revision($document)])
            ->assertUnprocessable()->assertJsonValidationErrors('text');
        $this->patchJson($this->endpoint($document), ['text' => 'New'])->assertUnprocessable()->assertJsonValidationErrors('revision');

        $this->assertSame('Old', $document->refresh()->ocr_text);
    }

    #[DataProvider('unfinishedStatuses')]
    public function test_ocr_must_finish_before_corrections_are_accepted(string $status): void
    {
        $document = $this->document('Old', [$this->region('Old')]);
        $document->forceFill(['ocr_status' => $status])->saveQuietly();
        $this->actingAs(User::factory()->create());

        $this->patchJson($this->endpoint($document), ['text' => 'New', 'revision' => $this->revision($document)])
            ->assertUnprocessable()->assertJsonValidationErrors('text');

        $this->assertSame('Old', $document->refresh()->ocr_text);
    }

    public static function unfinishedStatuses(): array
    {
        return ['pending' => ['pending'], 'processing' => ['processing'], 'failed' => ['failed']];
    }

    /** @param list<array<string, mixed>> $regions */
    private function document(string $text, array $regions): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'sample.pdf', 'storage_path' => 'documents/sample.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 8, 'ocr_status' => 'completed', 'ocr_text' => $text, 'ocr_pages' => explode("\f", $text),
            'ocr_regions' => $regions, 'tax_declaration_number' => 'TD-UNCHANGED', 'lot_number' => '999',
        ]);
    }

    /** @return array<string, mixed> */
    private function region(string $text, int $page = 1): array
    {
        return ['page' => $page, 'text' => $text, 'box' => [10, 10, 90, 20], 'pageWidth' => 100, 'pageHeight' => 100];
    }

    private function revision(Document $document): string
    {
        return $this->getJson(route('documents.ocr', $document))->assertOk()->json('revision');
    }

    private function endpoint(Document $document, int $index = 0): string
    {
        return route('documents.ocr.regions.update', ['document' => $document, 'region' => $index]);
    }
}
