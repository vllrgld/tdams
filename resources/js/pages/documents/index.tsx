import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import DocumentInfo from './components/document-info';
import DocumentUploadDialog from './components/document-upload-dialog';
import DocumentViewerDialog from './components/document-viewer-dialog';
import type { ArchivedDocument, DocumentsPageProps, UploadForm } from './types';

export default function Documents({ documents }: DocumentsPageProps) {
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(null);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
    const form = useForm<UploadForm>({
        file: null,
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
            <main className="min-h-full bg-slate-50/70 p-4 pb-24 sm:p-6 sm:pb-24 xl:p-8 dark:bg-background">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
                    <header className="flex flex-col justify-between gap-4 border-b-2 border-amber-700/70 pb-5 sm:flex-row sm:items-end dark:border-amber-500/60">
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-blue-900 uppercase dark:text-blue-200">
                                Records directory
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50">
                                Documents
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Browse archived property records and scanned
                                files.
                            </p>
                        </div>
                    </header>
                    <DocumentInfo
                        documents={documents}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onViewDocument={setViewingDocument}
                    />
                </div>
            </main>
            <DocumentUploadDialog
                form={form}
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
