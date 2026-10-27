<?php

namespace App\Services\Ocr;

use App\Models\OcrSetting;

class OcrManager
{
    public function extractor(?OcrSetting $setting = null): OcrExtractor
    {
        $setting ??= OcrSetting::current();

        return match ($setting->driver) {
            OcrSetting::DRIVER_PADDLE => app(PaddleOcrClient::class),
            default => app(LocalOcrClient::class),
        };
    }
}
