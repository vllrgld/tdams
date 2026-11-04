export type FilingKind = 'book' | 'folder';

export type BookCover = { cover: string; spine: string; text: string };

export const FOLDER_COVER: BookCover = {
    cover: 'bg-slate-50',
    spine: 'bg-slate-200',
    text: 'text-slate-800',
};

export const BOOK_COVER: BookCover = {
    cover: 'bg-blue-950',
    spine: 'bg-blue-950',
    text: 'text-blue-50',
} as const;

export const DEFAULT_COVER_TITLE = 'Tax Declaration';

export function filingCover(kind?: FilingKind): BookCover {
    return kind === 'folder' ? FOLDER_COVER : BOOK_COVER;
}

export type BookSlotPose = {
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

export type BookOrigin = {
    hover: BookSlotPose;
    rest: BookSlotPose;
};

export type CabinetBook = {
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
    books: CabinetBook[];
};

export type FilingCabinet = {
    id: string;
    name: string;
    location: string;
    drawers: CabinetDrawer[];
};

export type CabinetListBook = {
    id: string;
    kind: FilingKind;
    label: string;
    coverTitle: string;
    position: number;
};

export type ManageBook = {
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
    books: CabinetListBook[];
};

export type CabinetListItem = {
    id: string;
    name: string;
    location: string;
    drawers: CabinetListDrawer[];
};
