<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Cabinet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CabinetController extends Controller
{
    public function index(): Response
    {
        $cabinets = [];

        foreach (Cabinet::query()->with('drawers.books')->orderBy('name')->get() as $cabinet) {
            $drawers = [];

            foreach ($cabinet->drawers as $drawer) {
                $books = [];

                foreach ($drawer->books as $book) {
                    $books[] = [
                        'id' => (string) $book->id,
                        'label' => $book->label,
                        'kind' => $book->kind,
                        'coverTitle' => $book->cover_title !== '' ? $book->cover_title : Book::DEFAULT_COVER_TITLE,
                        'position' => $book->position,
                    ];
                }

                $drawers[] = ['id' => (string) $drawer->id, 'label' => $drawer->label, 'position' => $drawer->position, 'books' => $books];
            }

            $cabinets[] = ['id' => (string) $cabinet->id, 'name' => $cabinet->name, 'location' => $cabinet->location, 'drawers' => $drawers];
        }

        return Inertia::render('manage/cabinets/index', [
            'cabinets' => $cabinets,
            'coverTitle' => Book::coverTitle(),
            'folderCoverTitle' => Book::coverTitle('folder'),
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
