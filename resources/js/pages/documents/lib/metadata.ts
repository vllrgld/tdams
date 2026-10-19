import type { MetadataField } from '../types';

export const metadataSections: {
    title: string;
    fields: {
        name: MetadataField;
        label: string;
        maxLength?: number;
        type?: 'text' | 'number' | 'date';
    }[];
}[] = [
    {
        title: 'Declaration details',
        fields: [
            {
                name: 'tax_declaration_number',
                label: 'Tax declaration number',
                maxLength: 100,
            },
            {
                name: 'declaration_date',
                label: 'Declaration date',
                type: 'date',
            },
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
            {
                name: 'registered_owner',
                label: 'Owner / property',
                maxLength: 255,
            },
            { name: 'lot_number', label: 'Lot number', maxLength: 100 },
            { name: 'pin', label: 'PIN', maxLength: 100 },
        ],
    },
    {
        title: 'Location of property',
        fields: [
            {
                name: 'property_location_street',
                label: 'Street',
                maxLength: 255,
            },
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
    },
    {
        title: 'Address of owner',
        fields: [
            { name: 'owner_address_street', label: 'Street', maxLength: 255 },
            {
                name: 'owner_address_barangay',
                label: 'Barangay',
                maxLength: 150,
            },
            {
                name: 'owner_address_district',
                label: 'District',
                maxLength: 150,
            },
            {
                name: 'owner_address_city_municipality',
                label: 'City / municipality',
                maxLength: 150,
            },
        ],
    },
    {
        title: 'Land details',
        fields: [
            { name: 'province', label: 'Province', maxLength: 150 },
            { name: 'area', label: 'Area' },
            { name: 'boundary_north', label: 'North boundary', maxLength: 255 },
            { name: 'boundary_south', label: 'South boundary', maxLength: 255 },
            { name: 'boundary_east', label: 'East boundary', maxLength: 255 },
            { name: 'boundary_west', label: 'West boundary', maxLength: 255 },
        ],
    },
];
