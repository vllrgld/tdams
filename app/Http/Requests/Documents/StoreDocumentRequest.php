<?php

namespace App\Http\Requests\Documents;

use App\Services\Documents\DocumentFieldDefinitions;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,tif,tiff', 'max:51200'],
            'book_id' => ['required', 'integer', 'exists:books,id'],
            ...DocumentFieldDefinitions::rules(),
        ];
    }
}
