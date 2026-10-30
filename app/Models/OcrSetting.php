<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $driver
 * @property string|null $job_url
 * @property string|null $token
 * @property string|null $model
 * @property int $optimize
 */
class OcrSetting extends Model
{
    public const DRIVER_LOCAL = 'local';

    public const DRIVER_PADDLE = 'paddle';

    public const DEFAULT_JOB_URL = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs';

    public const MODEL_TRADITIONAL = 'PP-OCRv6';

    public const MODEL_VL = 'PaddleOCR-VL-1.6';

    public const DEFAULT_MODEL = self::MODEL_TRADITIONAL;

    protected $fillable = [
        'driver',
        'job_url',
        'token',
        'model',
        'optimize',
    ];

    protected $hidden = [
        'token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'optimize' => 'integer',
            'token' => 'encrypted',
        ];
    }

    public static function current(): self
    {
        $setting = static::query()->first();

        if ($setting instanceof self) {
            return $setting;
        }

        return static::query()->create([
            'driver' => self::DRIVER_LOCAL,
            'job_url' => self::configJobUrl(),
            'model' => self::configModel(),
            'optimize' => 3,
        ]);
    }

    public function resolvedJobUrl(): string
    {
        $fromSetting = is_string($this->job_url) ? trim($this->job_url) : '';

        if ($fromSetting !== '') {
            return rtrim($fromSetting, '/');
        }

        return self::configJobUrl();
    }

    public function resolvedToken(): string
    {
        if (is_string($this->token) && $this->token !== '') {
            return $this->token;
        }

        $fromConfig = config('services.ocr.paddle.token');

        return is_string($fromConfig) ? $fromConfig : '';
    }

    public function resolvedModel(): string
    {
        if (is_string($this->model) && $this->model !== '') {
            return $this->model;
        }

        return self::configModel();
    }

    public static function configJobUrl(): string
    {
        $fromConfig = config('services.ocr.paddle.job_url');

        return is_string($fromConfig) && $fromConfig !== ''
            ? rtrim($fromConfig, '/')
            : self::DEFAULT_JOB_URL;
    }

    public static function configModel(): string
    {
        $fromConfig = config('services.ocr.paddle.model');

        return is_string($fromConfig) && $fromConfig !== ''
            ? $fromConfig
            : self::DEFAULT_MODEL;
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    public static function drivers(): array
    {
        return [
            [
                'value' => self::DRIVER_LOCAL,
                'label' => 'Local OCRmyPDF',
                'description' => 'Uses the FastAPI OCR service on this machine. Stores text and a searchable PDF.',
            ],
            [
                'value' => self::DRIVER_PADDLE,
                'label' => 'PaddleOCR',
                'description' => 'Uses the Baidu PaddleOCR jobs API. Stores recognized text only.',
            ],
        ];
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    public static function models(): array
    {
        return [
            [
                'value' => self::MODEL_TRADITIONAL,
                'label' => 'Traditional',
                'description' => 'PP-OCRv6. Recognizes each line of text.',
            ],
            [
                'value' => self::MODEL_VL,
                'label' => 'VL',
                'description' => 'PaddleOCR-VL-1.6. Reads the page as markdown, including tables and layout.',
            ],
        ];
    }

    /**
     * OCRmyPDF optimize levels. Ghostscript and the image optimizers
     * apply more compression as the level rises.
     *
     * @return list<array{value: int, label: string, description: string}>
     */
    public static function levels(): array
    {
        return [
            [
                'value' => 0,
                'label' => 'None',
                'description' => 'Skip Ghostscript image compression. The PDF is stored as OCRmyPDF produced it.',
            ],
            [
                'value' => 1,
                'label' => 'Lossless',
                'description' => 'Flate-compress smaller JPEG images. Quality is unchanged.',
            ],
            [
                'value' => 2,
                'label' => 'Lossy',
                'description' => 'Lossless JPEG compression plus pngquant on PNG images, at standard JPEG and PNG quality.',
            ],
            [
                'value' => 3,
                'label' => 'Strongest',
                'description' => 'Highest Flate level, JPEG quality 40, PNG quality 30, and JBIG2 for black-and-white images when jbig2enc is installed.',
            ],
        ];
    }
}
