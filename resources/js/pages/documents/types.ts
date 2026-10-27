export type ArchivedDocument = {
    id: number;
    taxDeclarationNumber: string | null;
    declarationDate: string | null;
    lotNumber: string | null;
    registeredOwner: string | null;
    municipality: string | null;
    barangay: string | null;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    ocrPdfSize: number | null;
    createdAt: string | null;
    viewUrl: string;
    ocrPdfUrl: string | null;
    previousTaxDeclarationNumber: string | null;
    previousDeclarationDate: string | null;
    titleNumber: string | null;
    propertyLocationStreet: string | null;
    propertyLocationBarangay: string | null;
    propertyLocationDistrict: string | null;
    propertyLocationMunicipality: string | null;
    ownerAddressStreet: string | null;
    ownerAddressBarangay: string | null;
    ownerAddressDistrict: string | null;
    ownerAddressCityMunicipality: string | null;
    province: string | null;
    pin: string | null;
    boundaryNorth: string | null;
    boundarySouth: string | null;
    boundaryEast: string | null;
    boundaryWest: string | null;
    area: string | null;
    remarks: string | null;
};

export type SearchFieldOption = {
    value: string;
    label: string;
};

export type ArchivePlacementBook = {
    id: string;
    label: string;
};

export type ArchivePlacementDrawer = {
    id: string;
    label: string;
    books: ArchivePlacementBook[];
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
    };
    searchFields: SearchFieldOption[];
    mappingModels: string[];
};

export type UploadForm = {
    file: File | null;
    book_id: string;
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
    boundary_south: string;
    boundary_east: string;
    boundary_west: string;
    area: string;
    remarks: string;
};

export type MetadataField = Exclude<keyof UploadForm, 'file' | 'book_id'>;

export type DeclarationNumberMatch = {
    id: number;
    taxDeclarationNumber: string;
    registeredOwner: string | null;
    lotNumber: string | null;
    municipality: string | null;
    declarationDate: string | null;
    createdAt: string | null;
};

export type PreviousDeclarationEntry = {
    taxDeclarationNumber: string;
    document: ArchivedDocument | null;
    declarationDate: string | null;
};

export type DocumentChainResponse = {
    originId: number;
    entries: PreviousDeclarationEntry[];
};
