<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Drawer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookController extends Controller
{
    public function store(Request $request, Drawer $drawer): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
        ]);

        if ($drawer->books()->count() >= Book::MAX_PER_DRAWER) {
            throw ValidationException::withMessages([
                'label' => 'A drawer can hold at most 8 books.',
            ]);
        }

        $position = (int) $drawer->books()->max('position') + 1;

        $drawer->books()->create([
            'label' => $validated['label'],
            'position' => $position,
        ]);

        return back();
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
        ]);

        $book->update([
            'label' => $validated['label'],
        ]);

        return back();
    }
}
