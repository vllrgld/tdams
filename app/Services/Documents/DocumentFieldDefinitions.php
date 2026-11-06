<?php

namespace App\Services\Documents;

class DocumentFieldDefinitions
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

        return $rules + [
            'municipality' => ['nullable', 'string', 'max:150'],
            'barangay' => ['nullable', 'string', 'max:150'],
        ];
    }

    /**
     * @return list<array{id: string, title: string, tabLabel: string, fields: list<array{name: string, label: string, maxLength: int, type: string}>}>
     */
    public static function reviewSections(): array
    {
        $sections = [
            ['id' => 'declaration', 'title' => 'Declaration details', 'tabLabel' => 'Declaration', 'fields' => [
                'tax_declaration_number', 'declaration_date', 'previous_tax_declaration_number', 'previous_declaration_date',
            ]],
            ['id' => 'property', 'title' => 'Property details', 'tabLabel' => 'Property', 'fields' => [
                'title_number', 'lot_number', 'pin', 'property_location_street', 'property_location_barangay',
                'property_location_district', 'property_location_municipality', 'province', 'area',
            ]],
            ['id' => 'owner', 'title' => 'Owner details', 'tabLabel' => 'Owner', 'fields' => [
                'registered_owner', 'owner_address_street', 'owner_address_barangay', 'owner_address_district', 'owner_address_city_municipality',
            ]],
            ['id' => 'boundaries', 'title' => 'Boundaries', 'tabLabel' => 'Boundaries', 'fields' => [
                'boundary_north', 'boundary_northeast', 'boundary_east', 'boundary_southeast',
                'boundary_south', 'boundary_southwest', 'boundary_west', 'boundary_northwest',
            ]],
            ['id' => 'remarks', 'title' => 'Remarks', 'tabLabel' => 'Remarks', 'fields' => ['remarks']],
        ];
        $labels = [
            'declaration_date' => 'Declaration date',
            'previous_declaration_date' => 'Previous declaration date',
            'registered_owner' => 'Owner / property',
            'property_location_street' => 'Street',
            'property_location_barangay' => 'Barangay',
            'property_location_district' => 'District',
            'property_location_municipality' => 'City / municipality',
            'owner_address_street' => 'Street',
            'owner_address_barangay' => 'Barangay',
            'owner_address_district' => 'District',
            'owner_address_city_municipality' => 'City / municipality',
            'area' => 'Area',
        ];
        $definitions = self::definitions();
        $review = [];

        foreach ($sections as $section) {
            $fields = [];

            foreach ($section['fields'] as $name) {
                $definition = $definitions[$name];
                $fields[] = [
                    'name' => $name,
                    'label' => $labels[$name] ?? $definition['label'],
                    'maxLength' => $definition['max'],
                    'type' => match (true) {
                        ($definition['date'] ?? false) === true => 'date',
                        $name === 'area' => 'number',
                        $name === 'remarks' => 'textarea',
                        default => 'text',
                    },
                ];
            }

            $review[] = [
                ...$section,
                'fields' => $fields,
            ];
        }

        return $review;
    }
}
