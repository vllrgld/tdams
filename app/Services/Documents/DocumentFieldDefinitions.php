<?php

namespace App\Services\Documents;

class DocumentFieldDefinitions
{
    public static function helpText(string $name): string
    {
        if (str_starts_with($name, 'boundary_')) {
            return ucfirst(substr($name, 9)).' boundary as printed. Keep lot numbers, names, roads, and suffixes; stop at the next direction. This is a neighboring boundary, not the property lot number.';
        }

        return match ($name) {
            'tax_declaration_number' => 'Current ARPN/TD No. or Tax Declaration No. near the heading. Keep leading zeros and suffixes; exclude the cancelled declaration.',
            'declaration_date' => 'Date explicitly tied to this declaration. Do not use a title date, revision year, effectivity quarter/year, or upload date. Leave incomplete dates blank.',
            'previous_tax_declaration_number' => 'The populated TD number after “This TD cancels”, “This declaration cancels”, or Previous TD No. Stop before owner, PIN, or assessed value.',
            'previous_declaration_date' => 'Only a complete date explicitly tied to the previous declaration. Do not infer a date from its number or the current declaration.',
            'title_number' => 'OCT, TCT, CCT, or CLOA number as printed. Exclude Survey No., Lot No., TD No., and PIN. Blank ruled lines mean no value.',
            'registered_owner' => 'The current Owner field, including heirs or other ownership qualifiers. Exclude the administrator, beneficial user, previous owner, and signatories.',
            'lot_number' => 'The property’s own Lot No. or Lot Number. Keep leading zeros and suffixes. Never copy North/South/East/West boundary lots, Survey No., or Blk. No.',
            'pin' => 'Current Property Identification No., Property Index Number, PIN, or P.I.N. Keep leading zeros and hyphens; exclude a previous-assessment PIN.',
            'property_location_street' => 'Number and street in Location of Property. Do not copy the owner or administrator address into this field.',
            'property_location_barangay' => 'Use the property value labeled Barangay or Brgy. For a combined Barangay/District or Brgy./District label, map the value to Barangay by default. Do not leave it blank solely because the label is combined.',
            'property_location_district' => 'Use the property value explicitly labeled District alone. A combined Barangay/District value belongs in Barangay by default. Do not duplicate it in District; only populate District when separately specified.',
            'property_location_municipality' => 'City or municipality in Location of Property. Keep it separate from the barangay/district and province; follow the printed column labels.',
            'owner_address_street' => 'Number and street in the current owner’s Address field. An address under Administrator/Beneficial User belongs to that person, not automatically to the owner.',
            'owner_address_barangay' => 'Use the current owner address value labeled Barangay or Brgy. For a combined Barangay/District or Brgy./District label, map the value to Barangay by default. Do not copy the administrator address or property location.',
            'owner_address_district' => 'Use the current owner address value explicitly labeled District alone. A combined Barangay/District value belongs in Barangay by default. Do not copy the administrator address or property location.',
            'owner_address_city_municipality' => 'City or municipality explicitly identified in the current owner’s address. Do not substitute the administrator’s address or the property location.',
            'province' => 'Province for the property location. For a combined Province/City column, preserve the printed value without inferring missing address parts.',
            'area' => 'The land/property area, as a number without units or thousands separators. Do not use a building floor area, boundary number, market value, or assessed value. Do not sum different property kinds.',
            'remarks' => 'Property-specific Remarks, Memoranda, and Notes, including populated cancellation and revision details. Preserve wording; exclude signatures and blank templates.',
            default => 'Copy only a value supported by the document. Leave absent or ambiguous values blank.',
        };
    }

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
     * @return list<array{id: string, title: string, tabLabel: string, fields: list<array{name: string, label: string, maxLength: int, type: string, help: string}>}>
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
                    'help' => self::helpText($name),
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
