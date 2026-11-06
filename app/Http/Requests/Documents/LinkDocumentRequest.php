<?php

namespace App\Http\Requests\Documents;

use Illuminate\Foundation\Http\FormRequest;

class LinkDocumentRequest extends FormRequest
{
    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'previous_tax_declaration_number' => ['nullable', 'string', 'max:100'],
            'previous_declaration_date' => ['nullable', 'date'],
        ];
    }
}
