import { Head, useForm } from '@inertiajs/react';
import { FileSearch, FileText, Info, Search, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';

const PdfPreview = lazy(() => import('@/components/pdf-preview'));

type ArchivedDocument = {
    id: number;
    taxDeclarationNumber: string | null;
    lotNumber: string | null;
    registeredOwner: string | null;
    municipality: string | null;
    barangay: string | null;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    createdAt: string | null;
    viewUrl: string;
    previousTaxDeclarationNumber: string | null;
    titleNumber: string | null;
    propertyLocationStreet: string | null;
    propertyLocationBarangay: string | null;
    propertyLocationDistrict: string | null;
    propertyLocationMunicipality: string | null;
    ownerAddressStreet: string | null;
    ownerAddressBarangay: string | null;
    ownerAddressDistrict: string | null;
    ownerAddressCityMunicipality: string | null;
    province: string | null;
    pin: string | null;
    boundaryNorth: string | null;
    boundarySouth: string | null;
    boundaryEast: string | null;
    boundaryWest: string | null;
    area: string | null;
    remarks: string | null;
};

type DocumentsPageProps = {
    documents: {
        data: ArchivedDocument[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
};

type UploadForm = {
    file: File | null;
    tax_declaration_number: string;
    lot_number: string;
    registered_owner: string;
    previous_tax_declaration_number: string;
    title_number: string;
    property_location_street: string;
    property_location_barangay: string;
    property_location_district: string;
    property_location_municipality: string;
    owner_address_street: string;
    owner_address_barangay: string;
    owner_address_district: string;
    owner_address_city_municipality: string;
    province: string;
    pin: string;
    boundary_north: string;
    boundary_south: string;
    boundary_east: string;
    boundary_west: string;
    area: string;
    remarks: string;
};

type MetadataField = Exclude<keyof UploadForm, 'file'>;

const metadataSections: {
    title: string;
    fields: { name: MetadataField; label: string; maxLength?: number }[];
}[] = [
    {
        title: 'Declaration details',
        fields: [
            {
                name: 'tax_declaration_number',
                label: 'Tax declaration number',
                maxLength: 100,
            },
            {
                name: 'previous_tax_declaration_number',
                label: 'Previous tax declaration number',
                maxLength: 100,
            },
            { name: 'title_number', label: 'Title number', maxLength: 100 },
            {
                name: 'registered_owner',
                label: 'Owner / property',
                maxLength: 255,
            },
            { name: 'lot_number', label: 'Lot number', maxLength: 100 },
            { name: 'pin', label: 'PIN', maxLength: 100 },
        ],
    },
    {
        title: 'Location of property',
        fields: [
            {
                name: 'property_location_street',
                label: 'Street',
                maxLength: 255,
            },
            {
                name: 'property_location_barangay',
                label: 'Barangay',
                maxLength: 150,
            },
            {
                name: 'property_location_district',
                label: 'District',
                maxLength: 150,
            },
            {
                name: 'property_location_municipality',
                label: 'City / municipality',
                maxLength: 150,
            },
        ],
    },
    {
        title: 'Address of owner',
        fields: [
            { name: 'owner_address_street', label: 'Street', maxLength: 255 },
            {
                name: 'owner_address_barangay',
                label: 'Barangay',
                maxLength: 150,
            },
            {
                name: 'owner_address_district',
                label: 'District',
                maxLength: 150,
            },
            {
                name: 'owner_address_city_municipality',
                label: 'City / municipality',
                maxLength: 150,
            },
        ],
    },
    {
        title: 'Land details',
        fields: [
            { name: 'province', label: 'Province', maxLength: 150 },
            { name: 'area', label: 'Area' },
            { name: 'boundary_north', label: 'North boundary', maxLength: 255 },
            { name: 'boundary_south', label: 'South boundary', maxLength: 255 },
            { name: 'boundary_east', label: 'East boundary', maxLength: 255 },
            { name: 'boundary_west', label: 'West boundary', maxLength: 255 },
        ],
    },
];

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
    }).format(new Date(date));
}

