import { index as documentsIndex } from '@/routes/documents';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import DocumentBrowser from './components/browser/document-browser';
import DocumentViewerDialog from '@/components/documents/viewer/document-viewer-dialog';
import type { ArchivedDocument } from '@/types/documents';
import type { DocumentsPageProps, DocumentViewMode } from './types';

export default function Documents({
    documents,
    filters,
    searchFields,
    selectedDocument = null,
}: DocumentsPageProps) {
    const [viewMode, setViewMode] = useState<DocumentViewMode>('cards');
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(selectedDocument);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);

    return (
        <>
            <Head title="Documents" />
            <main className="min-h-full bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto w-full max-w-[1600px]">
                    <DocumentBrowser
                        documents={documents}
                        searchQuery={filters.q}
                        searchField={filters.field}
                        ocrReview={filters.ocr_review}
                        dateFilters={filters}
                        sortDirection={filters.direction}
                        sortField={filters.sort}
                        searchFields={searchFields}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onViewDocument={setViewingDocument}
                    />
                </div>
            </main>
            <DocumentViewerDialog
                document={viewingDocument}
                infoOpen={documentInfoOpen}
                onDocumentChange={setViewingDocument}
                onInfoOpenChange={setDocumentInfoOpen}
                onOcrReviewChange={(documentId, reviewedAt) => {
                    if ((filters.ocr_review ?? 'all') !== 'all') {
                        router.reload({ only: ['documents'] });
                        return;
                    }
                    router.replaceProp(
                        'documents.data',
                        documents.data.map((document) =>
                            document.id === documentId
                                ? { ...document, ocrReviewedAt: reviewedAt }
                                : document,
                        ),
                    );
                }}
                onFieldsSaved={() => router.reload({ only: ['documents'] })}
            />
        </>
    );
}

Documents.layout = {
    breadcrumbs: [
        {
            title: 'Documents',
            href: documentsIndex.url(),
        },
    ],
};
