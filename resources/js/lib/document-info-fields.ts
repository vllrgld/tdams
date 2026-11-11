import type { ArchivedDocument } from '@/types/documents';

export type DocumentInfoField = {
    name: string;
    label: string;
    type?: 'text' | 'date' | 'number' | 'textarea';
    maxLength?: number;
    fullWidth?: boolean;
};

export const documentInfoFields = {
    declaration: [
        {
            name: 'tax_declaration_number',
            label: 'Tax declaration number',
            maxLength: 100,
        },
        { name: 'declaration_date', label: 'Declaration date', type: 'date' },
        {
            name: 'previous_tax_declaration_number',
            label: 'Previous tax declaration number',
            maxLength: 100,
        },
        {
            name: 'previous_declaration_date',
            label: 'Previous declaration date',
            type: 'date',
        },
        { name: 'title_number', label: 'Title number', maxLength: 100 },
        { name: 'lot_number', label: 'Lot number', maxLength: 100 },
        { name: 'pin', label: 'PIN', maxLength: 100 },
        {
            name: 'registered_owner',
            label: 'Owner / property',
            maxLength: 255,
            fullWidth: true,
        },
    ],
    owner: [
        { name: 'owner_address_street', label: 'Street', maxLength: 255 },
        { name: 'owner_address_barangay', label: 'Barangay', maxLength: 150 },
        { name: 'owner_address_district', label: 'District', maxLength: 150 },
        {
            name: 'owner_address_city_municipality',
            label: 'City / municipality',
            maxLength: 150,
        },
    ],
    location: [
        { name: 'property_location_street', label: 'Street', maxLength: 255 },
        {
            name: 'property_location_barangay',
            label: 'Barangay',
            maxLength: 150,
        },
        {
            name: 'property_location_district',
            label: 'District',
            maxLength: 150,
        },
        {
            name: 'property_location_municipality',
            label: 'City / municipality',
            maxLength: 150,
        },
    ],
    land: [
        { name: 'province', label: 'Province', maxLength: 150 },
        { name: 'area', label: 'Area', type: 'number' },
        { name: 'boundary_north', label: 'North boundary', maxLength: 255 },
        {
            name: 'boundary_northeast',
            label: 'Northeast boundary',
            maxLength: 255,
        },
        { name: 'boundary_east', label: 'East boundary', maxLength: 255 },
        {
            name: 'boundary_southeast',
            label: 'Southeast boundary',
            maxLength: 255,
        },
        { name: 'boundary_south', label: 'South boundary', maxLength: 255 },
        {
            name: 'boundary_southwest',
            label: 'Southwest boundary',
            maxLength: 255,
        },
        { name: 'boundary_west', label: 'West boundary', maxLength: 255 },
        {
            name: 'boundary_northwest',
            label: 'Northwest boundary',
            maxLength: 255,
        },
    ],
    remarks: [
        {
            name: 'remarks',
            label: 'Remarks',
            type: 'textarea',
            maxLength: 10000,
            fullWidth: true,
        },
    ],
} satisfies Record<string, DocumentInfoField[]>;

export function documentSectionValues(
    document: ArchivedDocument,
    fields: DocumentInfoField[],
): Record<string, string> {
    return Object.fromEntries(
        fields.map(({ name }) => {
            const key = name.replace(/_([a-z])/g, (_, letter: string) =>
                letter.toUpperCase(),
            ) as keyof ArchivedDocument;
            const value =
                document[key] ??
                (name === 'property_location_barangay'
                    ? document.barangay
                    : name === 'property_location_municipality'
                      ? document.municipality
                      : null);
            return [name, value == null ? '' : String(value)];
        }),
    );
}

export function changedDocumentFields(
    initial: Record<string, string>,
    values: Record<string, string>,
): Record<string, string | null> {
    return Object.fromEntries(
        Object.entries(initial)
            .filter(
                ([name, value]) => (values[name] ?? '').trim() !== value.trim(),
            )
            .map(([name]) => [name, values[name].trim() || null]),
    );
}
