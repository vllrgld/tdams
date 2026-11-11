import type { ArchivedDocument } from '@/types/documents';

export type DocumentViewMode = 'cards' | 'preview' | 'list';

export type DocumentOcrReviewFilter = 'all' | 'reviewed' | 'unreviewed';

export type DocumentSortDirection = 'asc' | 'desc';

export type DocumentSortField = 'created_at' | 'declaration_date';

export type DocumentSortFilters = {
    sort: DocumentSortField;
    direction: DocumentSortDirection;
};

export type DocumentUploadOptions = {
    archive: ArchivePlacementCabinet[];
    mappingModels: string[];
    fieldSections: DocumentFieldSection[];
};

export type DocumentDateFilters = {
    declaration_date_from: string;
    declaration_date_to: string;
    date_added_from: string;
    date_added_to: string;
    date_timezone: string;
};

export type SearchFieldOption = {
    value: string;
    label: string;
};

export type ArchivePlacementItem = {
    id: string;
    label: string;
    kind: 'book' | 'folder';
    coverTitle: string;
};

export type ArchivePlacementDrawer = {
    id: string;
    label: string;
    books: ArchivePlacementItem[];
};

export type ArchivePlacementCabinet = {
    id: string;
    name: string;
    drawers: ArchivePlacementDrawer[];
};

export type DocumentsPageProps = {
    documents: {
        data: ArchivedDocument[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
    archive: ArchivePlacementCabinet[];
    filters: {
        q: string;
        field: string;
        direction: DocumentSortDirection;
        sort: DocumentSortField;
        ocr_review: DocumentOcrReviewFilter;
    } & DocumentDateFilters;
    searchFields: SearchFieldOption[];
    mappingModels: string[];
    fieldSections: DocumentFieldSection[];
    selectedDocument?: ArchivedDocument | null;
};

export type DocumentFieldValues = {
    tax_declaration_number: string;
    declaration_date: string;
    lot_number: string;
    registered_owner: string;
    previous_tax_declaration_number: string;
    previous_declaration_date: string;
    title_number: string;
    property_location_street: string;
    property_location_barangay: string;
    property_location_district: string;
    property_location_municipality: string;
    owner_address_street: string;
    owner_address_barangay: string;
    owner_address_district: string;
    owner_address_city_municipality: string;
    province: string;
    pin: string;
    boundary_north: string;
    boundary_northeast: string;
    boundary_east: string;
    boundary_southeast: string;
    boundary_south: string;
    boundary_southwest: string;
    boundary_west: string;
    boundary_northwest: string;
    area: string;
    remarks: string;
};

export type MetadataField = keyof DocumentFieldValues;

export type UploadDocumentPayload = { file: File; book_id: string };

export type SaveDocumentFieldsPayload = Partial<DocumentFieldValues>;

export type DocumentFieldDefinition = {
    name: MetadataField;
    label: string;
    maxLength: number;
    type: 'text' | 'number' | 'date' | 'textarea';
    help?: string;
};

export type DocumentFieldSection = {
    id: 'declaration' | 'property' | 'owner' | 'boundaries' | 'remarks';
    title: string;
    tabLabel: string;
    fields: DocumentFieldDefinition[];
};
