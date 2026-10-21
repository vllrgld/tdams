import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import DocumentInfo from './components/document-info';
import DocumentUploadDialog from './components/document-upload-dialog';
import DocumentViewerDialog from './components/document-viewer-dialog';
import type { ArchivedDocument, DocumentsPageProps, UploadForm } from './types';

export default function Documents({
    documents,
    archive,
    filters,
    searchFields,
}: DocumentsPageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(null);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
    const form = useForm<UploadForm>({
        file: null,
        book_id: '',
        tax_declaration_number: '',
        declaration_date: '',
        lot_number: '',
        registered_owner: '',
        previous_tax_declaration_number: '',
        previous_declaration_date: '',
        title_number: '',
        property_location_street: '',
        property_location_barangay: '',
        property_location_district: '',
        property_location_municipality: '',
        owner_address_street: '',
        owner_address_barangay: '',
        owner_address_district: '',
        owner_address_city_municipality: '',
        province: '',
        pin: '',
        boundary_north: '',
        boundary_south: '',
        boundary_east: '',
        boundary_west: '',
        area: '',
        remarks: '',
    });

    function submitUpload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                setUploadOpen(false);
                form.reset();
                toast.success('Document added to the archive.');
            },
        });
    }

    return (
        <>
            <Head title="Documents" />
            <main className="min-h-full bg-background p-4 pb-24 sm:p-6 sm:pb-24 xl:p-8">
                <div className="mx-auto w-full max-w-[1600px]">
                    <DocumentInfo
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
                form={form}
                archive={archive}
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                onSubmit={submitUpload}
            />
            <DocumentViewerDialog
                document={viewingDocument}
                infoOpen={documentInfoOpen}
                onDocumentChange={setViewingDocument}
                onInfoOpenChange={setDocumentInfoOpen}
            />
        </>
    );
}

Documents.layout = {
    breadcrumbs: [
        {
            title: 'Documents',
            href: '/documents',
        },
    ],
};
