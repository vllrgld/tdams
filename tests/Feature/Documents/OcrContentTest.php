<?php

namespace Tests\Feature\Documents;

use App\Models\User;
use App\Services\Documents\DocumentWriter;
use App\Services\Ocr\LocalOcrClient;
use App\Services\Ocr\OcrContentParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OcrContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_tables_are_exposed_as_cells_without_changing_the_original_ocr(): void
    {
        $user = User::factory()->create();
        $html = '<table><tr><th colspan="2">Property &amp; value</th></tr><tr><td rowspan="2">Lot 007</td><td>100<br>sq m</td></tr><tr><td></td></tr></table>';
        $region = ['kind' => 'block', 'page' => 1, 'text' => $html, 'box' => [0, 0, 200, 100], 'pageWidth' => 200, 'pageHeight' => 300];
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'sample.pdf', 'storage_path' => 'documents/sample.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 8, 'uploaded_by' => $user->id, 'ocr_status' => 'completed', 'ocr_text' => $html,
            'ocr_pages' => [$html], 'ocr_regions' => [$region],
        ]);

        $this->actingAs($user)->getJson(route('documents.ocr', $document))
            ->assertOk()
            ->assertJsonPath('regions.0.text', $html)
            ->assertJsonPath('regions.0.content.0.type', 'table')
            ->assertJsonPath('regions.0.content.0.rows.0.0', ['text' => 'Property & value', 'rowSpan' => 1, 'colSpan' => 2, 'header' => true])
            ->assertJsonPath('regions.0.content.0.rows.1.0.rowSpan', 2)
            ->assertJsonPath('pageContents.0.0.rows.1.1.text', "100\nsq m")
            ->assertJsonPath('pageContents.0.0.rows.2.0.text', '');

        $this->assertSame([$region], $document->refresh()->ocr_regions);
        $this->assertSame($html, $document->ocr_text);
    }

    public function test_plain_text_keeps_spaces_tabs_blank_lines_and_unicode(): void
    {
        $text = "  PIN\t001-02\n\nOwner    Peña  \n";

        $this->assertSame([['type' => 'text', 'text' => $text]], app(OcrContentParser::class)->parse($text));
    }

    public function test_html_is_reduced_to_text_and_safe_cell_properties(): void
    {
        $html = '<script>unsafe()</script><table onclick="unsafe()"><tr><td style="background:url(https://invalid.test)" onmouseover="unsafe()">Pe&ntilde;a&nbsp;&#x2611;<img src="x" onerror="unsafe()"><script>unsafe()</script></td></tr></table>';

        $this->assertSame([['type' => 'table', 'rows' => [[[
            'text' => "Peña\u{00a0}☑", 'rowSpan' => 1, 'colSpan' => 1, 'header' => false,
        ]]]]], app(OcrContentParser::class)->parse($html));
    }

    public function test_multiple_tables_and_surrounding_text_remain_in_order(): void
    {
        $content = app(OcrContentParser::class)->parse('Before<table><tr><td>One</td></tr></table>Between<table><tr><td>Two</td></tr></table>After');

        $this->assertSame(['text', 'table', 'text', 'table', 'text'], array_column($content, 'type'));
        $this->assertSame('Before', $content[0]['text']);
        $this->assertSame('Between', $content[2]['text']);
        $this->assertSame('After', $content[4]['text']);
    }

    public function test_nested_tables_do_not_duplicate_outer_rows(): void
    {
        $content = app(OcrContentParser::class)->parse('<table><tr><td>Outer<table><tr><td>Inner A</td><td>Inner B</td></tr></table></td></tr></table>');

        $this->assertCount(1, $content[0]['rows']);
        $this->assertSame("Outer\nInner A\tInner B\n", $content[0]['rows'][0][0]['text']);
    }

    public function test_bad_spans_are_bounded_and_zero_rowspan_covers_remaining_rows(): void
    {
        $content = app(OcrContentParser::class)->parse('<table><tr><td rowspan="0" colspan="99999999">A</td><td rowspan="-1" colspan="no">B</td></tr><tr><td>C</td></tr></table>');

        $this->assertSame(2, $content[0]['rows'][0][0]['rowSpan']);
        $this->assertSame(1000, $content[0]['rows'][0][0]['colSpan']);
        $this->assertSame(1, $content[0]['rows'][0][1]['rowSpan']);
        $this->assertSame(1, $content[0]['rows'][0][1]['colSpan']);
    }

    public function test_markdown_tables_keep_escaped_pipes_empty_cells_and_line_breaks(): void
    {
        $content = app(OcrContentParser::class)->parse("Before\n| Label | Value |\n| :--- | ---: |\n| A\\|B | |\n\nAfter");

        $this->assertSame('Before'."\n", $content[0]['text']);
        $this->assertSame(['Label', 'Value'], array_column($content[1]['rows'][0], 'text'));
        $this->assertSame(['A|B', ''], array_column($content[1]['rows'][1], 'text'));
        $this->assertTrue($content[1]['rows'][0][0]['header']);
        $this->assertFalse($content[1]['rows'][1][0]['header']);
        $this->assertSame("\nAfter", $content[2]['text']);
    }

    public function test_local_word_coordinates_survive_ingestion_and_missing_positions_keep_text(): void
    {
        $region = ['page' => 1, 'text' => 'LABEL VALUE', 'box' => [10, 10, 900, 40], 'pageWidth' => 1000, 'pageHeight' => 1000,
            'words' => [['text' => 'LABEL', 'box' => [10, 10, 80, 40]], ['text' => 'VALUE', 'box' => [800, 10, 900, 40]]]];
        Http::preventStrayRequests();
        Http::fake(['http://127.0.0.1:8001/v1/ocr' => Http::response([
            'text' => "LABEL VALUE\nOther text", 'pages' => ["LABEL VALUE\nOther text"],
            'regions' => [$region, ['page' => 1, 'text' => 'Other text', 'box' => null, 'pageWidth' => 1000, 'pageHeight' => 1000]],
        ])]);

        $result = app(LocalOcrClient::class)->extract('sample', 'sample.pdf');

        $this->assertSame([10.0, 10.0, 80.0, 40.0], $result['regions'][0]['words'][0]['box']);
        $this->assertSame('VALUE', $result['regions'][0]['words'][1]['text']);
        $this->assertSame('Other text', $result['regions'][1]['text']);
        $this->assertNull($result['regions'][1]['box']);
        Http::assertSentCount(1);
    }

    public function test_single_column_markdown_tables_are_recognized(): void
    {
        $content = app(OcrContentParser::class)->parse("| Notes |\n| --- |\n| Verified |\n");

        $this->assertSame('table', $content[0]['type']);
        $this->assertSame('Notes', $content[0]['rows'][0][0]['text']);
        $this->assertSame('Verified', $content[0]['rows'][1][0]['text']);
    }

    public function test_markdown_table_examples_in_code_fences_remain_text(): void
    {
        $markdown = "Example:\n```markdown\n| Lot | Value |\n| --- | --- |\n| 1543 | 2528 |\n```";

        $this->assertSame([['type' => 'text', 'text' => $markdown]], app(OcrContentParser::class)->parse($markdown));
    }

    public function test_markdown_table_cell_formatting_is_interpreted_by_commonmark(): void
    {
        $markdown = "| Label | Value |\n| --- | --- |\n| **Lot No.** | `1543` |";

        $content = app(OcrContentParser::class)->parse($markdown);

        $this->assertSame(['Lot No.', '1543'], array_column($content[0]['rows'][1], 'text'));
    }

    public function test_native_markdown_and_html_tables_can_share_a_page(): void
    {
        $markdown = "| Field | Value |\n| --- | --- |\n| Lot No. | 1543 |\n\n<table><tr><th colspan=\"2\">Assessment</th></tr><tr><td>LAND</td><td>2528</td></tr></table>";

        $tables = array_values(array_filter(app(OcrContentParser::class)->parse($markdown), fn (array $block): bool => $block['type'] === 'table'));

        $this->assertCount(2, $tables);
        $this->assertSame('1543', $tables[0]['rows'][1][1]['text']);
        $this->assertSame(2, $tables[1]['rows'][0][0]['colSpan']);
        $this->assertSame('2528', $tables[1]['rows'][1][1]['text']);
    }

    public function test_partial_word_coordinates_fall_back_to_the_whole_line(): void
    {
        Http::preventStrayRequests();
        Http::fake(['http://127.0.0.1:8001/v1/ocr' => Http::response([
            'text' => 'LABEL VALUE', 'pages' => ['LABEL VALUE'], 'regions' => [[
                'page' => 1, 'text' => 'LABEL VALUE', 'box' => [0, 0, 100, 20], 'pageWidth' => 100, 'pageHeight' => 100,
                'words' => [['text' => 'LABEL', 'box' => [0, 0, 50, 20]]],
            ]],
        ])]);

        $result = app(LocalOcrClient::class)->extract('sample', 'sample.pdf');

        $this->assertArrayNotHasKey('words', $result['regions'][0]);
        $this->assertSame('LABEL VALUE', $result['regions'][0]['text']);
        Http::assertSentCount(1);
    }
}
