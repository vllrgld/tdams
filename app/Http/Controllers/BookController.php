<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Drawer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(): Response
    {
        $books = Book::query()
            ->with(['drawer.cabinet'])
            ->get()
            ->sortBy([
                fn (Book $book): string => mb_strtolower($book->drawer->cabinet->name),
                fn (Book $book): int => $book->drawer->position,
                fn (Book $book): int => $book->position,
            ])
            ->values()
            ->map(fn (Book $book): array => [
                'id' => (string) $book->id,
                'label' => $book->label,
                'position' => $book->position,
                'drawerId' => (string) $book->drawer->id,
                'drawerLabel' => $book->drawer->label,
                'cabinetId' => (string) $book->drawer->cabinet->id,
                'cabinetName' => $book->drawer->cabinet->name,
            ])
            ->all();

        return Inertia::render('manage/books/index', [
            'books' => $books,
            'coverTitle' => Book::coverTitle(),
        ]);
    }

    public function store(Request $request, Drawer $drawer): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
        ]);

        if ($drawer->books()->count() >= Book::MAX_PER_DRAWER) {
            throw ValidationException::withMessages([
                'label' => 'A drawer can hold at most 16 books.',
            ]);
        }

        $position = (int) $drawer->books()->max('position') + 1;

        $drawer->books()->create([
            'label' => $validated['label'],
            'cover_title' => Book::coverTitle(),
            'position' => $position,
        ]);

        return back();
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'cover_title' => ['sometimes', 'required', 'string', 'max:80'],
        ]);

        $book->update([
            'label' => $validated['label'],
        ]);

        if (array_key_exists('cover_title', $validated)) {
            Book::query()->update([
                'cover_title' => $validated['cover_title'],
            ]);
        }

        return back();
    }
}
