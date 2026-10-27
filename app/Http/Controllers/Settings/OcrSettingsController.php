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
            'jobUrl' => $setting->resolvedJobUrl(),
            'model' => $setting->resolvedModel(),
            'hasToken' => $setting->resolvedToken() !== '',
            'optimize' => $setting->optimize,
            'drivers' => OcrSetting::drivers(),
            'levels' => OcrSetting::levels(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $setting = OcrSetting::current();

        $validated = $request->validate([
            'driver' => ['required', 'string', Rule::in([OcrSetting::DRIVER_LOCAL, OcrSetting::DRIVER_PADDLE])],
            'job_url' => ['required_if:driver,'.OcrSetting::DRIVER_PADDLE, 'nullable', 'string', 'url', 'max:500'],
            'token' => [
                Rule::requiredIf(
                    $request->input('driver') === OcrSetting::DRIVER_PADDLE
                    && $setting->resolvedToken() === '',
                ),
                'nullable',
                'string',
                'max:500',
            ],
            'model' => ['required_if:driver,'.OcrSetting::DRIVER_PADDLE, 'nullable', 'string', 'max:100'],
            'optimize' => ['required', 'integer', 'between:0,3'],
        ]);

        $setting->driver = $validated['driver'];
        $setting->optimize = $validated['optimize'];

        if ($validated['driver'] === OcrSetting::DRIVER_PADDLE) {
            $setting->job_url = $validated['job_url'];
            $setting->model = $validated['model'];

            if (filled($validated['token'] ?? null)) {
                $setting->token = $validated['token'];
            }
        }

        $setting->save();

        return to_route('ocr.edit')->with('status', 'ocr-saved');
    }
}
