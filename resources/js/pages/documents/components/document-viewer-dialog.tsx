import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { History, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatFileSize } from '../lib/formatters';
import type { ArchivedDocument } from '../types';
import DocumentHistory from './document-history';

const PdfPreview = lazy(() => import('@/components/pdf-preview'));

type DocumentViewerDialogProps = {
    document: ArchivedDocument | null;
    infoOpen: boolean;
    onDocumentChange: (document: ArchivedDocument | null) => void;
    onInfoOpenChange: (open: boolean) => void;
};

export default function DocumentViewerDialog({
    document,
    infoOpen,
    onDocumentChange,
    onInfoOpenChange,
}: DocumentViewerDialogProps) {
    const [panelView, setPanelView] = useState<'info' | 'history'>('info');

    useEffect(() => {
        if (!infoOpen) {
            setPanelView('info');
        }
    }, [infoOpen]);

    const handleInfoToggle = () => {
        if (infoOpen && panelView === 'info') {
            onInfoOpenChange(false);
            return;
        }

        if (!infoOpen) {
            onInfoOpenChange(true);
        }

        setPanelView('info');
    };

    const handleHistoryToggle = () => {
        if (infoOpen && panelView === 'history') {
            onInfoOpenChange(false);
            return;
        }

        if (!infoOpen) {
            onInfoOpenChange(true);
        }

        setPanelView('history');
    };

    return (
        <>
            <Dialog
                open={document !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        onDocumentChange(null);
                        onInfoOpenChange(false);
                    }
                }}
            >
                <DialogContent
                    className={`flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden rounded-none p-4 transition-[left] duration-300 ease-in-out motion-reduce:transition-none sm:p-6 lg:!top-[5vh] lg:!h-[90vh] lg:!w-[66vw] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0 ${
                        infoOpen
                            ? 'lg:!left-[2vw]'
                            : '!max-w-none sm:!max-w-none lg:!left-[17vw]'
                    }`}
                >
                    <div className="flex shrink-0 items-start justify-between gap-3 pr-8">
                        <DialogHeader className="min-w-0 text-left">
                            <DialogTitle className="truncate">
                                {document?.originalFilename ??
                                    'Document preview'}
                            </DialogTitle>
                            <DialogDescription>
                                {document?.taxDeclarationNumber
                                    ? `Tax declaration ${document.taxDeclarationNumber}`
                                    : 'Archived document'}
                                {document?.registeredOwner
                                    ? ` · ${document.registeredOwner}`
                                    : ''}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant={
                                    panelView === 'info' ? 'secondary' : 'ghost'
                                }
                                size="icon"
                                aria-label={
                                    infoOpen
                                        ? 'Hide document information'
                                        : 'Show document information'
                                }
                                aria-pressed={infoOpen && panelView === 'info'}
                                title={
                                    infoOpen
                                        ? 'Hide document information'
                                        : 'Show document information'
                                }
                                onClick={handleInfoToggle}
                                className="size-9 shrink-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                            >
                                <Info aria-hidden="true" />
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    panelView === 'history'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                size="icon"
                                aria-label="Show document history"
                                aria-pressed={panelView === 'history'}
                                title="Document history"
                                onClick={handleHistoryToggle}
                                className="size-9 shrink-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                            >
                                <History aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                    {document && (
                        <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                                {document.mimeType === 'application/pdf' ? (
                                    <Suspense
                                        fallback={
                                            <div className="flex min-h-0 flex-1 items-center justify-center gap-2 border border-slate-200 bg-slate-100 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                <Spinner />
                                                Loading PDF viewer…
                                            </div>
                                        }
                                    >
                                        <PdfPreview
                                            key={document.id}
                                            url={document.viewUrl}
                                            title={document.originalFilename}
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto border border-slate-200 bg-slate-100 p-2 dark:border-slate-800 dark:bg-slate-900">
                                        <img
                                            src={document.viewUrl}
                                            alt={document.originalFilename}
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
                open={infoOpen && document !== null}
                onOpenChange={onInfoOpenChange}
            >
                <DialogContent
                    overlayClassName="!pointer-events-none !bg-transparent"
                    className="flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-none p-0 sm:w-[min(30vw,32rem)] sm:max-w-none lg:!top-[5vh] lg:!left-[68vw] lg:!h-[90vh] lg:!w-[30vw] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0"
                >
                    {document &&
                        (panelView === 'history' ? (
                            <DocumentHistory document={document} />
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 p-4 pr-12 text-left dark:border-slate-800">
                                    <span className="flex size-8 items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                        <Info
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            Document information
                                        </div>
                                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                            {document.originalFilename}
                                        </div>
                                    </div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    <div className="grid gap-5 p-4">
                                        <InfoSection title="Declaration details">
                                            <InfoField
                                                label="Tax declaration number"
                                                value={
                                                    document.taxDeclarationNumber
                                                }
                                            />
                                            <InfoField
                                                label="Previous tax declaration number"
                                                value={
                                                    document.previousTaxDeclarationNumber
                                                }
                                                onClick={() =>
                                                    setPanelView('history')
                                                }
                                            />
                                            <InfoField
                                                label="Title number"
                                                value={document.titleNumber}
                                            />
                                            <InfoField
                                                label="Lot number"
                                                value={document.lotNumber}
                                            />
                                            <InfoField
                                                label="PIN"
                                                value={document.pin}
                                            />
                                            <InfoField
                                                label="Owner / property"
                                                value={document.registeredOwner}
                                                fullWidth
                                            />
                                        </InfoSection>

                                        <InfoSection title="Address of owner">
                                            <InfoField
                                                label="Street"
                                                value={
                                                    document.ownerAddressStreet
                                                }
                                            />
                                            <InfoField
                                                label="Barangay"
                                                value={
                                                    document.ownerAddressBarangay
                                                }
                                            />
                                            <InfoField
                                                label="District"
                                                value={
                                                    document.ownerAddressDistrict
                                                }
                                            />
                                            <InfoField
                                                label="City / municipality"
                                                value={
                                                    document.ownerAddressCityMunicipality
                                                }
                                            />
                                        </InfoSection>

                                        <InfoSection title="Location of property">
                                            <InfoField
                                                label="Street"
                                                value={
                                                    document.propertyLocationStreet
                                                }
                                            />
                                            <InfoField
                                                label="Barangay"
                                                value={
                                                    document.propertyLocationBarangay ??
                                                    document.barangay
                                                }
                                            />
                                            <InfoField
                                                label="District"
                                                value={
                                                    document.propertyLocationDistrict
                                                }
                                            />
                                            <InfoField
                                                label="City / municipality"
                                                value={
                                                    document.propertyLocationMunicipality ??
                                                    document.municipality
                                                }
                                            />
                                        </InfoSection>

                                        <InfoSection title="Land details">
                                            <InfoField
                                                label="Province"
                                                value={document.province}
                                            />
                                            <InfoField
                                                label="Area"
                                                value={document.area}
                                            />
                                            <InfoField
                                                label="North boundary"
                                                value={document.boundaryNorth}
                                            />
                                            <InfoField
                                                label="South boundary"
                                                value={document.boundarySouth}
                                            />
                                            <InfoField
                                                label="East boundary"
                                                value={document.boundaryEast}
                                            />
                                            <InfoField
                                                label="West boundary"
                                                value={document.boundaryWest}
                                            />
                                            <InfoField
                                                label="Remarks"
                                                value={document.remarks}
                                                fullWidth
                                            />
                                        </InfoSection>

                                        <InfoSection title="File details">
                                            <InfoField
                                                label="File type"
                                                value={document.mimeType}
                                            />
                                            <InfoField
                                                label="File size"
                                                value={formatFileSize(
                                                    document.fileSize,
                                                )}
                                            />
                                            <InfoField
                                                label="Date added"
                                                value={formatDate(
                                                    document.createdAt,
                                                )}
                                            />
                                        </InfoSection>
                                    </div>
                                </div>
                            </div>
                        ))}
                </DialogContent>
            </Dialog>
        </>
    );
}

function InfoSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                {title}
            </h3>
            <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</dl>
        </section>
    );
}

function InfoField({
    label,
    value,
    fullWidth = false,
    onClick,
}: {
    label: string;
    value: string | null;
    fullWidth?: boolean;
    onClick?: () => void;
}) {
    return (
        <div
            className={`grid min-w-0 gap-1 ${fullWidth ? 'sm:col-span-2' : ''}`}
        >
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {label}
            </dt>
            <dd className="text-sm break-words text-slate-900 dark:text-slate-100">
                {onClick && value ? (
                    <button
                        type="button"
                        onClick={onClick}
                        className="text-left underline decoration-slate-400 underline-offset-2 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:decoration-slate-500 dark:hover:text-blue-300"
                    >
                        {value}
                    </button>
                ) : (
                    value || '—'
                )}
            </dd>
        </div>
    );
}
