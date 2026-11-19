<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Drawer;
use App\Services\Offices\CurrentOffice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request, CurrentOffice $currentOffice): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);
        $query = trim((string) ($validated['q'] ?? ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'cabinets' => [],
                'drawers' => [],
                'books' => [],
            ]);
        }

        $like = '%'.addcslashes($query, '%_\\').'%';

        $cabinets = Cabinet::query()
            ->forOffice($currentOffice->id())
            ->where(function ($builder) use ($like): void {
                $builder->where('name', 'like', $like)
                    ->orWhere('location', 'like', $like);
            })
            ->orderBy('name')
            ->limit(6)
            ->get()
            ->map(fn (Cabinet $cabinet): array => [
                'id' => $cabinet->id,
                'title' => $cabinet->name,
                'hint' => $cabinet->location !== '' && $cabinet->location !== $cabinet->name
                    ? 'Archive > '.$cabinet->location
                    : 'Archive',
                'url' => route('archive.index', ['cabinet' => $cabinet->id], absolute: false),
            ])
            ->values();

        $drawers = Drawer::query()
            ->forOffice($currentOffice->id())
            ->with('cabinet')
            ->where(function ($builder) use ($like): void {
                $builder->where('label', 'like', $like)
                    ->orWhere('range', 'like', $like);
            })
            ->orderBy('label')
            ->limit(6)
            ->get()
            ->map(function (Drawer $drawer): array {
                $cabinet = $drawer->cabinet;

                return [
                    'id' => $drawer->id,
                    'title' => $drawer->label,
                    'hint' => 'Archive > '.$cabinet->name,
                    'url' => route('archive.index', [
                        'cabinet' => $cabinet->id,
                        'drawer' => $drawer->id,
                    ], absolute: false),
                ];
            })
            ->values();

        $books = Book::query()
            ->forOffice($currentOffice->id())
            ->with('drawer.cabinet')
            ->where(function ($builder) use ($like): void {
                $builder->where('label', 'like', $like)
                    ->orWhere(function ($builder) use ($like): void {
                        $builder->where('cover_title', 'like', $like)
                            ->where('cover_title', '!=', Book::DEFAULT_COVER_TITLE);
                    });
            })
            ->orderBy('label')
            ->limit(6)
            ->get()
            ->map(function (Book $book): array {
                $drawer = $book->drawer;
                $cabinet = $drawer->cabinet;

                return [
                    'id' => $book->id,
                    'title' => $book->label,
                    'kind' => $book->kind,
                    'hint' => $cabinet->name.' > '.$drawer->label,
                    'url' => route('archive.index', [
                        'cabinet' => $cabinet->id,
                        'drawer' => $drawer->id,
                        'book' => $book->id,
                    ], absolute: false),
                ];
            })
            ->values();

        return response()->json([
            'cabinets' => $cabinets,
            'drawers' => $drawers,
            'books' => $books,
        ]);
    }
}
