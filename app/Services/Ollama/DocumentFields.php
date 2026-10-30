<?php

namespace App\Services\Ollama;

class DocumentFields
{
    /**
     * @return array<string, array{label: string, max: int, date?: bool}>
     */
    public static function definitions(): array
    {
        return [
            'tax_declaration_number' => ['label' => 'Tax declaration number', 'max' => 100],
            'declaration_date' => ['label' => 'Declaration date (YYYY-MM-DD)', 'max' => 10, 'date' => true],
            'previous_tax_declaration_number' => ['label' => 'Previous tax declaration number', 'max' => 100],
            'previous_declaration_date' => ['label' => 'Previous declaration date (YYYY-MM-DD)', 'max' => 10, 'date' => true],
            'title_number' => ['label' => 'Title number', 'max' => 100],
            'registered_owner' => ['label' => 'Owner or property', 'max' => 255],
            'lot_number' => ['label' => 'Lot number', 'max' => 100],
            'pin' => ['label' => 'PIN', 'max' => 100],
            'property_location_street' => ['label' => 'Property street', 'max' => 255],
            'property_location_barangay' => ['label' => 'Property barangay', 'max' => 150],
            'property_location_district' => ['label' => 'Property district', 'max' => 150],
            'property_location_municipality' => ['label' => 'Property city or municipality', 'max' => 150],
            'owner_address_street' => ['label' => 'Owner street', 'max' => 255],
            'owner_address_barangay' => ['label' => 'Owner barangay', 'max' => 150],
            'owner_address_district' => ['label' => 'Owner district', 'max' => 150],
            'owner_address_city_municipality' => ['label' => 'Owner city or municipality', 'max' => 150],
            'province' => ['label' => 'Province', 'max' => 150],
            'area' => ['label' => 'Area as a number without units', 'max' => 20],
            'boundary_north' => ['label' => 'North boundary', 'max' => 255],
            'boundary_northeast' => ['label' => 'Northeast boundary', 'max' => 255],
            'boundary_east' => ['label' => 'East boundary', 'max' => 255],
            'boundary_southeast' => ['label' => 'Southeast boundary', 'max' => 255],
            'boundary_south' => ['label' => 'South boundary', 'max' => 255],
            'boundary_southwest' => ['label' => 'Southwest boundary', 'max' => 255],
            'boundary_west' => ['label' => 'West boundary', 'max' => 255],
            'boundary_northwest' => ['label' => 'Northwest boundary', 'max' => 255],
            'remarks' => ['label' => 'Remarks', 'max' => 10000],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        $rules = [];

        foreach (self::definitions() as $name => $definition) {
            if (($definition['date'] ?? false) === true) {
                $rules[$name] = ['nullable', 'date'];

                continue;
            }

            if ($name === 'area') {
                $rules[$name] = ['nullable', 'numeric', 'min:0', 'max:9999999999.9999'];

                continue;
            }

            $rules[$name] = ['nullable', 'string', 'max:'.$definition['max']];
        }

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public static function jsonSchema(): array
    {
        $properties = [];

        foreach (self::definitions() as $name => $definition) {
            $properties[$name] = [
                'type' => 'string',
                'description' => $definition['label'].'. Use an empty string when the text does not contain this value.',
            ];
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => array_keys(self::definitions()),
            'additionalProperties' => false,
        ];
    }

    public static function instructions(): string
    {
        $lines = [
            'Extract tax declaration fields from the OCR text.',
            'Return only the requested JSON object.',
            'Use an empty string when a value is not present. Do not guess.',
            'Dates must be YYYY-MM-DD.',
            'Area must be digits and an optional decimal point, without units.',
        ];

        foreach (self::definitions() as $name => $definition) {
            $lines[] = $name.': '.$definition['label'];
        }

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string|null>
     */
    public static function normalize(array $payload): array
    {
        $fields = [];

        foreach (self::definitions() as $name => $definition) {
            $fields[$name] = self::normalizeValue($payload[$name] ?? null, $definition, $name);
        }

        return $fields;
    }

    /**
     * @param  array{label: string, max: int, date?: bool}  $definition
     */
    private static function normalizeValue(mixed $value, array $definition, string $name): ?string
    {
        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if (($definition['date'] ?? false) === true) {
            $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

            return $date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value
                ? $value
                : null;
        }

        if ($name === 'area') {
            return is_numeric($value) ? $value : null;
        }

        if (mb_strlen($value) > $definition['max']) {
            return mb_substr($value, 0, $definition['max']);
        }

        return $value;
    }
}
