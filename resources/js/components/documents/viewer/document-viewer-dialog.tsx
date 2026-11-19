import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
    Columns2,
    ClipboardList,
    FileText,
    History,
    Info,
    MapPin,
    CircleDot,
    Network,
    ScanText,
} from 'lucide-react';
import ClientOnly from '@/components/client-only';
import type { PdfHighlight, PdfViewport } from '@/components/pdf/pdf-preview';
import { useClientComponent } from '@/hooks/use-client-component';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatDate, formatFileSize } from '@/lib/document-formatters';
import type { ArchivedDocument } from '@/types/documents';
import DocumentChain from '../history/document-chain';
import DocumentHistory from '../history/document-history';
import DocumentOcrPanel, { type OcrRegion } from '../ocr/document-ocr-panel';
import OcrReviewBadge from '../ocr/ocr-review-badge';
import EditableInfoSection from './editable-info-section';
import BoundaryCompass from './boundary-compass';
import ViewerActions from './viewer-actions';
import {
    documentInfoFields,
    metadataInfoFields,
} from '@/lib/document-info-fields';
import {
    documentHeading,
    documentSubheading,
} from '@/pages/documents/components/browser/document-view-helpers';
import DocumentAttachmentsSection from './document-attachments-section';
import DocumentAuditPanel from './document-audit-panel';
import DocumentLocationPanel from './document-location-panel';
import DocumentStatusPanel from './document-status-panel';
import DocumentActionDialog from './document-action-dialog';

const panelButtonClassName =
    'h-8 shrink-0 rounded-md border-0 px-2.5 text-xs text-foreground shadow-none hover:bg-background/60 hover:text-foreground focus-visible:z-10 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs';

function loadPdfPreview() {
    return import('@/components/pdf/pdf-preview');
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
    hoveredHighlightId = null,
    onSelectHighlight,
    onHoverHighlight,
    focusPage = null,
    onViewportChange,
    onDocumentLoad,
    defaultFit = 'width',
    extraControls,
}: {
    url: string;
    title: string;
    highlights?: PdfHighlight[];
    selectedHighlightId?: number | null;
    hoveredHighlightId?: number | null;
    onSelectHighlight?: (id: number) => void;
    onHoverHighlight?: (id: number | null) => void;
    focusPage?: number | null;
    onViewportChange?: (viewport: PdfViewport) => void;
    onDocumentLoad?: (document: PDFDocumentProxy | null) => void;
    defaultFit?: 'width' | 'page';
    extraControls?: ReactNode;
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
            hoveredHighlightId={hoveredHighlightId}
            onSelectHighlight={onSelectHighlight}
            onHoverHighlight={onHoverHighlight}
            focusPage={focusPage}
            onViewportChange={onViewportChange}
            onDocumentLoad={onDocumentLoad}
            defaultFit={defaultFit}
            extraControls={extraControls}
        />
    );
}

type DocumentViewerDialogProps = {
    document: ArchivedDocument | null;
    infoOpen: boolean;
    onDocumentChange: (document: ArchivedDocument | null) => void;
    onInfoOpenChange: (open: boolean) => void;
    onFieldsSaved?: (document: ArchivedDocument) => void;
    onOcrReviewChange?: (documentId: number, reviewedAt: string | null) => void;
};

