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
    ocrReviewedAt: string | null;
    ocrTextExcerpt: string | null;
    createdAt: string | null;
    viewUrl: string;
    thumbnailUrl: string | null;
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
    boundaryNortheast: string | null;
    boundaryEast: string | null;
    boundarySoutheast: string | null;
    boundarySouth: string | null;
    boundarySouthwest: string | null;
    boundaryWest: string | null;
    boundaryNorthwest: string | null;
    area: string | null;
    remarks: string | null;
};

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
