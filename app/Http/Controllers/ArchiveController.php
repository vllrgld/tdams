<?php

namespace App\Http\Controllers;

use App\Models\Cabinet;
use Inertia\Inertia;
use Inertia\Response;

class ArchiveController extends Controller
{
    public function index(): Response
    {
        $cabinets = Cabinet::query()
            ->with('drawers.books.documents')
            ->orderBy('name')
            ->get()
            ->map(fn (Cabinet $cabinet): array => $cabinet->toFilingArray())
            ->values()
            ->all();

        return Inertia::render('archive/index', [
            'cabinets' => $cabinets,
        ]);
    }
}
