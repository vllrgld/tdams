import { CalendarDays, FileText, UserRound } from 'lucide-react';
import DocumentThumbnail from '@/components/documents/document-thumbnail';
import OcrReviewBadge from '@/components/documents/ocr/ocr-review-badge';
import { formatDate } from '@/lib/document-formatters';
import type { ArchivedDocument } from '@/types/documents';
import DocumentThumbnailActions, {
    type DocumentThumbnailActionHandlers,
} from './document-thumbnail-actions';

type DocumentCardViewProps = DocumentThumbnailActionHandlers & {
    documents: ArchivedDocument[];
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentCardView({
    documents,
    onViewDocument,
    bookmarkedIds,
    onToggleBookmark,
    onShowChain,
}: DocumentCardViewProps) {
    return (
        <div className="grid gap-3 overflow-visible p-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            {documents.map((document) => (
                <article
                    key={document.id}
                    className="group relative z-0 flex aspect-[3/4.3] min-w-0 origin-center flex-col overflow-hidden border border-slate-200 bg-card shadow-sm transition duration-200 ease-out focus-within:z-20 focus-within:-translate-y-1.5 focus-within:scale-105 focus-within:border-blue-800 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-800/20 hover:z-20 hover:-translate-y-1.5 hover:scale-105 hover:border-blue-800 hover:shadow-xl hover:ring-2 hover:ring-blue-800/20 motion-reduce:transition-none motion-reduce:focus-within:translate-y-0 motion-reduce:focus-within:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:border-neutral-800 dark:focus-within:border-blue-800 dark:focus-within:ring-blue-800/20 dark:hover:border-blue-800 dark:hover:ring-blue-800/20"
                >
                    <div className="relative min-h-0 flex-1 overflow-hidden">
                        <DocumentThumbnail
                            mimeType={document.mimeType}
                            url={document.viewUrl}
                            thumbnailUrl={document.thumbnailUrl}
                            title={document.originalFilename}
                            fit="cover"
                            className="absolute inset-0"
                            fill
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => onViewDocument(document)}
                        aria-label={`Open ${document.originalFilename}`}
                        title={`Open ${document.originalFilename}`}
                        className="absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none focus-visible:ring-inset"
                    />
                    <DocumentThumbnailActions
                        document={document}
                        bookmarkedIds={bookmarkedIds}
                        onToggleBookmark={onToggleBookmark}
                        onShowChain={onShowChain}
                    />
                    <div className="pointer-events-none relative z-20 shrink-0 space-y-1.5 border-t border-slate-200 bg-card px-3 py-2.5 dark:border-neutral-800">
                        <dl className="space-y-1">
                            <div>
                                <dt className="sr-only">
                                    Tax declaration number
                                </dt>
                                <dd className="flex min-w-0 items-center gap-1.5 text-sm leading-5 font-semibold text-blue-900 dark:text-white">
                                    <FileText
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-slate-500 dark:text-neutral-400"
                                    />
                                    <span className="truncate">
                                        {document.taxDeclarationNumber || '—'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="sr-only">Registered owner</dt>
                                <dd className="flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-slate-700 dark:text-neutral-200">
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-slate-500 dark:text-neutral-400"
                                    />
                                    <span className="truncate">
                                        {document.registeredOwner || '—'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs leading-4 text-slate-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0"
                                />
                                <span className="sr-only">
                                    Declaration date:
                                </span>
                                <time
                                    dateTime={
                                        document.declarationDate ?? undefined
                                    }
                                >
                                    {formatDate(document.declarationDate)}
                                </time>
                            </span>
                        </div>
                        <div className="flex">
                            <OcrReviewBadge
                                reviewedAt={document.ocrReviewedAt}
                                compact
                                tone="details"
                            />
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
