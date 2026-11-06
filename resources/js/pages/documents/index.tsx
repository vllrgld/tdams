import { index as documentsIndex } from '@/routes/documents';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import DocumentBrowser from './components/browser/document-browser';
import DocumentUploadDialog from './components/upload/document-upload-dialog';
import DocumentViewerDialog from '@/components/documents/viewer/document-viewer-dialog';
import type { ArchivedDocument } from '@/types/documents';
import type { DocumentsPageProps, DocumentViewMode } from './types';

export default function Documents({
    documents,
    archive,
    filters,
    searchFields,
    mappingModels,
    fieldSections,
    selectedDocument = null,
}: DocumentsPageProps) {
    const [viewMode, setViewMode] = useState<DocumentViewMode>('cards');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reviewDocument, setReviewDocument] =
        useState<ArchivedDocument | null>(null);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(selectedDocument);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);

    return (
        <>
            <Head title="Documents" />
            <main className="min-h-full bg-background p-4 pb-24 sm:p-6 sm:pb-24 xl:p-8">
                <div className="mx-auto w-full max-w-[1600px]">
                    <DocumentBrowser
                        documents={documents}
                        searchQuery={filters.q}
                        searchField={filters.field}
                        searchFields={searchFields}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onViewDocument={setViewingDocument}
                    />
                </div>
            </main>
            <DocumentUploadDialog
                archive={archive}
                mappingModels={mappingModels}
                fieldSections={fieldSections}
                open={uploadOpen}
                reviewDocument={reviewDocument}
                onOpenChange={(next) => {
                    setUploadOpen(next);
                    if (!next) setReviewDocument(null);
                }}
            />
            <DocumentViewerDialog
                document={viewingDocument}
                infoOpen={documentInfoOpen}
                onDocumentChange={setViewingDocument}
                onInfoOpenChange={setDocumentInfoOpen}
                onReviewFields={(document) => {
                    setViewingDocument(null);
                    setDocumentInfoOpen(false);
                    setReviewDocument(document);
                    setUploadOpen(true);
                }}
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
