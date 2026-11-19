import type { ArchivedDocument, DocumentStatus } from '@/types/documents';
import type { CabinetColor } from '@/lib/cabinet-colors';

export type DocumentViewMode = 'cards' | 'preview' | 'list';

export type DocumentOcrReviewFilter = 'all' | 'reviewed' | 'unreviewed';

export type DocumentStatusFilter = 'all' | DocumentStatus;

export type DocumentSearchMode = 'all' | 'tax';

export type DocumentSortDirection = 'asc' | 'desc';

export type DocumentSortField = 'created_at' | 'declaration_date';

export type DocumentSortFilters = {
    sort: DocumentSortField;
    direction: DocumentSortDirection;
};

export type DocumentTypeOption = {
    id: number;
    name: string;
    slug: string;
    usesTaxFields: boolean;
    documentCount: number;
};

export type DocumentRouteOption = {
    id: number;
    name: string;
    steps: string[];
};

export type FilingPath = 'archive' | 'route';

export type DocumentUploadOptions = {
    archive: ArchivePlacementCabinet[];
    recentArchiveItemIds: string[];
    mappingModels: string[];
    documentTypes: DocumentTypeOption[];
    fieldSections: DocumentFieldSection[];
    metadataFieldSections: DocumentFieldSection[];
};

export type DocumentDateFilters = {
    date_field: 'letter_date' | 'declaration_date';
    letter_date_from: string;
    letter_date_to: string;
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
    kind: import('@/types/filing').FilingKind;
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
    color?: CabinetColor;
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
    recentArchiveItemIds: string[];
    filters: {
        q: string;
        field: string;
        direction: DocumentSortDirection;
        sort: DocumentSortField;
        ocr_review: DocumentOcrReviewFilter;
        status: DocumentStatusFilter;
        search_mode: DocumentSearchMode;
        type: string;
    } & DocumentDateFilters;
    searchFields: SearchFieldOption[];
    mappingModels: string[];
    documentTypes: DocumentTypeOption[];
    fieldSections: DocumentFieldSection[];
    metadataFieldSections: DocumentFieldSection[];
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
    correspondent: string;
    title: string;
    letter_date: string;
};

export type MetadataField = keyof DocumentFieldValues;

export type UploadDocumentPayload = {
    file: File;
    document_type_id: null;
    filing_path: FilingPath;
    book_id?: string;
};

export type SaveDocumentFieldsPayload = Partial<DocumentFieldValues>;

export type DocumentFieldDefinition = {
    name: MetadataField;
    label: string;
    maxLength: number;
    type: 'text' | 'number' | 'date' | 'textarea';
    help?: string;
};

export type DocumentFieldSection = {
    id:
        | 'document'
        | 'declaration'
        | 'property'
        | 'owner'
        | 'boundaries'
        | 'remarks';
    title: string;
    tabLabel: string;
    fields: DocumentFieldDefinition[];
};
