import { Badge } from '@/components/ui/badge';
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
    return (
        <div className="grid gap-2.5 p-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            {documents.map((document) => (
                <article
                    key={document.id}
                    className="flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                    <div className="group relative">
                        <DocumentThumbnail
                            mimeType={document.mimeType}
                            url={document.viewUrl}
                            title={document.originalFilename}
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
                    </div>
                    <dl className="grid gap-1.5 border-t border-slate-100 p-2.5 text-[11px] dark:border-slate-800">
                        <DocumentCardField
                            label="Tax declaration"
                            value={document.taxDeclarationNumber}
                        />
                        <DocumentCardField
                            label="Registered owner"
                            value={document.registeredOwner}
                        />
                        <DocumentCardField
                            label="Lot number"
                            value={document.lotNumber}
                        />
                        <DocumentCardField
                            label="Property location"
                            value={getPropertyLocation(document)}
                        />
                    </dl>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-900">
                        <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">
                            Date added
                        </span>
                        <span className="text-right text-slate-700 tabular-nums dark:text-slate-300">
                            {formatDate(document.createdAt)}
                        </span>
                    </div>
                </article>
            ))}
        </div>
    );
}
