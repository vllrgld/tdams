<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\OcrSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OcrSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $setting = OcrSetting::current();

        return Inertia::render('settings/ocr', [
            'driver' => $setting->driver,
            'model' => $setting->resolvedModel(),
            'optimize' => $setting->optimize,
            'drivers' => OcrSetting::drivers(),
            'models' => OcrSetting::models(),
            'levels' => OcrSetting::levels(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $setting = OcrSetting::current();

        $validated = $request->validate([
            'driver' => ['required', 'string', Rule::in([OcrSetting::DRIVER_LOCAL, OcrSetting::DRIVER_PADDLE])],
            'model' => [
                Rule::requiredIf($request->input('driver') === OcrSetting::DRIVER_PADDLE),
                'nullable',
                'string',
                Rule::in([OcrSetting::MODEL_TRADITIONAL, OcrSetting::MODEL_VL]),
            ],
            'optimize' => ['required', 'integer', 'between:0,3'],
        ]);

        $setting->driver = $validated['driver'];
        $setting->optimize = $validated['optimize'];

        if ($validated['driver'] === OcrSetting::DRIVER_PADDLE) {
            $setting->job_url = null;
            $setting->model = $validated['model'];
        }

        $setting->save();

        return to_route('ocr.edit')->with('status', 'ocr-saved');
    }
}
