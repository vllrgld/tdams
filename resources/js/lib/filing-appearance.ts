import type { FilingItemCover, FilingKind } from '@/types/filing';

export const FOLDER_COVER: FilingItemCover = {
    cover: 'bg-slate-50',
    spine: 'bg-slate-200',
    text: 'text-slate-800',
};

export const BOOK_COVER: FilingItemCover = {
    cover: 'bg-blue-950',
    spine: 'bg-blue-950',
    text: 'text-blue-50',
} as const;

export const DEFAULT_COVER_TITLE = 'Tax Declaration';

export function filingCover(kind?: FilingKind): FilingItemCover {
    return kind === 'folder' ? FOLDER_COVER : BOOK_COVER;
}
