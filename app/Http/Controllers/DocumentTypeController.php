<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocumentTypeController extends Controller
{
    public function index(CurrentOffice $currentOffice): Response
    {
        abort_unless($currentOffice->office()?->can_manage_document_types, 403, 'Your office cannot manage document types.');

        $types = DocumentType::query()
            ->withCount([
                'documents' => fn (Builder $documents) => $currentOffice->constrain($documents),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (DocumentType $type): array => [
                ...$type->toOptionArray(),
                'documentCount' => (int) $type->documents_count,
                'editable' => $type->slug !== DocumentType::TAX_DECLARATION_SLUG,
            ])
            ->values();

        return Inertia::render('manage/document-types/index', [
            'types' => $types,
        ]);
    }

    public function store(Request $request, CurrentOffice $currentOffice): RedirectResponse
    {
        abort_unless($currentOffice->office()?->can_manage_document_types, 403, 'Your office cannot manage document types.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('document_types', 'name')],
        ]);

        $slug = $this->uniqueSlug($validated['name']);

        DocumentType::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'uses_tax_declaration_fields' => false,
        ]);

        return to_route('manage.document-types.index');
    }

    public function update(Request $request, DocumentType $documentType, CurrentOffice $currentOffice): RedirectResponse
    {
        abort_unless($currentOffice->office()?->can_manage_document_types, 403, 'Your office cannot manage document types.');

        if ($documentType->slug === DocumentType::TAX_DECLARATION_SLUG) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('document_types', 'name')->ignore($documentType),
            ],
        ]);

        $documentType->update([
            'name' => $validated['name'],
        ]);

        return to_route('manage.document-types.index');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $base = $base === '' ? 'document-type' : $base;
        $slug = $base;
        $suffix = 2;

        while (DocumentType::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
