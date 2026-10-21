import type { ArchivedDocument } from '@/pages/documents/types';

export const BOOK_COVER = {
    cover: 'bg-blue-950',
    spine: 'bg-blue-900 dark:bg-indigo-950',
    text: 'text-blue-50',
} as const;

export type BookCover = typeof BOOK_COVER;

export type CabinetBook = {
    id: string;
    label: string;
    documents: ArchivedDocument[];
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
    label: string;
    position: number;
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