export default function DocumentViewerDialog({
    document,
    infoOpen,
    onDocumentChange,
    onInfoOpenChange,
    onFieldsSaved,
    onOcrReviewChange,
}: DocumentViewerDialogProps) {
    const [panelView, setPanelView] = useState<
        'info' | 'history' | 'ocr' | 'audit' | 'location' | 'status'
    >('info');
    const [comparison, setComparison] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const actionButton = useRef<HTMLButtonElement | null>(null);
    const [pdfViewport, setPdfViewport] = useState<PdfViewport | null>(null);
    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(
        null,
    );
    const [regions, setRegions] = useState<OcrRegion[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
    const [attachmentPage, setAttachmentPage] = useState<number | null>(null);
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
    const documentActionOptions =
        viewing && !viewing.usesTaxFields && viewing.filingPath === 'route'
            ? [
                  {
                      label: 'Take action',
                      Icon: <CircleDot />,
                      onClick: () => setActionOpen(true),
                  },
              ]
            : [];
    const handleFieldsSaved = (updated: ArchivedDocument) => {
        onDocumentChange(updated);
        onFieldsSaved?.(updated);
    };
    const handleReviewChange = (reviewedAt: string | null) => {
        if (!document) return;
        onDocumentChange({ ...document, ocrReviewedAt: reviewedAt });
        onOcrReviewChange?.(document.id, reviewedAt);
    };

    useEffect(() => {
        if (!infoOpen) {
            setPanelView('info');
        }
    }, [infoOpen]);

    useEffect(() => {
        if (viewing && !viewing.usesTaxFields && panelView === 'history') {
            setPanelView('info');
        }
    }, [viewing, panelView]);

    useEffect(() => {
        ignoreDockClose.current = false;
        setComparison(false);
        setRegions([]);
        setPdfViewport(null);
        setPdfDocument(null);
        setSelectedRegion(null);
        setHoveredRegion(null);
        setAttachmentPage(null);
        setActionOpen(false);
    }, [document?.id]);

    useEffect(() => {
        setHoveredRegion(null);
    }, [comparison]);

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
        if (infoOpen && panelView === 'ocr' && comparison) {
            ignoreDockClose.current = false;
            setComparison(false);
            onInfoOpenChange(false);
            return;
        }

        if (!infoOpen) {
            onInfoOpenChange(true);
        }

        setPanelView('ocr');
        ignoreDockClose.current = true;
        setComparison(true);
    };

    const pdfHighlights = useMemo(
        () =>
            comparison
                ? regions.map((region, id) => ({
                      id,
                      page: region.page,
                      box: region.box,
                      pageWidth: region.pageWidth,
                      pageHeight: region.pageHeight,
                  }))
                : [],
        [comparison, regions],
    );

    const scannedPageCount =
        pdfDocument?.numPages ??
        (viewing &&
        viewing.mimeType !== 'application/pdf' &&
        viewing.ocrPdfUrl === null
            ? 1
            : null);
    const goToAttachmentPage = (page: number) => {
        setSelectedRegion(null);
        setAttachmentPage(page);
    };
    const ocrViewControl =
        infoOpen && panelView === 'ocr' ? (
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={comparison ? 'Text only' : 'Compare'}
                title={comparison ? 'Text only' : 'Compare'}
                onClick={() => {
                    ignoreDockClose.current = !comparison;
                    setComparison((current) => !current);
                }}
                className="size-8 rounded-none"
            >
                {comparison ? (
                    <FileText aria-hidden="true" />
                ) : (
                    <Columns2 aria-hidden="true" />
                )}
            </Button>
        ) : null;

    return (
        <>
            <Dialog
                open={document !== null}
                modal={chainDocument === null}
                disablePointerDismissal={chainDocument !== null || actionOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        if (chainDocument || actionOpen) {
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
                            ? '!max-w-none sm:!max-w-none lg:!left-[2vw] lg:!w-[calc(66vw+30vw)]'
                            : viewerInfoOpen
                              ? 'lg:!left-[2vw] lg:!w-[66vw]'
                              : '!max-w-none sm:!max-w-none lg:!left-[17vw] lg:!w-[66vw]',
                    )}
                >
                    <div className="flex shrink-0 flex-col gap-3 pr-8 xl:flex-row xl:items-center xl:justify-between">
                        <DialogHeader className="min-w-0 gap-1.5 text-left">
                            <DialogTitle className="text-base leading-6">
                                {viewing
                                    ? viewing.usesTaxFields &&
                                      viewing.taxDeclarationNumber
                                        ? `Tax declaration ${viewing.taxDeclarationNumber}`
                                        : documentHeading(viewing)
                                    : 'Archived document'}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <DialogDescription className="min-w-0 text-[13px] break-words">
                                    {viewing
                                        ? documentSubheading(viewing) ||
                                          viewing.documentTypeName ||
                                          'Document preview'
                                        : 'Document preview'}
                                </DialogDescription>
                                {viewing && (
                                    <OcrReviewBadge
                                        reviewedAt={viewing.ocrReviewedAt}
                                        tone="details"
                                        compact
                                        className="text-foreground dark:text-foreground"
                                    />
                                )}
                            </div>
                        </DialogHeader>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <div
                                role="group"
                                aria-label="Document views"
                                className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.5"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={
                                        infoOpen && panelView === 'info'
                                            ? 'Hide document information'
                                            : 'Show document information'
                                    }
                                    aria-pressed={
                                        infoOpen && panelView === 'info'
                                    }
                                    title={
                                        infoOpen && panelView === 'info'
                                            ? 'Hide document information'
                                            : 'Show document information'
                                    }
                                    onClick={handleInfoToggle}
                                    className={panelButtonClassName}
                                >
                                    <Info aria-hidden="true" />
                                    Info
                                </Button>
                                {viewing?.usesTaxFields ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        aria-label="Show document history"
                                        aria-pressed={
                                            infoOpen && panelView === 'history'
                                        }
                                        title="Document history"
                                        onClick={handleHistoryToggle}
                                        className={panelButtonClassName}
                                    >
                                        <History aria-hidden="true" />
                                        History
                                    </Button>
                                ) : null}
                                {(['location', 'status'] as const).map(
                                    (panel) => {
                                        const Icon =
                                            panel === 'location'
                                                ? MapPin
                                                : CircleDot;
                                        const label =
                                            panel === 'location'
                                                ? 'Location'
                                                : 'Status';
                                        return (
                                            <Button
                                                key={panel}
                                                type="button"
                                                variant="ghost"
                                                aria-label={`Show document ${panel}`}
                                                aria-pressed={
                                                    infoOpen &&
                                                    panelView === panel
                                                }
                                                title={`Document ${panel}`}
                                                onClick={() => {
                                                    if (
                                                        infoOpen &&
                                                        panelView === panel
                                                    ) {
                                                        onInfoOpenChange(false);
                                                        return;
                                                    }
                                                    onInfoOpenChange(true);
                                                    setPanelView(panel);
                                                }}
                                                className={panelButtonClassName}
                                            >
                                                <Icon aria-hidden="true" />
                                                {label}
                                            </Button>
                                        );
                                    },
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="Show document audit"
                                    aria-pressed={
                                        infoOpen && panelView === 'audit'
                                    }
                                    title="Document audit"
                                    onClick={() => {
                                        if (infoOpen && panelView === 'audit') {
                                            onInfoOpenChange(false);
                                            return;
                                        }
                                        onInfoOpenChange(true);
                                        setPanelView('audit');
                                    }}
                                    className={panelButtonClassName}
                                >
                                    <ClipboardList aria-hidden="true" />
                                    Audit
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={
                                        infoOpen &&
                                        panelView === 'ocr' &&
                                        comparison
                                            ? 'Hide OCR comparison'
                                            : 'Show OCR comparison'
                                    }
                                    aria-pressed={
                                        infoOpen && panelView === 'ocr'
                                    }
                                    title="OCR comparison"
                                    onClick={handleOcrToggle}
                                    className={panelButtonClassName}
                                >
                                    <ScanText aria-hidden="true" />
                                    OCR
                                </Button>
                            </div>
                            {viewing?.usesTaxFields ? (
                                <div
                                    role="group"
                                    aria-label="Document actions"
                                    className="flex items-center gap-1 border-l border-border pl-2"
                                >
                                    <Button
                                        type="button"
                                        variant={
                                            chainDocument
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="icon"
                                        aria-label="Show document chain"
                                        aria-pressed={chainDocument !== null}
                                        title="Document chain"
                                        onClick={() => {
                                            setChainDocument((current) =>
                                                current?.id === viewing.id
                                                    ? null
                                                    : viewing,
                                            );
                                        }}
                                        className="size-9 shrink-0 text-foreground"
                                    >
                                        <Network aria-hidden="true" />
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {viewing && (
                        <div
                            onClick={(event) => {
                                const target = event.target;
                                if (
                                    !comparison ||
                                    !(target instanceof Element) ||
                                    !event.currentTarget.contains(target) ||
                                    !target.closest(
                                        '[data-document-viewport]',
                                    ) ||
                                    target.closest(
                                        '[data-pan-region], button, input, textarea, select, a, label, [contenteditable]',
                                    )
                                ) {
                                    return;
                                }

                                setSelectedRegion(null);
                                setHoveredRegion(null);
                            }}
                            className={cn(
                                'min-h-0 flex-1 gap-4',
                                comparison
                                    ? 'grid grid-cols-2'
                                    : 'flex flex-col md:flex-row',
                            )}
                        >
                            <div
                                className={cn(
                                    'relative flex min-h-0 min-w-0 flex-col gap-3',
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
                                            onDocumentLoad={setPdfDocument}
                                            extraControls={ocrViewControl}
                                            defaultFit={
                                                comparison ? 'page' : 'width'
                                            }
                                            highlights={pdfHighlights}
                                            selectedHighlightId={selectedRegion}
                                            hoveredHighlightId={hoveredRegion}
                                            onHoverHighlight={setHoveredRegion}
                                            focusPage={
                                                attachmentPage ??
                                                (selectedRegion === null
                                                    ? null
                                                    : (regions[selectedRegion]
                                                          ?.page ?? null))
                                            }
                                            onSelectHighlight={(id) => {
                                                setAttachmentPage(null);
                                                setSelectedRegion(id);
                                            }}
                                        />
                                    </ClientOnly>
                                ) : (
                                    <>
                                        {ocrViewControl && (
                                            <div className="flex shrink-0 justify-end border border-slate-200 bg-card p-2 dark:border-neutral-800 dark:bg-black">
                                                {ocrViewControl}
                                            </div>
                                        )}
                                        <div
                                            data-document-viewport
                                            className="flex min-h-0 flex-1 items-center justify-center overflow-auto border border-slate-200 bg-slate-100 p-2 dark:border-neutral-800 dark:bg-neutral-900"
                                        >
                                            <img
                                                src={viewing.viewUrl}
                                                alt={viewing.originalFilename}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                    </>
                                )}
                                {!comparison &&
                                    !(
                                        viewerInfoOpen && panelView === 'ocr'
                                    ) && (
                                        <ViewerActions
                                            label="Document actions"
                                            triggerRef={actionButton}
                                            options={documentActionOptions}
                                        />
                                    )}
                            </div>
                            {comparison && viewing && (
                                <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden">
                                    <DocumentOcrPanel
                                        key={viewing.id}
                                        document={viewing}
                                        actionOptions={documentActionOptions}
                                        actionTriggerRef={actionButton}
                                        comparing
                                        pdfViewport={pdfViewport}
                                        pdfDocument={pdfDocument}
                                        onRegionsChange={handleRegions}
                                        selectedRegion={selectedRegion}
                                        hoveredRegion={hoveredRegion}
                                        onHoverRegion={setHoveredRegion}
                                        onSelectRegion={setSelectedRegion}
                                        onReviewChange={handleReviewChange}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
                {actionOpen &&
                    document &&
                    viewing &&
                    viewing.filingPath === 'route' &&
                    !viewing.usesTaxFields && (
                        <DocumentActionDialog
                            key={viewing.id}
                            documentId={viewing.id}
                            title={
                                viewing.title ??
                                viewing.trackingCode ??
                                'Document'
                            }
                            finalFocus={actionButton}
                            onClose={() => setActionOpen(false)}
                            onChanged={(status) => {
                                const updated = { ...viewing, status };
                                onDocumentChange(updated);
                                onFieldsSaved?.(updated);
                            }}
                        />
                    )}
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
                        (panelView === 'history' && viewing.usesTaxFields ? (
                            <DocumentHistory
                                document={viewing}
                                onDocumentChange={onDocumentChange}
                                onShowInfo={() => setPanelView('info')}
                            />
                        ) : panelView === 'location' ? (
                            <DocumentLocationPanel
                                key={viewing.id}
                                documentId={viewing.id}
                                onNavigate={() => {
                                    onInfoOpenChange(false);
                                    onDocumentChange(null);
                                }}
                            />
                        ) : panelView === 'status' ? (
                            <DocumentStatusPanel
                                key={`${viewing.id}:${viewing.status}`}
                                documentId={viewing.id}
                                onChanged={(status) => {
                                    const updated = { ...viewing, status };
                                    onDocumentChange(updated);
                                    onFieldsSaved?.(updated);
                                }}
                            />
                        ) : panelView === 'audit' ? (
                            <DocumentAuditPanel
                                key={`${viewing.id}:${viewing.status}`}
                                documentId={viewing.id}
                            />
                        ) : panelView === 'ocr' ? (
                            <DocumentOcrPanel
                                key={viewing.id}
                                document={viewing}
                                actionOptions={documentActionOptions}
                                actionTriggerRef={actionButton}
                                onRegionsChange={handleRegions}
                                onReviewChange={handleReviewChange}
                            />
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-12">
                                    <Info
                                        aria-hidden="true"
                                        className="size-5 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <DialogTitle className="text-base font-semibold">
                                            Document information
                                        </DialogTitle>
                                        <DialogDescription className="mt-0.5 truncate text-xs">
                                            {viewing.originalFilename}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                    <div className="grid gap-5 p-4">
                                        {viewing.officeLocation && (
                                            <InfoSection title="Office location">
                                                {viewing.trackingCode && (
                                                    <InfoField
                                                        label="Tracking code"
                                                        value={
                                                            viewing.trackingCode
                                                        }
                                                    />
                                                )}
                                                <InfoField
                                                    label={
                                                        viewing.officeLocation
                                                            .inTransit
                                                            ? 'Released from'
                                                            : 'Current office'
                                                    }
                                                    value={
                                                        viewing.officeLocation
                                                            .officeName
                                                    }
                                                />
                                                {viewing.officeLocation
                                                    .inTransit && (
                                                    <InfoField
                                                        label="In transit to"
                                                        value={
                                                            viewing
                                                                .officeLocation
                                                                .destinationOfficeName
                                                        }
                                                    />
                                                )}
                                            </InfoSection>
                                        )}
                                        {viewing.usesTaxFields ? (
                                            <TaxDocumentInfo
                                                document={viewing}
                                                active={document !== null}
                                                onSaved={handleFieldsSaved}
                                                onShowHistory={() =>
                                                    setPanelView('history')
                                                }
                                            />
                                        ) : (
                                            <MetadataDocumentInfo
                                                document={viewing}
                                                active={document !== null}
                                                onSaved={handleFieldsSaved}
                                                scannedPageCount={
                                                    scannedPageCount
                                                }
                                                onGoToPage={goToAttachmentPage}
                                            />
                                        )}
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
                document={viewing?.usesTaxFields ? chainDocument : null}
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

function TaxDocumentInfo({
    document,
    active,
    onSaved,
    onShowHistory,
}: {
    document: ArchivedDocument;
    active: boolean;
    onSaved: (document: ArchivedDocument) => void;
    onShowHistory: () => void;
}) {
    return (
        <>
            <EditableInfoSection
                key={`${document.id}-declaration`}
                title="Declaration details"
                document={document}
                fields={documentInfoFields.declaration}
                active={active}
                onSaved={onSaved}
            >
                <InfoField
                    label="Tax declaration number"
                    value={document.taxDeclarationNumber}
                />
                <InfoField
                    label="Declaration date"
                    value={formatDate(document.declarationDate)}
                />
                <InfoField
                    label="Previous tax declaration number"
                    value={document.previousTaxDeclarationNumber}
                    onClick={onShowHistory}
                />
                <InfoField
                    label="Previous declaration date"
                    value={formatDate(document.previousDeclarationDate)}
                />
                <InfoField label="Title number" value={document.titleNumber} />
                <InfoField label="Lot number" value={document.lotNumber} />
                <InfoField label="PIN" value={document.pin} />
                <InfoField
                    label="Owner / property"
                    value={document.registeredOwner}
                    fullWidth
                />
            </EditableInfoSection>
            <EditableInfoSection
                key={`${document.id}-owner`}
                title="Address of owner"
                document={document}
                fields={documentInfoFields.owner}
                active={active}
                onSaved={onSaved}
            >
                <InfoField label="Street" value={document.ownerAddressStreet} />
                <InfoField
                    label="Barangay"
                    value={document.ownerAddressBarangay}
                />
                <InfoField
                    label="District"
                    value={document.ownerAddressDistrict}
                />
                <InfoField
                    label="City / municipality"
                    value={document.ownerAddressCityMunicipality}
                />
            </EditableInfoSection>
            <EditableInfoSection
                key={`${document.id}-location`}
                title="Location of property"
                document={document}
                fields={documentInfoFields.location}
                active={active}
                onSaved={onSaved}
            >
                <InfoField
                    label="Street"
                    value={document.propertyLocationStreet}
                />
                <InfoField
                    label="Barangay"
                    value={
                        document.propertyLocationBarangay ?? document.barangay
                    }
                />
                <InfoField
                    label="District"
                    value={document.propertyLocationDistrict}
                />
                <InfoField
                    label="City / municipality"
                    value={
                        document.propertyLocationMunicipality ??
                        document.municipality
                    }
                />
            </EditableInfoSection>
            <EditableInfoSection
                key={`${document.id}-land`}
                title="Land details"
                document={document}
                fields={documentInfoFields.land}
                active={active}
                onSaved={onSaved}
            >
                <InfoField label="Province" value={document.province} />
                <InfoField label="Area" value={document.area} />
                <BoundaryCompass document={document} />
            </EditableInfoSection>
            <EditableInfoSection
                key={`${document.id}-remarks`}
                title="Remarks"
                document={document}
                fields={documentInfoFields.remarks}
                active={active}
                onSaved={onSaved}
            >
                <div className="min-w-0 sm:col-span-2">
                    <dt className="sr-only">Remarks</dt>
                    <dd className="text-sm break-words whitespace-pre-wrap text-foreground">
                        {document.remarks || '—'}
                    </dd>
                </div>
            </EditableInfoSection>
        </>
    );
}

function MetadataDocumentInfo({
    document,
    active,
    onSaved,
    scannedPageCount,
    onGoToPage,
}: {
    document: ArchivedDocument;
    active: boolean;
    onSaved: (document: ArchivedDocument) => void;
    scannedPageCount: number | null;
    onGoToPage: (page: number) => void;
}) {
    return (
        <>
            <EditableInfoSection
                key={`${document.id}-document`}
                title="Document"
                document={document}
                fields={metadataInfoFields.document}
                active={active}
                onSaved={onSaved}
            >
                <InfoField label="Title" value={document.title} fullWidth />
                <InfoField
                    label="Correspondent"
                    value={document.correspondent}
                    fullWidth
                />
                <InfoField
                    label="Date of letter"
                    value={formatDate(document.letterDate)}
                />
            </EditableInfoSection>
            <DocumentAttachmentsSection
                documentId={document.id}
                attachments={document.attachments}
                active={active}
                onSaved={onSaved}
                scannedPageCount={scannedPageCount}
                onGoToPage={onGoToPage}
            />
            <EditableInfoSection
                key={`${document.id}-remarks`}
                title="Remarks"
                document={document}
                fields={metadataInfoFields.remarks}
                active={active}
                onSaved={onSaved}
            >
                <div className="min-w-0 sm:col-span-2">
                    <dt className="sr-only">Remarks</dt>
                    <dd className="text-sm break-words whitespace-pre-wrap text-foreground">
                        {document.remarks || '—'}
                    </dd>
                </div>
            </EditableInfoSection>
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
            <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-neutral-800 dark:text-neutral-100">
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
            <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                {label}
            </dt>
            <dd className="text-sm break-words text-slate-900 dark:text-neutral-100">
                {onClick && value ? (
                    <button
                        type="button"
                        onClick={onClick}
                        className="text-left underline decoration-slate-400 underline-offset-2 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:decoration-neutral-500 dark:hover:text-white"
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
