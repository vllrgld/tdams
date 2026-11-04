import type { ArchivedDocument } from '@/pages/documents/types';
import type { BookCover, BookOrigin, CabinetBook } from '../../data/cabinets';

export type OpenedFilingItem = {
    book: CabinetBook;
    cabinetName: string;
    drawerLabel: string;
    cover: BookCover;
    origin: BookOrigin | null;
};

export type FilingItemViewerProps = {
    opened: OpenedFilingItem;
    dimmed?: boolean;
    initialDocumentId?: string | null;
    onClose: () => void;
    onOpenDocument: (document: ArchivedDocument) => void;
    onOpenPrevious?: (number: string) => void;
    onInitialDocumentConsumed?: () => void;
};
