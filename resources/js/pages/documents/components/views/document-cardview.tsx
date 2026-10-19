import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
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

    return (
        <>
            <div className="grid gap-2.5 p-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                {documents.map((document) => (
                    <article
                        key={document.id}
                        className="group relative aspect-[3/4] min-w-0 overflow-hidden border border-slate-200 bg-blue-900 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800"
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
                        <Badge
                            variant="outline"
                            className="pointer-events-none absolute top-2 right-2 z-20 rounded-none bg-white/90 text-xs uppercase dark:bg-slate-950/90"
                        >
                            {document.mimeType.split('/').pop() ?? 'file'}
                        </Badge>
                        <Button
                            type="button"
                            size="icon"
                            onClick={() => setChainDocument(document)}
                            aria-label={`Show document chain for ${document.originalFilename}`}
                            title="Show document chain"
                            className="absolute top-2 left-2 z-20 size-8 rounded-full shadow transition-transform group-hover:scale-110"
                        >
                            <Link aria-hidden="true" className="size-3.5" />
                        </Button>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-blue-900 via-blue-900/75 to-transparent px-2.5 pt-12 pb-2.5">
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
                            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-blue-100">
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
