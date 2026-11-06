<?php

namespace App\Http\Requests\Documents;

use App\Services\Documents\DocumentFieldDefinitions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveDocumentFieldsRequest extends FormRequest
{
    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return array_intersect_key(DocumentFieldDefinitions::rules(), $this->all());
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
