<?php

namespace Tests\Feature\Documents;

use App\Models\OcrSetting;
use App\Models\User;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\DocumentFieldSchema;
use App\Services\Documents\DocumentWriter;
use App\Services\Ocr\OcrContentParser;
use App\Services\Ocr\PaddleOcrClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OcrRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_escaped_layout_tables_and_latex_render_like_page_text(): void
    {
        $parser = app(OcrContentParser::class);
        $raw = '<table><tr><td colspan=\\"2\\">LAND\\\\nBUILDING</td></tr><tr><td>Area</td><td>2528</td></tr></table>';
        $parsed = $parser->parse($raw);

        $this->assertSame(2, $parsed[0]['rows'][0][0]['colSpan']);
        $this->assertSame("LAND\nBUILDING", $parsed[0]['rows'][0][0]['text']);
        $this->assertSame('North: Lot # 1542', $parser->plainText('North: $ \\underline{\\text{Lot # 1542}} $'));
        $this->assertSame("TAX DECLARATION\n\nLot No. 1543", $parser->plainText("# TAX DECLARATION\n\nLot No. 1543"));
    }

    public function test_ocr_preview_and_mapping_keep_region_text_omitted_from_markdown(): void
    {
        $user = User::factory()->create();
        $region = $this->region('Lot No. 1543');
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'sample.jpg', 'storage_path' => 'documents/sample.jpg', 'mime_type' => 'image/jpeg',
            'file_size' => 8, 'uploaded_by' => $user->id, 'ocr_status' => 'completed', 'ocr_text' => 'CCT',
            'ocr_pages' => ['CCT'], 'ocr_regions' => [$region],
        ]);
        Http::preventStrayRequests();
        Http::fake(['https://ollama.test/api/chat' => Http::response(['message' => ['content' => '{"lot_number":"1543"}']])]);

        $this->actingAs($user)->getJson(route('documents.ocr', $document))
            ->assertOk()->assertJsonPath('pageContents.0.0.text', 'CCT')
            ->assertJsonPath('regions.0.text', 'Lot No. 1543');
        $this->postJson(route('documents.map', $document), ['model' => 'gpt-oss:20b'])
            ->assertOk()->assertJsonPath('fields.lot_number', '1543');

        Http::assertSent(function (Request $request): bool {
            $input = json_decode($request['messages'][1]['content'], true);

            return $input['pages'][0]['text'] === 'CCT'
                && $input['pages'][0]['regions'][0]['text'] === 'Lot No. 1543'
                && $input['pages'][0]['regions'][0]['box'] === [0, 10, 100, 20];
        });
        $this->assertSame('CCT', $document->refresh()->ocr_text);
        $this->assertNull($document->lot_number);
    }

    public function test_native_markdown_and_independent_region_readings_reach_mapping_unchanged(): void
    {
        $parser = app(OcrContentParser::class);

        $markdown = "# TAX DECLARATION\n\n| Lot No. | Boundary |\n| --- | --- |\n| 1700 | 1543 |";
        $input = json_decode($parser->mappingText($markdown, [$this->region('Lot No. 1543')]), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame($markdown, $input['pages'][0]['text']);
        $this->assertSame('Lot No. 1543', $input['pages'][0]['regions'][0]['text']);
        $regions = $parser->regions([[...$this->region('Street\\nBarangay'), 'kind' => 'block']]);
        $this->assertSame("Street\nBarangay", $regions[0]['content'][0]['text']);
    }

    public function test_vl_scans_preserve_paddle_region_text_without_calling_local_recognition(): void
    {
        $markdown = "# Tax declaration\n\n| Field | Value |\n| --- | --- |\n| PIN | 001-02 |\n\n<table><tr><td>LAND</td></tr></table>";
        OcrSetting::current()->forceFill(['driver' => OcrSetting::DRIVER_PADDLE, 'model' => OcrSetting::MODEL_VL, 'job_url' => 'https://paddle.test/jobs', 'token' => 'test-token'])->save();
        Http::preventStrayRequests();
        Http::fake([
            'https://paddle.test/jobs' => Http::response(['code' => 0, 'data' => ['jobId' => 'test-job']]),
            'https://paddle.test/jobs/test-job' => Http::response(['code' => 0, 'data' => ['state' => 'done', 'resultUrl' => ['jsonUrl' => 'https://result.test/ocr']]]),
            'https://result.test/ocr' => Http::response(json_encode(['result' => ['layoutParsingResults' => [['markdown' => ['text' => $markdown], 'width' => 100, 'height' => 100, 'parsing_res_list' => [['block_content' => 'Lot No. 1543', 'block_bbox' => [0, 10, 100, 20]]]]]]], JSON_THROW_ON_ERROR)),
            'http://127.0.0.1:8001/v1/ocr' => Http::response(['text' => 'Unexpected local recognition', 'pages' => ['Unexpected local recognition'], 'regions' => []]),
        ]);

        $result = app(PaddleOcrClient::class)->extract('scan bytes', 'sample.jpg');

        $this->assertSame($markdown, $result['text']);
        $this->assertSame([$markdown], $result['pages']);
        $this->assertSame('Lot No. 1543', $result['regions'][0]['text']);
        Http::assertSent(function (Request $request): bool {
            if ($request->url() !== 'https://paddle.test/jobs') {
                return false;
            }

            foreach ($request->data() as $part) {
                if (is_array($part) && ($part['name'] ?? null) === 'optionalPayload') {
                    return json_decode($part['contents'], true)['prettifyMarkdown'] === true;
                }
            }

            return false;
        });
        Http::assertSentCount(3);
    }

    public function test_every_review_field_has_source_guidance_and_mapping_keeps_explicit_location_labels(): void
    {
        foreach (DocumentFieldDefinitions::reviewSections() as $section) {
            foreach ($section['fields'] as $field) {
                $this->assertNotEmpty($field['help']);
            }
        }

        $instructions = DocumentFieldSchema::instructions();
        $this->assertStringContainsString('Follow explicit Barangay/Brgy. and District labels.', $instructions);
        $this->assertStringContainsString('Never copy North/South/East/West boundary lots', $instructions);
        $this->assertNull(DocumentFieldSchema::normalize(['lot_number' => '___'])['lot_number']);
    }

    public function test_v6_reads_image_dimensions_from_native_data_info_and_keeps_recognized_lines(): void
    {
        $lines = ['# Boundary', '  PIN\t001-02', '$20 and $30', 'Lot No. 1543'];
        $result = $this->paddleResult([
            'dataInfo' => ['type' => 'image', 'width' => 882, 'height' => 1278],
            'ocrResults' => [['prunedResult' => [
                'rec_texts' => $lines,
                'rec_boxes' => [[10, 20, 100, 40], [10, 50, 200, 70], [10, 80, 150, 100], [10, 110, 150, 130]],
            ]]],
        ]);

        $this->assertSame(implode("\n", $lines), $result['text']);
        $this->assertSame($lines, array_column($result['regions'], 'text'));
        $this->assertSame([882, 882, 882, 882], array_column($result['regions'], 'pageWidth'));
        $this->assertSame([1278, 1278, 1278, 1278], array_column($result['regions'], 'pageHeight'));
    }

    public function test_pdf_dimensions_are_matched_by_page_and_explicit_page_dimensions_take_priority(): void
    {
        $result = $this->paddleResult([
            'dataInfo' => ['type' => 'pdf', 'numPages' => 3, 'pages' => [
                ['width' => 800, 'height' => 1200], ['width' => 1200, 'height' => 800],
            ]],
            'ocrResults' => [
                ['prunedResult' => ['width' => 900, 'height' => 1300, 'rec_texts' => ['First']]],
                ['prunedResult' => ['rec_texts' => ['Second']]],
                ['prunedResult' => ['rec_texts' => ['Third']]],
            ],
        ]);

        $this->assertSame("First\fSecond\fThird", $result['text']);
        $this->assertSame([900, 1200, null], array_column($result['regions'], 'pageWidth'));
        $this->assertSame([1300, 800, null], array_column($result['regions'], 'pageHeight'));
        $this->assertSame([1, 2, 3], array_column($result['regions'], 'page'));
    }

    public function test_layout_dimensions_can_also_use_data_info_without_changing_native_markdown(): void
    {
        $markdown = "# TAX DECLARATION\n\n| Lot | Value |\n| --- | --- |\n| 1543 | 2528 |\n";
        $result = $this->paddleResult([
            'dataInfo' => ['type' => 'image', 'width' => 882, 'height' => 1278],
            'layoutParsingResults' => [[
                'markdown' => ['text' => $markdown],
                'prunedResult' => ['width' => 0, 'height' => -1, 'parsing_res_list' => [
                    ['block_content' => 'Lot No. 1543', 'block_bbox' => [10, 20, 100, 40]],
                ]],
            ]],
        ], OcrSetting::MODEL_VL);

        $this->assertSame($markdown, $result['text']);
        $this->assertSame(882, $result['regions'][0]['pageWidth']);
        $this->assertSame(1278, $result['regions'][0]['pageHeight']);
    }

    public function test_line_ocr_preview_keeps_literal_markup_and_layout_pages_still_render_tables(): void
    {
        $user = User::factory()->create();
        $text = "# Boundary\n  PIN\t001-02\n\n$20 and $30\n\\underline{Lot No.}\n| Lot | Value |\n| --- | --- |\n| 1543 | 2528 |\n<table><tr><td>Literal</td></tr></table>";
        $markdown = "| Lot | Value |\n| --- | --- |\n| 1543 | 2528 |";
        $regions = array_map($this->region(...), explode("\n", $text));
        $regions[] = [...$this->region($markdown), 'page' => 2, 'kind' => 'block'];
        $document = app(DocumentWriter::class)->create([
            'original_filename' => 'sample.pdf', 'storage_path' => 'documents/sample.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 8, 'uploaded_by' => $user->id, 'ocr_status' => 'completed',
            'ocr_text' => $text."\f".$markdown, 'ocr_pages' => [$text, $markdown], 'ocr_regions' => $regions,
        ]);

        $this->actingAs($user)->getJson(route('documents.ocr', $document))
            ->assertOk()->assertJsonPath('pageContents.0', [['type' => 'text', 'text' => $text]])
            ->assertJsonPath('pageContents.1.0.type', 'table')
            ->assertJsonPath('pageContents.1.0.rows.1.0.text', '1543')
            ->assertJsonPath('regions.0.text', '# Boundary')
            ->assertJsonMissingPath('regions.0.content');

        $this->assertSame($text."\f".$markdown, $document->refresh()->ocr_text);
        $this->assertSame($regions, $document->ocr_regions);
        $mapped = json_decode(app(OcrContentParser::class)->mappingText($document->ocr_text, $document->ocr_regions), true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($text, $mapped['pages'][0]['text']);
        $this->assertSame('# Boundary', $mapped['pages'][0]['regions'][0]['text']);
    }

    /**
     * @param  array<string, mixed>  $result
     * @return array{text: string, regions: list<array<string, mixed>>}
     */
    private function paddleResult(array $result, string $model = OcrSetting::MODEL_TRADITIONAL): array
    {
        OcrSetting::current()->forceFill(['driver' => OcrSetting::DRIVER_PADDLE, 'model' => $model, 'job_url' => 'https://paddle.test/jobs', 'token' => 'test-token'])->save();
        Http::preventStrayRequests();
        Http::fake([
            'https://paddle.test/jobs' => Http::response(['code' => 0, 'data' => ['jobId' => 'native-job']]),
            'https://paddle.test/jobs/native-job' => Http::response(['code' => 0, 'data' => ['state' => 'done', 'resultUrl' => ['jsonUrl' => 'https://result.test/native']]]),
            'https://result.test/native' => Http::response(json_encode(['result' => $result], JSON_THROW_ON_ERROR)),
        ]);

        $extracted = app(PaddleOcrClient::class)->extract('scan bytes', 'sample.pdf');
        Http::assertSentCount(3);

        return $extracted;
    }

    /** @return array{kind: string, page: int, text: string, box: list<int>, pageWidth: int, pageHeight: int} */
    private function region(string $text): array
    {
        return ['kind' => 'line', 'page' => 1, 'text' => $text, 'box' => [0, 10, 100, 20], 'pageWidth' => 100, 'pageHeight' => 100];
    }
}
