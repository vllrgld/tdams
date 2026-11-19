import { CalendarDays, FileText, MapPin, UserRound } from 'lucide-react';
import DocumentThumbnail from '@/components/documents/document-thumbnail';
import OcrReviewBadge from '@/components/documents/ocr/ocr-review-badge';
import { formatDate, formatFileSize } from '@/lib/document-formatters';
import type { ArchivedDocument } from '@/types/documents';
import DocumentTrackingCode from '@/components/documents/document-tracking-code';
import DocumentStatusBadge from '@/components/documents/document-status-badge';
import {
    documentCardDate,
    documentHeading,
    documentSubheading,
    getPropertyLocation,
} from './document-view-helpers';
import DocumentThumbnailActions, {
    type DocumentThumbnailActionHandlers,
} from './document-thumbnail-actions';

type DocumentPreviewViewProps = DocumentThumbnailActionHandlers & {
    documents: ArchivedDocument[];
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentPreviewView({
    documents,
    onViewDocument,
    onShowChain,
}: DocumentPreviewViewProps) {
    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4">
            {documents.map((document) => {
                const location = document.usesTaxFields
                    ? getPropertyLocation(document)
                    : '';

                return (
                    <article
                        key={document.id}
                        className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] overflow-hidden border border-slate-200 bg-card shadow-sm transition-colors focus-within:border-blue-800 hover:border-blue-800 motion-reduce:transition-none sm:grid-cols-[12rem_minmax(0,1fr)] dark:border-neutral-800 dark:focus-within:border-blue-600 dark:hover:border-blue-600"
                    >
                        <div className="relative min-h-44 overflow-hidden border-r border-slate-200 bg-white dark:border-neutral-800">
                            <DocumentThumbnail
                                mimeType={document.mimeType}
                                url={document.viewUrl}
                                thumbnailUrl={document.thumbnailUrl}
                                title={document.originalFilename}
                                fit="cover"
                                className="absolute inset-0 [&_img]:object-top"
                                fill
                            />
                            <button
                                type="button"
                                onClick={() => onViewDocument(document)}
                                aria-label={`Open ${document.originalFilename}`}
                                title={`Open ${document.originalFilename}`}
                                className="absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none focus-visible:ring-inset"
                            />
                            <DocumentThumbnailActions
                                document={document}
                                onShowChain={onShowChain}
                            />
                        </div>
                        <div className="flex min-w-0 flex-col gap-2 p-3 sm:p-4">
                            <div className="min-w-0 space-y-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                    <h2 className="min-w-0 text-sm leading-5 font-semibold text-blue-900 sm:text-base sm:leading-6 dark:text-white">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onViewDocument(document)
                                            }
                                            title={`Open ${document.originalFilename}`}
                                            className="line-clamp-2 max-w-full cursor-pointer text-left break-words underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                                        >
                                            {documentHeading(document)}
                                        </button>
                                    </h2>
                                    <DocumentStatusBadge document={document} />
                                </div>
                                <DocumentTrackingCode
                                    code={document.trackingCode}
                                />
                                <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-slate-700 dark:text-neutral-200">
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-slate-500 dark:text-neutral-400"
                                    />
                                    <span className="sr-only">
                                        {document.usesTaxFields
                                            ? 'Registered owner:'
                                            : 'Correspondent:'}
                                    </span>
                                    <span className="truncate">
                                        {documentSubheading(document) || '—'}
                                    </span>
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                                    <span className="sr-only">
                                        Document type:
                                    </span>
                                    {document.documentTypeName ||
                                        'Tax declaration'}
                                    {document.filingPath === 'route' &&
                                    document.routeName
                                        ? ` · ${document.routeName}`
                                        : ''}
                                    {document.usesTaxFields &&
                                    document.correspondent
                                        ? ` · ${document.correspondent}`
                                        : ''}
                                </p>
                            </div>
                            <p className="line-clamp-3 text-sm leading-6 break-words text-slate-600 dark:text-neutral-300">
                                <span className="sr-only">OCR text: </span>
                                {document.ocrTextExcerpt ||
                                    'No OCR text available yet.'}
                            </p>
                            <div className="mt-auto space-y-2 pt-1">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs leading-4 text-slate-500 dark:text-neutral-300">
                                    <span
                                        className="flex min-w-0 items-center gap-1.5"
                                        title={document.originalFilename}
                                    >
                                        <FileText
                                            aria-hidden="true"
                                            className="size-3.5 shrink-0"
                                        />
                                        <span className="max-w-48 truncate">
                                            {document.originalFilename}
                                        </span>
                                        <span className="shrink-0">
                                            {formatFileSize(document.fileSize)}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays
                                            aria-hidden="true"
                                            className="size-3.5 shrink-0"
                                        />
                                        <span className="sr-only">
                                            {document.usesTaxFields
                                                ? 'Declaration date:'
                                                : 'Date added:'}
                                        </span>
                                        <time
                                            dateTime={
                                                documentCardDate(document) ??
                                                undefined
                                            }
                                        >
                                            {formatDate(
                                                documentCardDate(document),
                                            )}
                                        </time>
                                    </span>
                                    {location && (
                                        <span
                                            className="flex min-w-0 items-center gap-1.5"
                                            title={location}
                                        >
                                            <MapPin
                                                aria-hidden="true"
                                                className="size-3.5 shrink-0"
                                            />
                                            <span className="sr-only">
                                                Property location:
                                            </span>
                                            <span className="truncate">
                                                {location}
                                            </span>
                                        </span>
                                    )}
                                </div>
                                <OcrReviewBadge
                                    reviewedAt={document.ocrReviewedAt}
                                    compact
                                    tone="details"
                                />
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
