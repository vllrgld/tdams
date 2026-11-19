<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TrackingCodeSetting;
use App\Services\Documents\DocumentTrackingCodes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackingCodeSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/tracking-codes', [
            'prefix' => TrackingCodeSetting::current()->prefix,
            'year' => now()->format('Y'),
            'missingCount' => Document::query()->where('filing_path', Document::FILING_ROUTE)->whereNull('tracking_code')->count(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        if (is_string($request->input('prefix'))) {
            $request->merge(['prefix' => strtoupper(trim($request->string('prefix')->toString()))]);
        }
        $validated = $request->validate(['prefix' => ['required', 'string', 'regex:/^[A-Z][A-Z0-9]{1,9}$/']], [
            'prefix.regex' => 'Use 2 to 10 letters or numbers, starting with a letter.',
        ]);
        TrackingCodeSetting::current()->update(['prefix' => $validated['prefix']]);

        return to_route('tracking-codes.edit')->with('status', 'tracking-codes-saved');
    }

    public function assignMissing(DocumentTrackingCodes $codes): RedirectResponse
    {
        $codes->assignMissing();

        return to_route('tracking-codes.edit')->with('status', 'tracking-codes-assigned');
    }
}
