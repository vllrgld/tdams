<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Drawer;
use App\Services\Offices\CurrentOffice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(CurrentOffice $currentOffice): Response
    {
        return $this->managementIndex('book', $currentOffice);
    }

    public function folders(CurrentOffice $currentOffice): Response
    {
        return $this->managementIndex('folder', $currentOffice);
    }

    public function leverArchFiles(CurrentOffice $currentOffice): Response
    {
        return $this->managementIndex('lever_arch', $currentOffice);
    }

    private function managementIndex(string $kind, CurrentOffice $currentOffice): Response
    {
        $books = Book::query()
            ->forOffice($currentOffice->id())
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
                'coverTitle' => $book->cover_title !== '' ? $book->cover_title : Book::DEFAULT_COVER_TITLE,
                'position' => $book->position,
                'drawerId' => (string) $book->drawer->id,
                'drawerLabel' => $book->drawer->label,
                'cabinetId' => (string) $book->drawer->cabinet->id,
                'cabinetName' => $book->drawer->cabinet->name,
            ])
            ->all();

        return Inertia::render(match ($kind) {
            'folder' => 'manage/folders/index',
            'lever_arch' => 'manage/lever-arch-files/index',
            default => 'manage/books/index',
        }, [
            'books' => $books,
            'kind' => $kind,
        ]);
    }

    public function store(Request $request, Drawer $drawer): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'kind' => ['sometimes', 'required', Rule::in(['book', 'folder', 'lever_arch'])],
        ]);

        DB::transaction(function () use ($drawer, $validated): void {
            // Lock the drawer so simultaneous first additions cannot mix types.
            $lockedDrawer = Drawer::query()->lockForUpdate()->findOrFail($drawer->id);
            $contents = $lockedDrawer->books()->get();
            $kind = $validated['kind'] ?? 'book';
            $existingKind = $contents->first()?->kind;
            $itemName = $kind === 'lever_arch' ? 'lever arch file' : $kind;

            if ($existingKind !== null && $existingKind !== $kind) {
                throw ValidationException::withMessages([
                    'kind' => 'This drawer holds '.($existingKind === 'lever_arch' ? 'lever arch files' : "{$existingKind}s").' only. Filing types cannot share a drawer.',
                ]);
            }

            if ($contents->count() >= Book::MAX_PER_DRAWER) {
                throw ValidationException::withMessages([
                    'label' => "A drawer can hold at most 16 {$itemName}s.",
                ]);
            }

            $lockedDrawer->books()->create([
                'label' => $validated['label'],
                'kind' => $kind,
                'cover_title' => Book::DEFAULT_COVER_TITLE,
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

        $book->update($validated);

        return back();
    }
}
