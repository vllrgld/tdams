import DocumentThumbnail from '@/pages/documents/components/document-thumbnail';
import { formatDate } from '@/pages/documents/lib/formatters';
import type { ArchivedDocument } from '@/pages/documents/types';

export const FILING_PAGE_HEIGHT = 595;

export function BookPage({
    document,
    eager = false,
}: {
    document: ArchivedDocument;
    eager?: boolean;
}) {
    return (
        <DocumentThumbnail
            mimeType={document.mimeType}
            url={document.viewUrl}
            thumbnailUrl={document.thumbnailUrl}
            title={document.originalFilename}
            pageNumber={1}
            fit="contain"
            fill
            quality="book"
            eager={eager}
            className="h-full bg-transparent dark:bg-transparent"
        />
    );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-sm break-words text-neutral-900">
                {value || '—'}
            </p>
        </div>
    );
}

export function DocumentDetails({
    document,
    onOpenPrevious,
}: {
    document: ArchivedDocument;
    onOpenPrevious?: (number: string) => void;
}) {
    const title = document.taxDeclarationNumber || document.originalFilename;
    const showFilename = Boolean(document.taxDeclarationNumber);
    const previous = document.previousTaxDeclarationNumber;

    return (
        <div className="flex h-full flex-col justify-between p-6">
            <div className="space-y-4">
                <p className="text-lg font-semibold break-words text-neutral-900">
                    {title}
                </p>
                <div className="space-y-3">
                    {previous && onOpenPrevious ? (
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                                Previous declaration
                            </p>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenPrevious(previous);
                                }}
                                className="mt-0.5 text-left text-sm break-words text-blue-900 underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                                {previous}
                            </button>
                        </div>
                    ) : (
                        <DetailRow
                            label="Previous declaration"
                            value={previous}
                        />
                    )}
                    <DetailRow label="Owner" value={document.registeredOwner} />
                    <DetailRow label="Lot" value={document.lotNumber} />
                    <DetailRow
                        label="Date"
                        value={
                            document.declarationDate
                                ? formatDate(document.declarationDate)
                                : null
                        }
                    />
                </div>
            </div>
            {showFilename ? (
                <p className="truncate text-[10px] text-neutral-500">
                    {document.originalFilename}
                </p>
            ) : null}
        </div>
    );
}

export function EmptyDocuments({ loading }: { loading?: boolean }) {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-neutral-700">
                {loading
                    ? 'Loading documents…'
                    : 'Saved documents will appear here.'}
            </p>
        </div>
    );
}
