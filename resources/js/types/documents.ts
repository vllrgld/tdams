export type DocumentAttachment = {
    id: number;
    description: string;
    page: number | null;
};

export type DocumentStatus =
    | 'under_review'
    | 'in_progress'
    | 'approved'
    | 'disapproved'
    | 'archived'
    | 'completed';

export type DocumentWorkflow = {
    status: DocumentStatus;
    label: string;
    canTakeAction: boolean;
    actionBlock: string | null;
    canEndorse: boolean;
    endorsementRequired: boolean;
    endorsedAt: string | null;
    routingName: string | null;
    routingVersion: number;
    decision: {
        status: 'approved' | 'disapproved';
        comments: string | null;
        actorName: string;
        officeName: string | null;
        decidedAt: string;
    } | null;
};

export type ArchivedDocument = {
    id: number;
    status?: DocumentStatus;
    title: string | null;
    trackingCode?: string | null;
    letterDate: string | null;
    correspondent: string | null;
    attachments: DocumentAttachment[];
    documentTypeId: number | null;
    documentTypeName: string | null;
    usesTaxFields: boolean;
    filingPath: 'archive' | 'route';
    routeName: string | null;
    routeSteps: string[];
    officeLocation?: {
        officeName: string | null;
        inTransit: boolean;
        destinationOfficeName: string | null;
        releasedAt: string | null;
    };
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
