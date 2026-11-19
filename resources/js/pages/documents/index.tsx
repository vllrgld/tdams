import { index as documentsIndex } from '@/routes/documents';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import DocumentBrowser from './components/browser/document-browser';
import DocumentViewerDialog from '@/components/documents/viewer/document-viewer-dialog';
import OfficeDocumentActions from './components/office-document-actions';
import type { ArchivedDocument } from '@/types/documents';
import type { DocumentsPageProps, DocumentViewMode } from './types';

export default function Documents({
    documents,
    filters,
    searchFields,
    documentTypes,
    selectedDocument = null,
}: DocumentsPageProps) {
    const [viewMode, setViewMode] = useState<DocumentViewMode>('cards');
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(selectedDocument);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);

    return (
        <>
            <Head title="Documents" />
            <main className="min-h-full bg-background p-4 pb-24 sm:p-6 sm:pb-24 xl:p-8 xl:pb-24">
                <div className="mx-auto w-full max-w-[1600px]">
                    <DocumentBrowser
                        documents={documents}
                        searchQuery={filters.q}
                        searchField={filters.field}
                        ocrReview={filters.ocr_review}
                        documentStatus={filters.status}
                        searchMode={filters.search_mode ?? 'all'}
                        documentType={filters.type}
                        documentTypes={documentTypes}
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
            <OfficeDocumentActions
                onCompleted={() => {
                    setViewingDocument(null);
                    setDocumentInfoOpen(false);
                }}
            />
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
