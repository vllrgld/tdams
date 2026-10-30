import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { useForm } from '@inertiajs/react';
import { History, Info, Link } from 'lucide-react';
import { toast } from 'sonner';
import ClientOnly from '@/components/client-only';
import type { PdfHighlight, PdfViewport } from '@/components/pdf-preview';
import InputError from '@/components/input-error';
import { useClientComponent } from '@/hooks/use-client-component';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatDate, formatFileSize } from '../lib/formatters';
import type { ArchivedDocument } from '../types';
import DeclarationNumberSearch from './declaration-number-search';
import DocumentChain from './document-chain';
import DocumentHistory from './document-history';
import DocumentOcrPanel, {
    OcrIcon,
    type OcrRegion,
} from './document-ocr-panel';

function loadPdfPreview() {
    return import('@/components/pdf-preview');
}

function pdfViewerFallback(): ReactNode {
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 border border-slate-200 bg-slate-100 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Spinner />
            Loading PDF viewer…
        </div>
    );
}

function ClientPdfPreview({
    url,
    title,
    highlights = [],
    selectedHighlightId = null,
    onSelectHighlight,
    focusPage = null,
    onViewportChange,
    defaultFit = 'width',
}: {
    url: string;
    title: string;
    highlights?: PdfHighlight[];
    selectedHighlightId?: number | null;
    onSelectHighlight?: (id: number) => void;
    focusPage?: number | null;
    onViewportChange?: (viewport: PdfViewport) => void;
    defaultFit?: 'width' | 'page';
}) {
    const [PdfPreview, viewerError] = useClientComponent(loadPdfPreview);

    if (viewerError) {
        return (
            <p
                role="alert"
                className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-red-800 dark:text-red-300"
            >
                The PDF viewer could not be loaded. {viewerError}
            </p>
        );
    }

    if (!PdfPreview) {
        return pdfViewerFallback();
    }

    return (
        <PdfPreview
            url={url}
            title={title}
            highlights={highlights}
            selectedHighlightId={selectedHighlightId}
            onSelectHighlight={onSelectHighlight}
            focusPage={focusPage}
            onViewportChange={onViewportChange}
            defaultFit={defaultFit}
        />
    );
}

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
    const [panelView, setPanelView] = useState<'info' | 'history' | 'ocr'>(
        'info',
    );
    const [comparison, setComparison] = useState(false);
    const [pdfViewport, setPdfViewport] = useState<PdfViewport | null>(null);
    const [regions, setRegions] = useState<OcrRegion[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const ignoreDockClose = useRef(false);
    const handleRegions = useCallback((next: OcrRegion[]) => {
        setRegions(next);
    }, []);
    const [chainDocument, setChainDocument] = useState<ArchivedDocument | null>(
        null,
    );
    const [displayedDocument, setDisplayedDocument] =
        useState<ArchivedDocument | null>(document);
    const [displayedInfoOpen, setDisplayedInfoOpen] = useState(infoOpen);
    const viewing = document ?? displayedDocument;
    const viewerInfoOpen = document ? infoOpen : displayedInfoOpen;

    useEffect(() => {
        if (!infoOpen) {
            setPanelView('info');
        }
    }, [infoOpen]);

    useEffect(() => {
        ignoreDockClose.current = false;
        setComparison(false);
        setRegions([]);
        setPdfViewport(null);
        setSelectedRegion(null);
    }, [document?.id]);

    useEffect(() => {
        if (!infoOpen || panelView !== 'ocr') {
            ignoreDockClose.current = false;
            setComparison(false);
        }
    }, [infoOpen, panelView]);

    useEffect(() => {
        if (!document) {
            setChainDocument(null);
            return;
        }

        setDisplayedDocument(document);
        setDisplayedInfoOpen(infoOpen);
    }, [document, infoOpen]);

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

    const handleOcrToggle = () => {
        if (infoOpen && panelView === 'ocr') {
            onInfoOpenChange(false);
            return;
        }

        if (!infoOpen) {
            onInfoOpenChange(true);
        }

        setPanelView('ocr');
    };

    return (
        <>
            <Dialog
                open={document !== null}
                modal={chainDocument === null}
                disablePointerDismissal={chainDocument !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        if (chainDocument) {
                            return;
                        }

                        onDocumentChange(null);
                        onInfoOpenChange(false);
                    }
                }}
            >
                <DialogContent
                    className={cn(
                        'flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden rounded-none p-4 sm:p-6 lg:!top-[5vh] lg:!h-[90vh] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0 dark:border-neutral-800 dark:bg-black',
                        'transition-[left,width,opacity,transform] [transition-duration:300ms,300ms,200ms,200ms] ease-in-out data-ending-style:duration-200 motion-reduce:transition-none',
                        comparison
                            ? '!top-[2vh] !h-[96vh] !max-h-[96vh] !max-w-none !translate-y-0 sm:!max-w-none lg:!top-[2vh] lg:!left-[2vw] lg:!h-[96vh] lg:!w-[96vw]'
                            : viewerInfoOpen
                              ? 'lg:!left-[2vw] lg:!w-[66vw]'
                              : '!max-w-none sm:!max-w-none lg:!left-[17vw] lg:!w-[66vw]',
                    )}
                >
                    <div className="flex shrink-0 items-start justify-between gap-3 pr-8">
                        <DialogHeader className="min-w-0 text-left">
                            <DialogTitle className="truncate">
                                {viewing?.originalFilename ??
                                    'Document preview'}
                            </DialogTitle>
                            <DialogDescription>
                                {viewing?.taxDeclarationNumber
                                    ? `Tax declaration ${viewing.taxDeclarationNumber}`
                                    : 'Archived document'}
                                {viewing?.registeredOwner
                                    ? ` · ${viewing.registeredOwner}`
                                    : ''}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center gap-1">
                            {comparison && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        ignoreDockClose.current = false;
                                        setComparison(false);
                                    }}
                                    className="h-9 rounded-none text-xs"
                                >
                                    Exit comparison
                                </Button>
                            )}
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
                            <Button
                                type="button"
                                variant={
                                    panelView === 'ocr' ? 'secondary' : 'ghost'
                                }
                                size="icon"
                                aria-label={
                                    infoOpen && panelView === 'ocr'
                                        ? 'Hide OCR text'
                                        : 'Show OCR text'
                                }
                                aria-pressed={infoOpen && panelView === 'ocr'}
                                title="OCR text"
                                onClick={handleOcrToggle}
                                className="size-9 shrink-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                            >
                                <OcrIcon />
                            </Button>
                            <Button
                                type="button"
                                variant={chainDocument ? 'secondary' : 'ghost'}
                                size="icon"
                                aria-label="Show document chain"
                                aria-pressed={chainDocument !== null}
                                title="Document chain"
                                onClick={() => {
                                    if (!viewing) {
                                        return;
                                    }

                                    setChainDocument((current) =>
                                        current?.id === viewing.id
                                            ? null
                                            : viewing,
                                    );
                                }}
                                className="size-9 shrink-0 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                            >
                                <Link aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                    {viewing && (
                        <div
                            className={cn(
                                'min-h-0 flex-1 gap-4',
                                comparison
                                    ? 'grid grid-cols-2'
                                    : 'flex flex-col md:flex-row',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex min-h-0 min-w-0 flex-col gap-3',
                                    comparison ? 'w-full' : 'flex-1',
                                )}
                            >
                                {viewing.ocrPdfUrl ||
                                viewing.mimeType === 'application/pdf' ? (
                                    <ClientOnly fallback={pdfViewerFallback()}>
                                        <ClientPdfPreview
                                            key={`${viewing.id}-${viewing.ocrPdfUrl ?? 'original'}`}
                                            url={
                                                viewing.ocrPdfUrl ??
                                                viewing.viewUrl
                                            }
                                            title={viewing.originalFilename}
                                            onViewportChange={setPdfViewport}
                                            defaultFit={
                                                comparison ? 'page' : 'width'
                                            }
                                            highlights={
                                                comparison
                                                    ? regions.map(
                                                          (region, index) => ({
                                                              id: index,
                                                              page: region.page,
                                                              box: region.box,
                                                              pageWidth:
                                                                  region.pageWidth,
                                                              pageHeight:
                                                                  region.pageHeight,
                                                          }),
                                                      )
                                                    : []
                                            }
                                            selectedHighlightId={selectedRegion}
                                            focusPage={
                                                selectedRegion === null
                                                    ? null
                                                    : (regions[selectedRegion]
                                                          ?.page ?? null)
                                            }
                                            onSelectHighlight={
                                                setSelectedRegion
                                            }
                                        />
                                    </ClientOnly>
                                ) : (
                                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto border border-slate-200 bg-slate-100 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                                        <img
                                            src={viewing.viewUrl}
                                            alt={viewing.originalFilename}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                            {comparison && viewing && (
                                <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden">
                                    <DocumentOcrPanel
                                        key={viewing.id}
                                        document={viewing}
                                        comparing
                                        pdfViewport={pdfViewport}
                                        onComparisonChange={() => {
                                            ignoreDockClose.current = false;
                                            setComparison(false);
                                        }}
                                        onRegionsChange={handleRegions}
                                        selectedRegion={selectedRegion}
                                        onSelectRegion={setSelectedRegion}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                modal={false}
                disablePointerDismissal
                open={infoOpen && document !== null && !comparison}
                onOpenChange={(open) => {
                    if (!open && ignoreDockClose.current) {
                        return;
                    }

                    onInfoOpenChange(open);
                }}
            >
                <DialogContent
                    overlayClassName="!pointer-events-none !bg-transparent"
                    className="flex h-[90vh] max-h-[90vh] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-none p-0 motion-reduce:transition-none sm:w-[min(30vw,32rem)] sm:max-w-none lg:!top-[5vh] lg:!left-[68vw] lg:!h-[90vh] lg:!w-[30vw] lg:!max-w-none lg:!translate-x-0 lg:!translate-y-0 dark:border-neutral-800 dark:bg-black"
                >
                    {viewing &&
                        (panelView === 'history' ? (
                            <DocumentHistory
                                document={viewing}
                                onDocumentChange={onDocumentChange}
                                onShowInfo={() => setPanelView('info')}
                            />
                        ) : panelView === 'ocr' ? (
                            <DocumentOcrPanel
                                key={viewing.id}
                                document={viewing}
                                onComparisonChange={() => {
                                    ignoreDockClose.current = true;
                                    setComparison(true);
                                }}
                                onRegionsChange={handleRegions}
                            />
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 p-4 pr-12 text-left dark:border-neutral-800">
                                    <span className="flex size-8 items-center justify-center bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                                        <Info
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                                            Document information
                                        </div>
                                        <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                                            {viewing.originalFilename}
                                        </div>
                                    </div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    <div className="grid gap-5 p-4">
                                        <InfoSection title="Declaration details">
                                            <InfoField
                                                label="Tax declaration number"
                                                value={
                                                    viewing.taxDeclarationNumber
                                                }
                                            />
                                            <InfoField
                                                label="Declaration date"
                                                value={formatDate(
                                                    viewing.declarationDate,
                                                )}
                                            />
                                            {viewing.previousTaxDeclarationNumber ? (
                                                <>
                                                    <InfoField
                                                        label="Previous tax declaration number"
                                                        value={
                                                            viewing.previousTaxDeclarationNumber
                                                        }
                                                        onClick={() =>
                                                            setPanelView(
                                                                'history',
                                                            )
                                                        }
                                                    />
                                                    <InfoField
                                                        label="Previous declaration date"
                                                        value={formatDate(
                                                            viewing.previousDeclarationDate,
                                                        )}
                                                    />
                                                </>
                                            ) : (
                                                <PreviousDeclarationEditor
                                                    key={viewing.id}
                                                    document={viewing}
                                                    onSaved={(
                                                        previousNumber,
                                                        previousDeclarationDate,
                                                    ) =>
                                                        onDocumentChange({
                                                            ...viewing,
                                                            previousTaxDeclarationNumber:
                                                                previousNumber,
                                                            previousDeclarationDate,
                                                        })
                                                    }
                                                />
                                            )}
                                            <InfoField
                                                label="Title number"
                                                value={viewing.titleNumber}
                                            />
                                            <InfoField
                                                label="Lot number"
                                                value={viewing.lotNumber}
                                            />
                                            <InfoField
                                                label="PIN"
                                                value={viewing.pin}
                                            />
                                            <InfoField
                                                label="Owner / property"
                                                value={viewing.registeredOwner}
                                                fullWidth
                                            />
                                        </InfoSection>

                                        <InfoSection title="Address of owner">
                                            <InfoField
                                                label="Street"
                                                value={
                                                    viewing.ownerAddressStreet
                                                }
                                            />
                                            <InfoField
                                                label="Barangay"
                                                value={
                                                    viewing.ownerAddressBarangay
                                                }
                                            />
                                            <InfoField
                                                label="District"
                                                value={
                                                    viewing.ownerAddressDistrict
                                                }
                                            />
                                            <InfoField
                                                label="City / municipality"
                                                value={
                                                    viewing.ownerAddressCityMunicipality
                                                }
                                            />
                                        </InfoSection>

                                        <InfoSection title="Location of property">
                                            <InfoField
                                                label="Street"
                                                value={
                                                    viewing.propertyLocationStreet
                                                }
                                            />
                                            <InfoField
                                                label="Barangay"
                                                value={
                                                    viewing.propertyLocationBarangay ??
                                                    viewing.barangay
                                                }
                                            />
                                            <InfoField
                                                label="District"
                                                value={
                                                    viewing.propertyLocationDistrict
                                                }
                                            />
                                            <InfoField
                                                label="City / municipality"
                                                value={
                                                    viewing.propertyLocationMunicipality ??
                                                    viewing.municipality
                                                }
                                            />
                                        </InfoSection>

                                        <InfoSection title="Land details">
                                            <InfoField
                                                label="Province"
                                                value={viewing.province}
                                            />
                                            <InfoField
                                                label="Area"
                                                value={viewing.area}
                                            />
                                            <BoundaryCompass
                                                document={viewing}
                                            />
                                            <InfoField
                                                label="Remarks"
                                                value={viewing.remarks}
                                                fullWidth
                                            />
                                        </InfoSection>

                                        <InfoSection title="File details">
                                            <InfoField
                                                label="File type"
                                                value={viewing.mimeType}
                                            />
                                            <InfoField
                                                label="File size"
                                                value={formatFileSize(
                                                    viewing.fileSize,
                                                )}
                                            />
                                            <InfoField
                                                label="Compressed PDF"
                                                value={
                                                    viewing.ocrPdfSize === null
                                                        ? null
                                                        : formatFileSize(
                                                              viewing.ocrPdfSize,
                                                          )
                                                }
                                            />
                                            <InfoField
                                                label="Date added"
                                                value={formatDate(
                                                    viewing.createdAt,
                                                )}
                                            />
                                        </InfoSection>
                                    </div>
                                </div>
                            </div>
                        ))}
                </DialogContent>
            </Dialog>
            <DocumentChain
                document={chainDocument}
                onViewDocument={onDocumentChange}
                onOpenChange={(open) => {
                    if (!open) {
                        setChainDocument(null);
                    }
                }}
            />
        </>
    );
}

function PreviousDeclarationEditor({
    document,
    onSaved,
}: {
    document: ArchivedDocument;
    onSaved: (
        previousTaxDeclarationNumber: string,
        previousDeclarationDate: string | null,
    ) => void;
}) {
    const form = useForm({
        previous_tax_declaration_number: '',
        previous_declaration_date: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const previousNumber = form.data.previous_tax_declaration_number.trim();

        if (previousNumber === '') {
            return;
        }

        form.patch(`/documents/${document.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                onSaved(
                    previousNumber,
                    form.data.previous_declaration_date || null,
                );
                toast.success('Previous tax declaration number saved.');
            },
        });
    }

    return (
        <div className="grid min-w-0 gap-1 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Previous tax declaration number
            </dt>
            <dd>
                <form onSubmit={submit} className="grid gap-2">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <DeclarationNumberSearch
                                id={`document-${document.id}-previous`}
                                value={
                                    form.data.previous_tax_declaration_number
                                }
                                onChange={(value, match) => {
                                    form.setData(
                                        'previous_tax_declaration_number',
                                        value,
                                    );

                                    if (match?.declarationDate) {
                                        form.setData(
                                            'previous_declaration_date',
                                            match.declarationDate,
                                        );
                                    }
                                }}
                                excludeId={document.id}
                                excludeNumber={document.taxDeclarationNumber}
                                disabled={form.processing}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                form.data.previous_tax_declaration_number.trim() ===
                                    ''
                            }
                            className="h-9 shrink-0 rounded-none bg-blue-900 px-3 text-xs text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            {form.processing ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                    <InputError
                        message={form.errors.previous_tax_declaration_number}
                    />
                    <div className="grid gap-1">
                        <Label
                            htmlFor={`document-${document.id}-previous-date`}
                        >
                            Previous declaration date
                        </Label>
                        <Input
                            id={`document-${document.id}-previous-date`}
                            type="date"
                            value={form.data.previous_declaration_date}
                            onChange={(event) =>
                                form.setData(
                                    'previous_declaration_date',
                                    event.target.value,
                                )
                            }
                            disabled={form.processing}
                            className="rounded-none"
                        />
                        <InputError
                            message={form.errors.previous_declaration_date}
                        />
                    </div>
                </form>
            </dd>
        </div>
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
            <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-neutral-800 dark:text-neutral-100">
                {title}
            </h3>
            <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</dl>
        </section>
    );
}

function BoundaryCompass({ document }: { document: ArchivedDocument }) {
    return (
        <div className="grid min-w-0 gap-2 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Boundaries
            </dt>
            <dd>
                <dl className="grid grid-cols-3 gap-px border border-slate-200 bg-slate-200 dark:border-neutral-800 dark:bg-neutral-800">
                    <BoundaryCell direction="NW" label="Northwest">
                        {document.boundaryNorthwest}
                    </BoundaryCell>
                    <BoundaryCell direction="N" label="North">
                        {document.boundaryNorth}
                    </BoundaryCell>
                    <BoundaryCell direction="NE" label="Northeast">
                        {document.boundaryNortheast}
                    </BoundaryCell>
                    <BoundaryCell direction="W" label="West">
                        {document.boundaryWest}
                    </BoundaryCell>
                    <div className="flex min-h-16 flex-col items-center justify-center bg-card p-2 text-center">
                        <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                            Lot
                        </span>
                        <span className="max-w-full truncate text-xs font-semibold text-slate-900 dark:text-neutral-100">
                            {document.lotNumber || '—'}
                        </span>
                    </div>
                    <BoundaryCell direction="E" label="East">
                        {document.boundaryEast}
                    </BoundaryCell>
                    <BoundaryCell direction="SW" label="Southwest">
                        {document.boundarySouthwest}
                    </BoundaryCell>
                    <BoundaryCell direction="S" label="South">
                        {document.boundarySouth}
                    </BoundaryCell>
                    <BoundaryCell direction="SE" label="Southeast">
                        {document.boundarySoutheast}
                    </BoundaryCell>
                </dl>
            </dd>
        </div>
    );
}

function BoundaryCell({
    direction,
    label,
    children,
}: {
    direction: string;
    label: string;
    children: string | null;
}) {
    return (
        <div className="flex min-h-16 min-w-0 flex-col gap-1 bg-card p-2">
            <dt className="text-[10px] font-semibold text-blue-900 dark:text-blue-300">
                <abbr title={label} className="no-underline">
                    {direction}
                </abbr>
            </dt>
            <dd className="text-xs break-words text-slate-900 dark:text-neutral-100">
                {children || '—'}
            </dd>
        </div>
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
            <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                {label}
            </dt>
            <dd className="text-sm break-words text-slate-900 dark:text-neutral-100">
                {onClick && value ? (
                    <button
                        type="button"
                        onClick={onClick}
                        className="text-left underline decoration-slate-400 underline-offset-2 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:decoration-neutral-500 dark:hover:text-blue-300"
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
