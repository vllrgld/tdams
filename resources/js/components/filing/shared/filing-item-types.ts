import type { ArchivedDocument } from '@/types/documents';
import type {
    FilingItemCover,
    FilingItemOrigin,
    CabinetFilingItem,
} from '@/types/filing';

export type OpenedFilingItem = {
    item: CabinetFilingItem;
    cabinetName: string;
    drawerLabel: string;
    cover: FilingItemCover;
    origin: FilingItemOrigin | null;
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
