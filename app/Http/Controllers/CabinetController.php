<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Drawer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CabinetController extends Controller
{
    public function index(): Response
    {
        $cabinets = Cabinet::query()
            ->with('drawers.books')
            ->orderBy('name')
            ->get()
            ->map(fn (Cabinet $cabinet): array => [
                'id' => (string) $cabinet->id,
                'name' => $cabinet->name,
                'location' => $cabinet->location,
                'drawers' => $cabinet->drawers
                    ->map(fn (Drawer $drawer): array => [
                        'id' => (string) $drawer->id,
                        'label' => $drawer->label,
                        'position' => $drawer->position,
                        'books' => $drawer->books
                            ->map(fn (Book $book): array => [
                                'id' => (string) $book->id,
                                'label' => $book->label,
                                'coverTitle' => $book->cover_title !== ''
                                    ? $book->cover_title
                                    : Book::DEFAULT_COVER_TITLE,
                                'position' => $book->position,
                            ])
                            ->values()
                            ->all(),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('manage/cabinets/index', [
            'cabinets' => $cabinets,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $drawers = $request->input('drawers', []);
        $request->merge([
            'drawers' => collect(is_array($drawers) ? $drawers : [])
                ->map(fn (mixed $label): mixed => is_string($label) ? trim($label) : $label)
                ->all(),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'drawers' => ['required', 'array', 'min:1', 'max:8'],
            'drawers.*' => ['required', 'string', 'max:100'],
        ]);

        DB::transaction(function () use ($validated): void {
            $cabinet = Cabinet::query()->create([
                'name' => $validated['name'],
                'location' => $validated['name'],
            ]);

            foreach (array_values($validated['drawers']) as $index => $label) {
                $cabinet->drawers()->create([
                    'label' => $label,
                    'range' => null,
                    'position' => $index + 1,
                ]);
            }
        });

        return redirect()->route('manage.cabinets.index');
    }

    public function update(Request $request, Cabinet $cabinet): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
        ]);

        $cabinet->update([
            'name' => $validated['name'],
            'location' => $validated['name'],
        ]);

        return back();
    }
}
