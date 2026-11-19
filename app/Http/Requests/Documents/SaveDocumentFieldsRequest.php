<?php

namespace App\Http\Requests\Documents;

use App\Models\Document;
use App\Services\Documents\DocumentFieldDefinitions;
use App\Services\Documents\SharedDocumentFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveDocumentFieldsRequest extends FormRequest
{
    /** @return array<string, list<string>> */
    public function rules(): array
    {
        $rules = array_intersect_key(
            ['document_type_id' => ['required', 'integer', 'exists:document_types,id']]
                + SharedDocumentFields::rules() + DocumentFieldDefinitions::rules(),
            $this->all(),
        );

        $document = $this->route('document');
        if ($document instanceof Document && $document->document_type_id === null) {
            $rules['document_type_id'] = ['required', 'integer', 'exists:document_types,id'];
        }

        return $rules;
    }

    /** @return list<\Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->rules() === []) {
                $validator->errors()->add('fields', 'Check at least one field before saving.');
            }
        }];
    }
}
