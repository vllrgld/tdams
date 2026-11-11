<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\TaxDeclaration;
use App\Services\Documents\ArchiveResetter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DataSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless(app()->environment(['local', 'testing']), 404);

        return Inertia::render('settings/data', [
            'counts' => [
                'documents' => Document::query()->count(),
                'declarations' => TaxDeclaration::query()->count(),
                'cabinets' => Cabinet::query()->count(),
                'books' => Book::query()->count(),
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function destroy(Request $request, ArchiveResetter $resetter): RedirectResponse
    {
        abort_unless(app()->environment(['local', 'testing']), 404);

        $request->validate([
            'confirmation' => ['required', 'string', Rule::in(['RESET'])],
        ], [
            'confirmation.required' => 'Type RESET to confirm the archive reset.',
            'confirmation.in' => 'Type RESET to confirm the archive reset.',
        ]);

        $resetter->reset();

        return to_route('data.edit')->with('status', 'archive-reset');
    }
}
