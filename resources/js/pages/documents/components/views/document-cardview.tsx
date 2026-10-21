import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Link } from 'lucide-react';
import DocumentChain from '../document-chain';
import DocumentThumbnail from '../document-thumbnail';
import { formatDate } from '../../lib/formatters';
import type { ArchivedDocument } from '../../types';
import {
    DocumentCardField,
    getPropertyLocation,
} from './document-view-helpers';

type DocumentCardViewProps = {
    documents: ArchivedDocument[];
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentCardView({
    documents,
    onViewDocument,
}: DocumentCardViewProps) {
    const [chainDocument, setChainDocument] = useState<ArchivedDocument | null>(
        null,
    );
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(
        () => new Set(),
    );

    function toggleBookmark(id: number) {
        setBookmarkedIds((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    return (
        <>
            <div className="grid gap-3 overflow-visible p-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                {documents.map((document) => (
                    <article
                        key={document.id}
                        className="group relative z-0 aspect-[3/4] min-w-0 origin-center overflow-hidden border border-slate-200 bg-blue-900 shadow-sm transition duration-200 ease-out focus-within:z-20 focus-within:-translate-y-1.5 focus-within:scale-105 focus-within:border-blue-800 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-800/20 hover:z-20 hover:-translate-y-1.5 hover:scale-105 hover:border-blue-800 hover:shadow-xl hover:ring-2 hover:ring-blue-800/20 motion-reduce:transition-none motion-reduce:focus-within:translate-y-0 motion-reduce:focus-within:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:border-neutral-800 dark:focus-within:border-blue-800 dark:focus-within:ring-blue-800/20 dark:hover:border-blue-800 dark:hover:ring-blue-800/20"
                    >
                        <DocumentThumbnail
                            mimeType={document.mimeType}
                            url={document.viewUrl}
                            title={document.originalFilename}
                            fit="cover"
                            className="absolute inset-0 h-full"
                        />
                        <button
                            type="button"
                            onClick={() => onViewDocument(document)}
                            aria-label={`Open ${document.originalFilename}`}
                            title={`Open ${document.originalFilename}`}
                            className="absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none focus-visible:ring-inset"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleBookmark(document.id)}
                            aria-label={`Bookmark ${document.originalFilename}`}
                            aria-pressed={bookmarkedIds.has(document.id)}
                            title={
                                bookmarkedIds.has(document.id)
                                    ? 'Remove bookmark'
                                    : 'Bookmark'
                            }
                            className="absolute top-2 left-2 z-20 size-8 cursor-pointer rounded-none bg-transparent text-blue-900 shadow-none [filter:drop-shadow(0_0_2px_rgb(255_255_255))_drop-shadow(0_1px_2px_rgb(255_255_255_/_0.9))] transition-transform duration-200 ease-out hover:scale-150 hover:bg-transparent hover:text-blue-950 focus-visible:ring-blue-700 motion-reduce:transition-none motion-reduce:hover:scale-100"
                        >
                            <Bookmark
                                aria-hidden="true"
                                className="size-4"
                                fill={
                                    bookmarkedIds.has(document.id)
                                        ? 'currentColor'
                                        : 'none'
                                }
                            />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setChainDocument(document)}
                            aria-label={`Show document chain for ${document.originalFilename}`}
                            title="Show document chain"
                            className="absolute top-2 right-2 z-20 size-8 cursor-pointer rounded-none bg-transparent text-blue-900 shadow-none [filter:drop-shadow(0_0_2px_rgb(255_255_255))_drop-shadow(0_1px_2px_rgb(255_255_255_/_0.9))] transition-transform duration-200 ease-out hover:scale-150 hover:bg-transparent hover:text-blue-950 focus-visible:ring-blue-700 motion-reduce:transition-none motion-reduce:hover:scale-100"
                        >
                            <Link aria-hidden="true" className="size-4" />
                        </Button>
                        <div className="document-card-overlay pointer-events-none absolute inset-x-0 bottom-0 z-20 px-2.5 pt-20 pb-2.5">
                            <dl className="grid gap-1 text-[11px] text-white">
                                <DocumentCardField
                                    label="Tax declaration"
                                    value={document.taxDeclarationNumber}
                                    tone="on-image"
                                />
                                <DocumentCardField
                                    label="Registered owner"
                                    value={document.registeredOwner}
                                    tone="on-image"
                                />
                                <DocumentCardField
                                    label="Lot number"
                                    value={document.lotNumber}
                                    tone="on-image"
                                />
                                <DocumentCardField
                                    label="Property location"
                                    value={getPropertyLocation(document)}
                                    tone="on-image"
                                />
                            </dl>
                            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-white">
                                <span className="shrink-0 font-medium">
                                    Date added
                                </span>
                                <span className="text-right tabular-nums">
                                    {formatDate(document.createdAt)}
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            <DocumentChain
                document={chainDocument}
                onViewDocument={onViewDocument}
                onOpenChange={(open) => {
                    if (!open) {
                        setChainDocument(null);
                    }
                }}
            />
        </>
    );
}
