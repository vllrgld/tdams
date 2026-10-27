<?php

namespace Tests\Feature\Documents;

use App\Jobs\OcrDocument;
use App\Models\Document;
use App\Models\OcrSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;
use Tests\TestCase;

class OcrDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_stores_ocr_text_and_pages(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'text' => "Owner\fLot 12",
                'pages' => ['Owner', 'Lot 12'],
                'page_count' => 2,
            ]),
            'http://127.0.0.1:8001/v1/pdf' => $this->optimizedPdfResponse(),
        ]);

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame("Owner\fLot 12", $document->ocr_text);
        $this->assertSame(['Owner', 'Lot 12'], $document->ocr_pages);
        $this->assertNull($document->ocr_error);
        $this->assertNotNull($document->ocr_completed_at);
        Storage::disk('local')->assertExists('documents/scan.pdf');

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://127.0.0.1:8001/v1/ocr'
                && $request->hasHeader('Authorization', 'Bearer local-dev-token')
                && $this->formField($request, 'optimize') === '0';
        });
        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://127.0.0.1:8001/v1/pdf'
                && $request->hasHeader('Authorization', 'Bearer local-dev-token')
                && $this->formField($request, 'optimize') === '3';
        });
        $this->assertSame('documents/ocr/'.$document->id.'.pdf', $document->ocr_pdf_path);
        $this->assertSame('%PDF-optimized', Storage::disk('local')->get('documents/ocr/'.$document->id.'.pdf'));
    }

    public function test_job_sends_the_saved_compression_level_to_ocrmypdf(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        OcrSetting::query()->create(['optimize' => 1]);

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'text' => 'Owner',
                'pages' => ['Owner'],
                'page_count' => 1,
            ]),
            'http://127.0.0.1:8001/v1/pdf' => $this->optimizedPdfResponse(),
        ]);

        OcrDocument::dispatchSync($this->document()->id);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://127.0.0.1:8001/v1/pdf'
                && $request->hasHeader('Authorization', 'Bearer local-dev-token')
                && $this->formField($request, 'optimize') === '1';
        });
    }

    public function test_job_converts_an_uploaded_image_to_a_preview_pdf(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.jpg', 'fake-jpeg');
        OcrSetting::query()->create(['optimize' => 3]);

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'text' => 'Owner',
                'pages' => ['Owner'],
                'page_count' => 1,
            ]),
            'http://127.0.0.1:8001/v1/pdf' => $this->optimizedPdfResponse(),
        ]);

        $document = $this->document([
            'original_filename' => 'scan.jpg',
            'storage_path' => 'documents/scan.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 9,
        ]);

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('documents/ocr/'.$document->id.'.pdf', $document->ocr_pdf_path);
        $this->assertSame('%PDF-optimized', Storage::disk('local')->get('documents/ocr/'.$document->id.'.pdf'));
        Storage::disk('local')->assertExists('documents/scan.jpg');
    }

    public function test_job_marks_the_document_failed_when_ocr_returns_an_error(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'detail' => 'Tesseract failed',
            ], 500),
        ]);

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('failed', $document->ocr_status);
        $this->assertSame('Tesseract failed', $document->ocr_error);
        $this->assertNull($document->ocr_text);
        $this->assertNull($document->ocr_completed_at);
        Storage::disk('local')->assertExists('documents/scan.pdf');
        $this->assertNull($document->ocr_pdf_path);
        $this->assertNull($document->ocr_pdf_size);
    }

    public function test_job_stores_the_ocrmypdf_preview_instead_of_the_ocr_engine_pdf(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4 original');

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'text' => 'Owner',
                'pages' => ['Owner'],
                'page_count' => 1,
                'pdf_base64' => base64_encode('%PDF-from-ocr-engine'),
            ]),
            'http://127.0.0.1:8001/v1/pdf' => $this->optimizedPdfResponse(),
        ]);

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('documents/ocr/'.$document->id.'.pdf', $document->ocr_pdf_path);
        $this->assertSame(strlen('%PDF-optimized'), $document->ocr_pdf_size);
        Storage::disk('local')->assertExists('documents/ocr/'.$document->id.'.pdf');
        $this->assertSame(
            '%PDF-optimized',
            Storage::disk('local')->get('documents/ocr/'.$document->id.'.pdf'),
        );
        Storage::disk('local')->assertExists('documents/scan.pdf');
    }

    public function test_paddle_job_uses_env_credentials_when_settings_are_blank(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        Config::set('services.ocr.paddle.job_url', 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs');
        Config::set('services.ocr.paddle.token', 'env-paddle-token');
        Config::set('services.ocr.paddle.model', 'PP-OCRv6');

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => null,
            'token' => null,
            'model' => null,
        ])->save();

        $jsonl = json_encode([
            'result' => [
                'ocrResults' => [
                    ['prunedResult' => ['rec_texts' => ['Owner']]],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        Http::fake(function (Request $request) use ($jsonl) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST') {
                return Http::response(['code' => 0, 'data' => ['jobId' => 'ocrjob-env']]);
            }

            if (str_ends_with($request->url(), '/ocrjob-env')) {
                return Http::response([
                    'code' => 0,
                    'data' => [
                        'state' => 'done',
                        'resultUrl' => ['jsonUrl' => 'https://bos.example/env.jsonl'],
                    ],
                ]);
            }

            return Http::response($jsonl);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('Owner', $document->ocr_text);

        Http::assertSent(function (Request $request): bool {
            return $request->method() === 'POST'
                && $request->hasHeader('Authorization', 'bearer env-paddle-token')
                && $this->formField($request, 'model') === 'PP-OCRv6';
        });
    }

    public function test_paddle_job_stores_text_from_rec_texts(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'paddle-test-token',
            'model' => 'PP-OCRv6',
        ])->save();

        $jsonl = json_encode([
            'result' => [
                'ocrResults' => [
                    ['prunedResult' => ['rec_texts' => ['Owner', 'Name']]],
                    ['prunedResult' => ['rec_texts' => ['Lot 12']]],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        Http::fake(function (Request $request) use ($jsonl) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST' && $request->url() === 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs') {
                return Http::response([
                    'code' => 0,
                    'data' => ['jobId' => 'ocrjob-1'],
                ]);
            }

            if ($request->url() === 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs/ocrjob-1') {
                return Http::response([
                    'code' => 0,
                    'data' => [
                        'state' => 'done',
                        'resultUrl' => [
                            'jsonUrl' => 'https://bos.example/result.jsonl',
                        ],
                    ],
                ]);
            }

            if ($request->url() === 'https://bos.example/result.jsonl') {
                return Http::response($jsonl, 200, ['Content-Type' => 'text/plain']);
            }

            return Http::response(['code' => 1, 'msg' => 'Unexpected '.$request->url()], 404);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame("Owner\nName\fLot 12", $document->ocr_text);
        $this->assertSame(["Owner\nName", 'Lot 12'], $document->ocr_pages);
        $this->assertSame('documents/ocr/'.$document->id.'.pdf', $document->ocr_pdf_path);
        $this->assertSame('%PDF-optimized', Storage::disk('local')->get('documents/ocr/'.$document->id.'.pdf'));

        Http::assertSent(function (Request $request): bool {
            return $request->method() === 'POST'
                && $request->url() === 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs'
                && $request->hasHeader('Authorization', 'bearer paddle-test-token')
                && $this->formField($request, 'model') === 'PP-OCRv6';
        });
    }

    public function test_paddle_job_stores_markdown_text_from_layout_results(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'paddle-test-token',
            'model' => 'PaddleOCR-VL',
        ])->save();

        $jsonl = json_encode([
            'result' => [
                'layoutParsingResults' => [
                    ['markdown' => ['text' => 'Owner page']],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        Http::fake(function (Request $request) use ($jsonl) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST') {
                return Http::response(['code' => 0, 'data' => ['jobId' => 'ocrjob-2']]);
            }

            if (str_ends_with($request->url(), '/ocrjob-2')) {
                return Http::response([
                    'code' => 0,
                    'data' => [
                        'state' => 'done',
                        'resultUrl' => ['jsonUrl' => 'https://bos.example/layout.jsonl'],
                    ],
                ]);
            }

            return Http::response($jsonl);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('Owner page', $document->ocr_text);
        $this->assertSame(['Owner page'], $document->ocr_pages);
        $this->assertSame('documents/ocr/'.$document->id.'.pdf', $document->ocr_pdf_path);
    }

    public function test_paddle_job_retries_when_status_poll_returns_not_found(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'paddle-test-token',
            'model' => 'PP-OCRv6',
        ])->save();

        $jsonl = json_encode([
            'result' => [
                'ocrResults' => [
                    ['prunedResult' => ['rec_texts' => ['Owner']]],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $polls = 0;

        Http::fake(function (Request $request) use ($jsonl, &$polls) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST') {
                return Http::response(['code' => 0, 'data' => ['jobId' => '108421398753353728']]);
            }

            if (str_ends_with($request->url(), '/108421398753353728')) {
                $polls++;

                if ($polls === 1) {
                    return Http::response(['code' => 1, 'msg' => 'not found'], 404);
                }

                return Http::response([
                    'code' => 0,
                    'data' => [
                        'state' => 'done',
                        'resultUrl' => ['jsonUrl' => 'https://bos.example/found.jsonl'],
                    ],
                ]);
            }

            return Http::response($jsonl);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('Owner', $document->ocr_text);
        $this->assertSame(2, $polls);
    }

    public function test_job_compresses_via_ocr_when_the_pdf_route_is_missing(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        OcrSetting::query()->create(['optimize' => 2]);

        Http::fake(function (Request $request) {
            if ($request->url() === 'http://127.0.0.1:8001/v1/pdf') {
                return Http::response(['detail' => 'Not Found'], 404);
            }

            return Http::response([
                'text' => 'Owner',
                'pages' => ['Owner'],
                'page_count' => 1,
                'pdf_base64' => base64_encode('%PDF-from-ocr'),
            ]);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('%PDF-from-ocr', Storage::disk('local')->get('documents/ocr/'.$document->id.'.pdf'));
        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://127.0.0.1:8001/v1/ocr'
                && $this->formField($request, 'optimize') === '2';
        });
    }

    public function test_job_keeps_ocr_text_when_preview_compression_fails(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        OcrSetting::query()->create(['optimize' => 3]);

        Http::fake([
            'http://127.0.0.1:8001/v1/ocr' => Http::response([
                'text' => 'Owner',
                'pages' => ['Owner'],
                'page_count' => 1,
            ]),
            'http://127.0.0.1:8001/v1/pdf' => Http::response(['detail' => 'OCRmyPDF failed'], 500),
        ]);

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('Owner', $document->ocr_text);
        $this->assertNull($document->ocr_pdf_path);
    }

    public function test_ocr_status_falls_back_to_the_original_file_when_the_preview_pdf_is_missing(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');

        $user = User::factory()->create();
        $document = $this->document([
            'uploaded_by' => $user->id,
            'ocr_status' => 'completed',
            'ocr_text' => 'Owner',
            'ocr_pdf_path' => 'documents/ocr/missing.pdf',
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.ocr', $document))
            ->assertOk()
            ->assertJsonPath('pdfUrl', route('documents.view', $document));

        $this->actingAs($user)
            ->get(route('documents.ocr-pdf', $document))
            ->assertOk();
    }

    public function test_paddle_job_retries_when_status_poll_times_out(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'paddle-test-token',
            'model' => 'PP-OCRv6',
        ])->save();

        $jsonl = json_encode([
            'result' => [
                'ocrResults' => [
                    ['prunedResult' => ['rec_texts' => ['Owner']]],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $polls = 0;

        Http::fake(function (Request $request) use ($jsonl, &$polls) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST') {
                return Http::response(['code' => 0, 'data' => ['jobId' => 'ocrjob-retry']]);
            }

            if (str_ends_with($request->url(), '/ocrjob-retry')) {
                $polls++;

                if ($polls === 1) {
                    throw new ConnectionException(
                        'cURL error 28: Connection timed out after 5006 milliseconds',
                    );
                }

                return Http::response([
                    'code' => 0,
                    'data' => [
                        'state' => 'done',
                        'resultUrl' => ['jsonUrl' => 'https://bos.example/retry.jsonl'],
                    ],
                ]);
            }

            return Http::response($jsonl);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('completed', $document->ocr_status);
        $this->assertSame('Owner', $document->ocr_text);
        $this->assertSame(2, $polls);
    }

    public function test_paddle_job_marks_the_document_failed_when_the_job_fails(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/scan.pdf', '%PDF-1.4');
        Sleep::fake();

        OcrSetting::current()->forceFill([
            'driver' => OcrSetting::DRIVER_PADDLE,
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'paddle-test-token',
            'model' => 'PP-OCRv6',
        ])->save();

        Http::fake(function (Request $request) {
            if ($this->isPdfOptimizeRequest($request)) {
                return $this->optimizedPdfResponse();
            }

            if ($request->method() === 'POST') {
                return Http::response(['code' => 0, 'data' => ['jobId' => 'ocrjob-3']]);
            }

            return Http::response([
                'code' => 0,
                'data' => [
                    'state' => 'failed',
                    'errorMsg' => 'File format not supported',
                ],
            ]);
        });

        $document = $this->document();

        OcrDocument::dispatchSync($document->id);

        $document->refresh();

        $this->assertSame('failed', $document->ocr_status);
        $this->assertSame('File format not supported', $document->ocr_error);
        $this->assertNull($document->ocr_pdf_path);
    }

    public function test_authenticated_user_can_read_ocr_text(): void
    {
        $user = User::factory()->create();
        $document = Document::query()->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'uploaded_by' => $user->id,
            'ocr_status' => 'completed',
            'ocr_text' => "Owner\fLot 12",
        ]);

        $this->actingAs($user)
            ->getJson(route('documents.ocr', $document))
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('text', "Owner\fLot 12");
    }

    public function test_guests_cannot_read_ocr_text(): void
    {
        $document = $this->document();

        $this->getJson(route('documents.ocr', $document))
            ->assertUnauthorized();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function document(array $attributes = []): Document
    {
        return Document::query()->create([
            'original_filename' => 'scan.pdf',
            'storage_path' => 'documents/scan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
            'ocr_status' => 'pending',
            ...$attributes,
        ]);
    }

    private function formField(Request $request, string $name): ?string
    {
        if (preg_match('/name="'.preg_quote($name, '/').'"\r\n\r\n([^\r\n]+)/', $request->body(), $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }

    private function isPdfOptimizeRequest(Request $request): bool
    {
        return str_ends_with($request->url(), '/v1/pdf');
    }

    private function optimizedPdfResponse()
    {
        return Http::response([
            'pdf_base64' => base64_encode('%PDF-optimized'),
        ]);
    }
}
