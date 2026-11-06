export type FilingKind = 'book' | 'folder';

export type FilingItemCover = { cover: string; spine: string; text: string };

export type FilingItemPose = {
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    width: number;
    height: number;
    depth: number;
    origin: string;
    transform: string;
};

export type FilingItemOrigin = {
    hover: FilingItemPose;
    rest: FilingItemPose;
};

export type CabinetFilingItem = {
    id: string;
    kind: FilingKind;
    label: string;
    coverTitle: string;
    documentCount: number;
};

export type CabinetDrawer = {
    id: string;
    label: string;
    range: string;
    books: CabinetFilingItem[];
};

export type FilingCabinet = {
    id: string;
    name: string;
    location: string;
    drawers: CabinetDrawer[];
};

export type CabinetListFilingItem = {
    id: string;
    kind: FilingKind;
    label: string;
    coverTitle: string;
    position: number;
};

export type ManagedFilingItem = {
    id: string;
    kind: FilingKind;
    label: string;
    position: number;
    drawerId: string;
    drawerLabel: string;
    cabinetId: string;
    cabinetName: string;
};

export type CabinetListDrawer = {
    id: string;
    label: string;
    position: number;
    books: CabinetListFilingItem[];
};

export type CabinetListItem = {
    id: string;
    name: string;
    location: string;
    drawers: CabinetListDrawer[];
};
