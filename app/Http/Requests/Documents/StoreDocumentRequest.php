<?php

namespace App\Http\Requests\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\SharedDocumentFields;
use App\Services\Offices\CurrentOffice;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->input('filing_path') !== Document::FILING_ROUTE
            || app(CurrentOffice::class)->office()?->can_upload_to_receiving === true;
    }

    protected function failedAuthorization(): never
    {
        throw new AuthorizationException('Your office cannot upload to Receiving. Archive the document or ask an administrator to enable this permission.');
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('filing_path')) {
            $this->merge(['filing_path' => Document::FILING_ARCHIVE]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,tif,tiff', 'max:51200'],
            'filing_path' => ['required', 'string', Rule::in([Document::FILING_ARCHIVE, Document::FILING_ROUTE])],
            'book_id' => [
                'exclude_unless:filing_path,'.Document::FILING_ARCHIVE, 'required', 'integer',
                Rule::exists('books', 'id')->where(fn (Builder $query) => $query->whereIn(
                    'id', Book::query()->forOffice(app(CurrentOffice::class)->id())->select('books.id')->toBase(),
                )),
            ],
            'document_route_id' => ['prohibited'],
            'document_type_id' => ['sometimes', 'nullable', 'integer', 'exists:document_types,id'],
            ...SharedDocumentFields::rules(),
            ...DocumentFieldDefinitions::rules(),
        ];
    }
}
