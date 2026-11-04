<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Drawer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(): Response
    {
        return $this->managementIndex('book');
    }

    public function folders(): Response
    {
        return $this->managementIndex('folder');
    }

    private function managementIndex(string $kind): Response
    {
        $books = Book::query()
            ->where('kind', $kind)
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
                'kind' => $book->kind,
                'position' => $book->position,
                'drawerId' => (string) $book->drawer->id,
                'drawerLabel' => $book->drawer->label,
                'cabinetId' => (string) $book->drawer->cabinet->id,
                'cabinetName' => $book->drawer->cabinet->name,
            ])
            ->all();

        return Inertia::render($kind === 'folder' ? 'manage/folders/index' : 'manage/books/index', [
            'books' => $books,
            'coverTitle' => Book::coverTitle($kind),
            'kind' => $kind,
        ]);
    }

    public function store(Request $request, Drawer $drawer): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'kind' => ['sometimes', 'required', Rule::in(['book', 'folder'])],
        ]);

        DB::transaction(function () use ($drawer, $validated): void {
            // Lock the drawer so simultaneous first additions cannot mix types.
            $lockedDrawer = Drawer::query()->lockForUpdate()->findOrFail($drawer->id);
            $contents = $lockedDrawer->books()->get();
            $kind = $validated['kind'] ?? 'book';
            $existingKind = $contents->first()?->kind;

            if ($existingKind !== null && $existingKind !== $kind) {
                throw ValidationException::withMessages([
                    'kind' => "This drawer holds {$existingKind}s. Books and folders cannot share a drawer.",
                ]);
            }

            if ($contents->count() >= Book::MAX_PER_DRAWER) {
                throw ValidationException::withMessages([
                    'label' => "A drawer can hold at most 16 {$kind}s.",
                ]);
            }

            $lockedDrawer->books()->create([
                'label' => $validated['label'],
                'kind' => $kind,
                'cover_title' => Book::coverTitle($kind),
                'position' => (int) $contents->max('position') + 1,
            ]);
        });

        return back();
    }

    public function update(Request $request, Book $book): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'cover_title' => ['sometimes', 'required', 'string', 'max:80'],
        ]);

        DB::transaction(function () use ($book, $validated): void {
            $book->update([
                'label' => $validated['label'],
            ]);

            if (array_key_exists('cover_title', $validated)) {
                Book::query()->where('kind', $book->kind)->update([
                    'cover_title' => $validated['cover_title'],
                ]);
            }
        });

        return back();
    }
}
