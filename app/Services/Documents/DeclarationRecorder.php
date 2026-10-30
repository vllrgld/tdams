<?php

namespace App\Services\Documents;

use App\Models\DeclarationOwner;
use App\Models\Document;
use App\Models\Owner;
use App\Models\Property;
use App\Models\TaxDeclaration;
use Illuminate\Support\Carbon;

class DeclarationRecorder
{
    /**
     * @param  array<string, mixed>  $fields
     */
    public function sync(Document $document, array $fields): void
    {
        $fields = $this->onlyRecordFields($fields);

        if ($fields === []) {
            return;
        }

        if (! $this->hasMeaningfulValue($fields) && $document->tax_declaration_id === null) {
            return;
        }

        $declaration = $this->declarationFor($document, $fields);
        $this->fillDeclaration($declaration, $fields);
        $this->fillProperty($declaration, $fields);
        $declaration->save();
        $this->fillOwner($declaration, $fields);
        $this->linkPrevious($declaration, $fields);
        $declaration->save();
        $this->linkFollowers($declaration);

        if ($document->tax_declaration_id !== $declaration->id) {
            $document->tax_declaration_id = $declaration->id;
            $document->saveQuietly();
        }

        $document->unsetRelation('taxDeclaration');
    }

    /**
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function onlyRecordFields(array $fields): array
    {
        $record = [];

        foreach (Document::RECORD_FIELDS as $field) {
            if (array_key_exists($field, $fields)) {
                $record[$field] = $fields[$field];
            }
        }

        return $record;
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function hasMeaningfulValue(array $fields): bool
    {
        foreach ($fields as $value) {
            if ($this->nullableString($value) !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function declarationFor(Document $document, array $fields): TaxDeclaration
    {
        $number = array_key_exists('tax_declaration_number', $fields)
            ? $this->nullableString($fields['tax_declaration_number'])
            : null;
        $existing = $number === null ? null : $this->findByNumber($number);
        $current = $document->taxDeclaration;

        if ($existing instanceof TaxDeclaration && ($current === null || $existing->id !== $current->id)) {
            return $existing;
        }

        if ($current instanceof TaxDeclaration && $this->usedByAnotherDocument($current, $document) && $number !== null && strcasecmp((string) $current->tax_declaration_number, $number) !== 0) {
            return new TaxDeclaration;
        }

        return $current ?? new TaxDeclaration;
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function fillDeclaration(TaxDeclaration $declaration, array $fields): void
    {
        if (array_key_exists('tax_declaration_number', $fields)) {
            $declaration->tax_declaration_number = $this->nullableString($fields['tax_declaration_number']);
        }

        if (array_key_exists('declaration_date', $fields)) {
            $declaration->declaration_date = $this->nullableString($fields['declaration_date']);
        }

        if (array_key_exists('remarks', $fields)) {
            $declaration->remarks = $this->nullableString($fields['remarks']);
        }
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function fillProperty(TaxDeclaration $declaration, array $fields): void
    {
        $mapped = $this->propertyValues($fields);

        if ($mapped === []) {
            return;
        }

        $pin = array_key_exists('pin', $mapped) ? $mapped['pin'] : null;
        $property = $pin !== null ? $this->findPropertyByPin($pin) : null;
        $property ??= $declaration->property;

        if (! $property instanceof Property) {
            if (! $this->hasMeaningfulValue($mapped)) {
                return;
            }

            $property = new Property;
        }

        foreach ($mapped as $column => $value) {
            $property->setAttribute($column, $value);
        }

        $property->save();

        $previousPropertyId = $declaration->property_id;
        $declaration->property_id = $property->id;

        if (is_int($previousPropertyId) && $previousPropertyId !== $property->id) {
            $this->deleteUnusedProperty($previousPropertyId, $declaration->id);
        }
    }

    /**
     * @param  array<string, mixed>  $fields
     * @return array<string, string|null>
     */
    private function propertyValues(array $fields): array
    {
        $map = [
            'lot_number' => 'lot_number',
            'title_number' => 'title_number',
            'pin' => 'pin',
            'area' => 'area',
            'province' => 'province',
            'property_location_street' => 'street',
            'property_location_barangay' => 'barangay',
            'property_location_district' => 'district',
            'property_location_municipality' => 'municipality',
            'boundary_north' => 'boundary_north',
            'boundary_northeast' => 'boundary_northeast',
            'boundary_east' => 'boundary_east',
            'boundary_southeast' => 'boundary_southeast',
            'boundary_south' => 'boundary_south',
            'boundary_southwest' => 'boundary_southwest',
            'boundary_west' => 'boundary_west',
            'boundary_northwest' => 'boundary_northwest',
        ];
        $values = [];

        foreach ($map as $field => $column) {
            if (array_key_exists($field, $fields)) {
                $values[$column] = $this->nullableString($fields[$field]);
            }
        }

        if (! array_key_exists('municipality', $values) && array_key_exists('municipality', $fields)) {
            $values['municipality'] = $this->nullableString($fields['municipality']);
        }

        if (! array_key_exists('barangay', $values) && array_key_exists('barangay', $fields)) {
            $values['barangay'] = $this->nullableString($fields['barangay']);
        }

        return $values;
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function fillOwner(TaxDeclaration $declaration, array $fields): void
    {
        $mapped = [];
        $map = [
            'registered_owner' => 'name',
            'owner_address_street' => 'street',
            'owner_address_barangay' => 'barangay',
            'owner_address_district' => 'district',
            'owner_address_city_municipality' => 'municipality',
        ];

        foreach ($map as $field => $column) {
            if (array_key_exists($field, $fields)) {
                $mapped[$column] = $this->nullableString($fields[$field]);
            }
        }

        if ($mapped === []) {
            return;
        }

        $declaration->loadMissing('owners');
        $owner = $declaration->owners->first();

        if ($owner instanceof Owner && $this->ownerIsShared($owner, $declaration)) {
            $declaration->owners()->detach($owner->id);
            $declaration->unsetRelation('owners');
            $owner = null;
        }

        if (! $owner instanceof Owner) {
            if (! $this->hasMeaningfulValue($mapped)) {
                return;
            }

            $owner = new Owner;
        }

        foreach ($mapped as $column => $value) {
            if ($column === 'name') {
                $owner->name = $value ?? '';
                $owner->normalized_name = Owner::normalizeName($owner->name);

                continue;
            }

            $owner->setAttribute($column, $value);
        }

        if ($owner->name === null) {
            $owner->name = '';
            $owner->normalized_name = '';
        }

        $owner->save();

        $alreadyLinked = $declaration->owners->contains(fn (Owner $linked): bool => $linked->id === $owner->id);

        if (! $alreadyLinked) {
            $declaration->owners()->attach($owner->id, ['position' => 0]);
        }
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function linkPrevious(TaxDeclaration $declaration, array $fields): void
    {
        if (! array_key_exists('previous_tax_declaration_number', $fields) && ! array_key_exists('previous_declaration_date', $fields)) {
            return;
        }

        if (array_key_exists('previous_tax_declaration_number', $fields)) {
            $declaration->previous_tax_declaration_number = $this->nullableString($fields['previous_tax_declaration_number']);
        }

        if (array_key_exists('previous_declaration_date', $fields)) {
            $declaration->previous_declaration_date = $this->nullableString($fields['previous_declaration_date']);
        }

        $number = $declaration->previous_tax_declaration_number;
        $previousId = $number === null ? null : $this->findByNumber($number)?->id;

        $declaration->previous_declaration_id = $previousId !== null && $declaration->id !== null && $previousId !== $declaration->id
            ? $previousId
            : null;
    }

    private function linkFollowers(TaxDeclaration $declaration): void
    {
        $number = $declaration->tax_declaration_number;

        if ($number === null || $number === '' || $declaration->id === null) {
            return;
        }

        TaxDeclaration::query()
            ->whereNull('previous_declaration_id')
            ->where('id', '!=', $declaration->id)
            ->whereRaw('LOWER(previous_tax_declaration_number) = ?', [mb_strtolower($number)])
            ->update(['previous_declaration_id' => $declaration->id]);
    }

    private function findByNumber(string $number): ?TaxDeclaration
    {
        return TaxDeclaration::query()
            ->whereRaw('LOWER(tax_declaration_number) = ?', [mb_strtolower($number)])
            ->first();
    }

    private function findPropertyByPin(string $pin): ?Property
    {
        return Property::query()
            ->whereRaw('LOWER(pin) = ?', [mb_strtolower($pin)])
            ->first();
    }

    private function usedByAnotherDocument(TaxDeclaration $declaration, Document $document): bool
    {
        return $declaration->documents()
            ->where('id', '!=', $document->id)
            ->exists();
    }

    private function ownerIsShared(Owner $owner, TaxDeclaration $declaration): bool
    {
        return DeclarationOwner::query()
            ->where('owner_id', $owner->id)
            ->where('tax_declaration_id', '!=', $declaration->id)
            ->exists();
    }

    private function deleteUnusedProperty(int $propertyId, ?int $exceptDeclarationId): void
    {
        $query = TaxDeclaration::query()->where('property_id', $propertyId);

        if ($exceptDeclarationId !== null) {
            $query->where('id', '!=', $exceptDeclarationId);
        }

        if ($query->exists()) {
            return;
        }

        Property::query()->whereKey($propertyId)->delete();
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toDateString();
        }

        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
