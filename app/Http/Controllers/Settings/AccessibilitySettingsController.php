<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccessibilitySettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/accessibility');
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'animations' => ['required', 'array:bookPickup,bookReturn,folderPickup,folderReturn'],
            'animations.bookPickup' => ['required', 'string', Rule::in(['full', 'fade'])],
            'animations.bookReturn' => ['required', 'string', Rule::in(['full', 'fade'])],
            'animations.folderPickup' => ['required', 'string', Rule::in(['full', 'fade'])],
            'animations.folderReturn' => ['required', 'string', Rule::in(['full', 'fade'])],
        ]);

        $user = $request->user();
        $settings = $user->accessibility_settings ?? [];
        $settings['animations'] = $validated['animations'];
        $user->forceFill(['accessibility_settings' => $settings])->save();

        return to_route('accessibility.edit');
    }
}