export default function Documents({ documents }: DocumentsPageProps) {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(null);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
    const form = useForm<UploadForm>({
        file: null,
        tax_declaration_number: '',
        lot_number: '',
        registered_owner: '',
        previous_tax_declaration_number: '',
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

                    <Card className="min-w-0 gap-0 overflow-hidden rounded-none border-slate-200 bg-white py-0 shadow-none dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                        <FileSearch
                                            aria-hidden="true"
                                            className="size-4 text-blue-900 dark:text-blue-200"
                                        />
                                        Archive
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Search and review archived tax
                                        declaration files
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                >
                                    {documents.total.toLocaleString()}{' '}
                                    {documents.total === 1
                                        ? 'document'
                                        : 'documents'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-0 py-0">
                            <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:p-4 dark:border-slate-800">
                                <div className="relative min-w-0 flex-1">
                                    <Search
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                    />
                                    <Input
                                        aria-label="Search documents"
                                        placeholder="Search by tax declaration, owner, lot number, or content…"
                                        disabled
                                        className="h-10 rounded-none border-slate-300 bg-white pl-9 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled
                                    className="h-10 rounded-none border-slate-300 dark:border-slate-700"
                                >
                                    Search
                                </Button>
                            </div>

                            {documents.data.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[68rem] text-left text-sm">
                                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-400">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 font-semibold sm:px-5"
                                                    >
                                                        File
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 font-semibold"
                                                    >
                                                        Tax declaration no.
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 font-semibold"
                                                    >
                                                        Registered owner
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 font-semibold"
                                                    >
                                                        Lot no.
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 font-semibold"
                                                    >
                                                        Municipality / barangay
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 font-semibold"
                                                    >
                                                        Date added
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {documents.data.map(
                                                    (document) => (
                                                        <tr
                                                            key={document.id}
                                                            className="text-slate-700 dark:text-slate-300"
                                                        >
                                                            <th
                                                                scope="row"
                                                                className="px-4 py-3.5 sm:px-5"
                                                            >
                                                                <span className="flex max-w-72 items-center gap-2">
                                                                    <FileText
                                                                        aria-hidden="true"
                                                                        className="size-4 shrink-0 text-blue-900 dark:text-blue-200"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setViewingDocument(
                                                                                document,
                                                                            )
                                                                        }
                                                                        className="truncate text-left font-medium text-blue-900 underline decoration-blue-900/30 underline-offset-4 hover:decoration-blue-900 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:text-blue-200 dark:decoration-blue-200/30 dark:hover:decoration-blue-200"
                                                                        title={`View ${document.originalFilename}`}
                                                                    >
                                                                        {
                                                                            document.originalFilename
                                                                        }
                                                                    </button>
                                                                </span>
                                                                <span className="mt-1 block pl-6 text-xs font-normal text-slate-500 dark:text-slate-400">
                                                                    {formatFileSize(
                                                                        document.fileSize,
                                                                    )}
                                                                </span>
                                                            </th>
                                                            <td className="px-3 py-3.5">
                                                                {document.taxDeclarationNumber ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-3 py-3.5">
                                                                {document.registeredOwner ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-3 py-3.5">
                                                                {document.lotNumber ??
                                                                    '—'}
                                                            </td>
                                                            <td className="px-3 py-3.5">
                                                                {[
                                                                    document.propertyLocationStreet,
                                                                    document.propertyLocationBarangay ??
                                                                        document.barangay,
                                                                    document.propertyLocationDistrict,
                                                                    document.propertyLocationMunicipality ??
                                                                        document.municipality,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        ', ',
                                                                    ) || '—'}
                                                            </td>
                                                            <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                                {formatDate(
                                                                    document.createdAt,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex flex-col justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-5 dark:border-slate-800 dark:text-slate-400">
                                        <span>
                                            Showing {documents.from}–
                                            {documents.to} of {documents.total}{' '}
                                            documents
                                        </span>
                                        <span className="tabular-nums">
                                            Page {documents.current_page} of{' '}
                                            {documents.last_page}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12 text-center">
                                    <span className="mb-4 flex size-12 items-center justify-center bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                                        <FileSearch
                                            aria-hidden="true"
                                            className="size-6"
                                        />
                                    </span>
                                    <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                                        No documents in the archive yet
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                                        Use the upload button to add a scanned
                                        PDF or image with its property details.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Button
                type="button"
                aria-label="Upload document"
                title="Upload document"
                onClick={() => setUploadOpen(true)}
                className="fixed right-5 bottom-5 z-40 size-14 rounded-full bg-blue-900 text-white shadow-lg shadow-slate-950/20 transition-transform hover:scale-105 hover:bg-blue-800 sm:right-8 sm:bottom-8 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                <Upload aria-hidden="true" className="size-6" />
            </Button>

            <Dialog
                open={uploadOpen}
                onOpenChange={(open) => setUploadOpen(open)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add document to archive</DialogTitle>
                        <DialogDescription>
                            Upload a scanned PDF or image and add the property
                            details. All details are optional.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={submitUpload}
                        className="grid gap-5"
                        encType="multipart/form-data"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="document-file">
                                Scanned document
                            </Label>
                            <Input
                                id="document-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff"
                                required
                                onChange={(event) =>
                                    form.setData(
                                        'file',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="h-auto rounded-none border-dashed p-3 file:mr-3 file:rounded-none file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-950 dark:file:bg-blue-950 dark:file:text-blue-100"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                PDF, JPEG, PNG, or TIFF · maximum file size 50
                                MB
                            </p>
                            <InputError message={form.errors.file} />
                        </div>

                        <div>
                            {metadataSections.map((section) => (
                                <section
                                    key={section.title}
                                    className="mb-5 last:mb-0"
                                >
                                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                                        {section.title}
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {section.fields.map((field) => {
                                            const id = `document-${field.name}`;

                                            return (
                                                <div
                                                    key={field.name}
                                                    className="grid gap-2"
                                                >
                                                    <Label htmlFor={id}>
                                                        {field.label}
                                                    </Label>
                                                    <Input
                                                        id={id}
                                                        type={
                                                            field.name ===
                                                            'area'
                                                                ? 'number'
                                                                : 'text'
                                                        }
                                                        step={
                                                            field.name ===
                                                            'area'
                                                                ? '0.0001'
                                                                : undefined
                                                        }
                                                        min={
                                                            field.name ===
                                                            'area'
                                                                ? '0'
                                                                : undefined
                                                        }
                                                        value={
                                                            form.data[
                                                                field.name
                                                            ]
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                field.name,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        maxLength={
                                                            field.maxLength
                                                        }
                                                        className="rounded-none"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                field.name
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                            <div className="grid gap-2">
                                <Label htmlFor="document-remarks">
                                    Remarks
                                </Label>
                                <textarea
                                    id="document-remarks"
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={10000}
                                    rows={3}
                                    className="w-full min-w-0 rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={form.errors.remarks} />
                            </div>
                        </div>

                        {form.progress && (
                            <div
                                className="h-2 bg-slate-100 dark:bg-slate-800"
                                role="progressbar"
                                aria-label="Upload progress"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={form.progress.percentage}
                            >
                                <div
                                    className="h-full bg-blue-900 transition-all dark:bg-blue-400"
                                    style={{
                                        width: `${form.progress.percentage}%`,
                                    }}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={() => setUploadOpen(false)}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || !form.data.file}
                                className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                <Upload aria-hidden="true" />
                                {form.processing
                                    ? 'Uploading…'
                                    : 'Add to archive'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={viewingDocument !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingDocument(null);
                        setDocumentInfoOpen(false);
                    }
                }}
            >
                <DialogContent
                    className={`flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden rounded-none p-4 transition-[left] duration-300 ease-in-out motion-reduce:transition-none sm:p-6 lg:!top-[5vh] lg:!h-[90vh] lg:!w-[66vw] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0 ${
                        documentInfoOpen
                            ? 'lg:!left-[2vw]'
                            : '!max-w-none sm:!max-w-none lg:!left-[17vw]'
                    }`}
                >
                    <div className="flex shrink-0 items-start justify-between gap-3 pr-8">
                        <DialogHeader className="min-w-0 text-left">
                            <DialogTitle className="truncate">
                                {viewingDocument?.originalFilename ??
                                    'Document preview'}
                            </DialogTitle>
                            <DialogDescription>
                                {viewingDocument?.taxDeclarationNumber
                                    ? `Tax declaration ${viewingDocument.taxDeclarationNumber}`
                                    : 'Archived document'}
                                {viewingDocument?.registeredOwner
                                    ? ` · ${viewingDocument.registeredOwner}`
                                    : ''}
                            </DialogDescription>
                        </DialogHeader>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={
                                documentInfoOpen
                                    ? 'Hide document information'
                                    : 'Show document information'
                            }
                            aria-pressed={documentInfoOpen}
                            title={
                                documentInfoOpen
                                    ? 'Hide document information'
                                    : 'Show document information'
                            }
                            onClick={() =>
                                setDocumentInfoOpen((isOpen) => !isOpen)
                            }
                            className="mr-1 size-9 shrink-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                        >
                            <Info aria-hidden="true" />
                        </Button>
                    </div>
                    {viewingDocument && (
                        <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                                {viewingDocument.mimeType ===
                                'application/pdf' ? (
                                    <Suspense
                                        fallback={
                                            <div className="flex min-h-0 flex-1 items-center justify-center gap-2 border border-slate-200 bg-slate-100 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                <Spinner />
                                                Loading PDF viewer…
                                            </div>
                                        }
                                    >
                                        <PdfPreview
                                            key={viewingDocument.id}
                                            url={viewingDocument.viewUrl}
                                            title={
                                                viewingDocument.originalFilename
                                            }
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto border border-slate-200 bg-slate-100 p-2 dark:border-slate-800 dark:bg-slate-900">
                                        <img
                                            src={viewingDocument.viewUrl}
                                            alt={
                                                viewingDocument.originalFilename
                                            }
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                modal={false}
                disablePointerDismissal
                open={documentInfoOpen && viewingDocument !== null}
                onOpenChange={setDocumentInfoOpen}
            >
                <DialogContent
                    overlayClassName="!pointer-events-none !bg-transparent"
                    className="flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-y-auto rounded-none p-0 sm:w-[min(30vw,32rem)] sm:max-w-none lg:!top-[5vh] lg:!left-[68vw] lg:!h-[90vh] lg:!w-[30vw] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0"
                >
                    {viewingDocument && (
                        <>
                            <DialogHeader className="border-b border-slate-200 p-4 pr-12 text-left dark:border-slate-800">
                                <DialogTitle>Document information</DialogTitle>
                                <DialogDescription className="break-all">
                                    {viewingDocument.originalFilename}
                                </DialogDescription>
                            </DialogHeader>
                            <dl className="grid gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
                                {[
                                    [
                                        'Tax declaration number',
                                        viewingDocument.taxDeclarationNumber,
                                    ],
                                    [
                                        'Previous tax declaration number',
                                        viewingDocument.previousTaxDeclarationNumber,
                                    ],
                                    [
                                        'Title number',
                                        viewingDocument.titleNumber,
                                    ],
                                    ['Lot number', viewingDocument.lotNumber],
                                    [
                                        'Owner / property',
                                        viewingDocument.registeredOwner,
                                    ],
                                    [
                                        'Property location - street',
                                        viewingDocument.propertyLocationStreet,
                                    ],
                                    [
                                        'Property location - barangay',
                                        viewingDocument.propertyLocationBarangay ??
                                            viewingDocument.barangay,
                                    ],
                                    [
                                        'Property location - district',
                                        viewingDocument.propertyLocationDistrict,
                                    ],
                                    [
                                        'Property location - city / municipality',
                                        viewingDocument.propertyLocationMunicipality ??
                                            viewingDocument.municipality,
                                    ],
                                    [
                                        'Owner address - street',
                                        viewingDocument.ownerAddressStreet,
                                    ],
                                    [
                                        'Owner address - barangay',
                                        viewingDocument.ownerAddressBarangay,
                                    ],
                                    [
                                        'Owner address - district',
                                        viewingDocument.ownerAddressDistrict,
                                    ],
                                    [
                                        'Owner address - city / municipality',
                                        viewingDocument.ownerAddressCityMunicipality,
                                    ],
                                    ['Province', viewingDocument.province],
                                    ['PIN', viewingDocument.pin],
                                    [
                                        'North boundary',
                                        viewingDocument.boundaryNorth,
                                    ],
                                    [
                                        'South boundary',
                                        viewingDocument.boundarySouth,
                                    ],
                                    [
                                        'East boundary',
                                        viewingDocument.boundaryEast,
                                    ],
                                    [
                                        'West boundary',
                                        viewingDocument.boundaryWest,
                                    ],
                                    ['Area', viewingDocument.area],
                                    ['Remarks', viewingDocument.remarks],
                                    ['File type', viewingDocument.mimeType],
                                    [
                                        'File size',
                                        formatFileSize(
                                            viewingDocument.fileSize,
                                        ),
                                    ],
                                    [
                                        'Date added',
                                        formatDate(viewingDocument.createdAt),
                                    ],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className={`grid min-w-0 gap-1 ${label === 'Owner / property' || label === 'Remarks' ? 'sm:col-span-2' : ''}`}
                                    >
                                        <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {label}
                                        </dt>
                                        <dd className="text-sm break-words text-slate-900 dark:text-slate-100">
                                            {value || '—'}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

Documents.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Documents',
            href: '/documents',
        },
    ],
};
