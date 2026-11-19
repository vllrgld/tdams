import {
    type ComponentProps,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { usePage } from '@inertiajs/react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import {
    Archive,
    ArrowLeft,
    ArrowRight,
    Check,
    FileText,
    Send,
    Upload,
} from 'lucide-react';
import InputError from '@/components/input-error';
import DocumentProcessingProgress from '@/components/shadcn-studio/progress/progress-20';
import { Button } from '@/components/ui/button';
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
import { useDocumentUpload } from '@/pages/documents/hooks/use-document-upload';
import { formatFileSize } from '@/lib/document-formatters';
import { cn } from '@/lib/utils';
import { DOCUMENT_FILE_ACCEPT } from '../../lib/upload-file';
import { getUploadConnectorStart } from '../../lib/upload-progress';
import type { ArchivedDocument } from '@/types/documents';
import type {
    ArchivePlacementCabinet,
    DocumentFieldSection,
    DocumentTypeOption,
} from '../../types';
import ArchiveLocationPreview from './archive-location-preview';
import ArchivePlacementSelectors from './archive-placement-selectors';
import DocumentFieldReview from './document-field-review';
import DocumentUploadPreview from './document-upload-preview';

const AnimatedDialogHeader = motion.create(DialogHeader);
const AnimatedDialogFooter = motion.create(DialogFooter);
const resizeTransition: Transition = {
    duration: 0.28,
    ease: [0.16, 1, 0.3, 1],
};
const stepperTiming = {
    entranceDelay: 0.3,
    connectorDuration: 0.6,
    ringDuration: 0.55,
};

type DocumentUploadDialogProps = {
    archive: ArchivePlacementCabinet[];
    recentArchiveItemIds?: string[];
    mappingModels: string[];
    documentTypes: DocumentTypeOption[];
    fieldSections: DocumentFieldSection[];
    metadataFieldSections: DocumentFieldSection[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reviewDocument?: ArchivedDocument | null;
    finalFocus?: ComponentProps<typeof DialogContent>['finalFocus'];
};

export default function DocumentUploadDialog({
    archive,
    recentArchiveItemIds = [],
    mappingModels,
    documentTypes,
    fieldSections,
    metadataFieldSections,
    open,
    onOpenChange,
    reviewDocument,
    finalFocus,
}: DocumentUploadDialogProps) {
    const canUploadToReceiving =
        usePage().props.officePermissions?.canUploadToReceiving === true;
    const workflow = useDocumentUpload({
        open,
        onOpenChange,
        mappingModels,
        documentTypes,
        fieldSections,
        metadataFieldSections,
        reviewDocument,
    });
    const {
        step,
        uploadProgress,
        ocrComplete,
        finishOcrProgress,
        file,
        setFile,
        cabinetId,
        setCabinetId,
        drawerId,
        setDrawerId,
        itemId,
        setItemId,
        documentTypeId,
        filingPath,
        chooseDestination,
        activeFieldSections,
        documentId,
        busy,
        pending,
        uploading,
        pdfUrl,
        mimeType,
        canDismiss,
        canRetryOcr,
        retryOcrLabel,
        retryOcr,
        startNewUpload,
        error,
        confirmSave,
        setConfirmSave,
        close,
        upload,
        saveChecked,
        setStep,
    } = workflow;
    const cabinetsWithItems = useMemo(
        () =>
            archive.filter((cabinet) =>
                cabinet.drawers.some((drawer) => drawer.books.length > 0),
            ),
        [archive],
    );
    const selectedCabinet = cabinetsWithItems.find(
        (cabinet) => cabinet.id === cabinetId,
    );
    const drawersWithItems = selectedCabinet?.drawers.filter(
        (drawer) => drawer.books.length > 0,
    );
    const selectedDrawer = drawersWithItems?.find(
        (drawer) => drawer.id === drawerId,
    );
    const selectedItem = selectedDrawer?.books.find(
        (item) => item.id === itemId,
    );
    const reviewing = step === 'review';
    const archivePlacement = step === 'confirm' && filingPath === 'archive';
    const dialogSize = reviewing
        ? 'review'
        : archivePlacement
          ? 'archive'
          : 'compact';
    const reduceMotion = useReducedMotion();
    const layout =
        reduceMotion || dialogSize !== 'compact' ? false : 'position';
    const [tracedThroughStep, setTracedThroughStep] = useState(-1);
    const tracedReviewDocumentId = useRef(reviewDocument?.id);
    const [sessionRecentItemIds, setSessionRecentItemIds] = useState<string[]>(
        [],
    );
    const recentItemIds = [
        ...new Set([...sessionRecentItemIds, ...recentArchiveItemIds]),
    ];

    useEffect(() => {
        if (tracedReviewDocumentId.current !== reviewDocument?.id) {
            tracedReviewDocumentId.current = reviewDocument?.id;
            setTracedThroughStep(-1);
        }
    }, [reviewDocument?.id]);

    useEffect(() => {
        if (!open && documentId === null) setTracedThroughStep(-1);
    }, [open, documentId]);

    useEffect(() => {
        if (
            documentId !== null &&
            !reviewDocument &&
            filingPath === 'archive' &&
            itemId !== ''
        ) {
            setSessionRecentItemIds((current) =>
                [itemId, ...current.filter((id) => id !== itemId)].slice(0, 2),
            );
        }
    }, [documentId, reviewDocument, filingPath, itemId]);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const destinationLabel =
        filingPath === 'archive'
            ? 'Archive in this office'
            : 'Route through Receiving';

    useEffect(() => {
        if (open) headingRef.current?.focus({ preventScroll: true });
    }, [open, step]);

    return (
        <>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent
                    render={
                        <motion.div
                            key={dialogSize}
                            layout={layout !== false}
                            layoutScroll
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: open ? 1 : 0 }}
                            transition={{
                                layout: resizeTransition,
                                opacity: { duration: reduceMotion ? 0 : 0.14 },
                            }}
                            style={{ borderRadius: 12 }}
                        />
                    }
                    finalFocus={finalFocus}
                    initialFocus={headingRef}
                    showClose={canDismiss}
                    className={cn(
                        reviewing
                            ? 'flex h-[84dvh] max-h-[84dvh] w-[calc(100%-1rem)] max-w-7xl flex-col gap-3 overflow-hidden rounded-xl border-slate-200 p-4 shadow-xl sm:w-[88vw] sm:max-w-7xl sm:p-6 dark:border-neutral-800 dark:bg-black'
                            : archivePlacement
                              ? 'flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-4 overflow-hidden rounded-xl border-slate-200 p-4 shadow-xl sm:w-[92vw] sm:max-w-6xl sm:p-6 dark:border-neutral-800 dark:bg-black'
                              : 'flex max-h-[90dvh] w-[calc(100%-1rem)] flex-col gap-5 overflow-y-auto rounded-xl border-slate-200 p-4 shadow-xl sm:max-w-xl sm:p-6 dark:border-neutral-800 dark:bg-black',
                        'transition-opacity motion-reduce:transition-none',
                    )}
                >
                    <AnimatedDialogHeader
                        layout={layout}
                        transition={{ layout: resizeTransition }}
                        className="shrink-0"
                    >
                        <DialogTitle
                            ref={headingRef}
                            tabIndex={-1}
                            className="pr-6 text-left text-xl leading-7 font-semibold tracking-tight outline-none"
                        >
                            {step === 'destination' && 'Upload document'}
                            {step === 'file' && 'Choose a document'}
                            {step === 'confirm' &&
                                (filingPath === 'archive'
                                    ? 'Choose archive location'
                                    : 'Send to Receiving')}
                            {step === 'ocr' &&
                                (ocrComplete
                                    ? 'Document ready'
                                    : uploading
                                      ? 'Uploading document'
                                      : 'Processing document')}
                            {step === 'review' && 'Review mapped fields'}
                        </DialogTitle>
                        <DialogDescription className="max-w-3xl text-left text-sm leading-6">
                            {step === 'destination' &&
                                'Choose where this document should go before selecting a file.'}
                            {step === 'file' &&
                                (filingPath === 'archive'
                                    ? 'Select a scanned PDF or image to upload to your chosen archive location.'
                                    : 'Select a scanned PDF or image. The file is uploaded after you confirm the details.')}
                            {step === 'confirm' &&
                                (filingPath === 'archive'
                                    ? 'Choose its location in this office’s archive.'
                                    : 'This upload will start in Receiving; routing is assigned on release.')}
                            {step === 'ocr' &&
                                (ocrComplete
                                    ? 'The text has been extracted successfully.'
                                    : uploading
                                      ? 'Uploading your file. Document reading starts once it is saved.'
                                      : 'Preparing the text so you can review and map its fields.')}
                            {step === 'review' &&
                                'Map the OCR text. Check the correspondent and any other fields you want to keep, then save.'}
                        </DialogDescription>
                    </AnimatedDialogHeader>

                    <motion.ol
                        layout={layout}
                        transition={{ layout: resizeTransition }}
                        aria-label="Document upload progress"
                        className="flex shrink-0 border-b border-slate-200 pb-4 text-xs dark:border-neutral-800"
                    >
                        {uploadProgress.labels.map((label, index) => {
                            const completed =
                                index < uploadProgress.currentIndex;
                            const current =
                                index === uploadProgress.currentIndex;

                            return (
                                <li
                                    key={label}
                                    aria-current={current ? 'step' : undefined}
                                    className={cn(
                                        'relative flex min-w-0 flex-1 flex-col gap-2 transition-colors duration-200 last:flex-none motion-reduce:transition-none sm:flex-row sm:items-center',
                                        current || completed
                                            ? 'font-medium text-blue-900 dark:text-blue-200'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'relative flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums transition-colors duration-200 motion-reduce:transition-none',
                                            current
                                                ? 'border-blue-900 bg-blue-900 text-white dark:border-blue-700 dark:bg-blue-700'
                                                : completed
                                                  ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                                                  : 'border-slate-200 dark:border-neutral-800',
                                        )}
                                    >
                                        {current && (
                                            <svg
                                                viewBox="0 0 28 28"
                                                fill="none"
                                                className="pointer-events-none absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-blue-900 dark:text-blue-400"
                                            >
                                                <motion.circle
                                                    cx="14"
                                                    cy="14"
                                                    r="13"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                    transform="rotate(180 14 14)"
                                                    initial={
                                                        reduceMotion ||
                                                        index <=
                                                            tracedThroughStep
                                                            ? false
                                                            : { pathLength: 0 }
                                                    }
                                                    animate={{ pathLength: 1 }}
                                                    onAnimationStart={() => {
                                                        if (open) {
                                                            setTracedThroughStep(
                                                                (previous) =>
                                                                    Math.max(
                                                                        previous,
                                                                        index,
                                                                    ),
                                                            );
                                                        }
                                                    }}
                                                    transition={{
                                                        duration: reduceMotion
                                                            ? 0
                                                            : stepperTiming.ringDuration,
                                                        delay: reduceMotion
                                                            ? 0
                                                            : stepperTiming.entranceDelay +
                                                              (index > 0
                                                                  ? stepperTiming.connectorDuration
                                                                  : 0),
                                                        ease: 'linear',
                                                        repeat: 0,
                                                    }}
                                                />
                                            </svg>
                                        )}
                                        <span
                                            className={cn(
                                                'absolute inset-0 grid place-items-center transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:scale-100 motion-reduce:transition-none',
                                                completed
                                                    ? 'scale-90 opacity-0'
                                                    : 'scale-100 opacity-100',
                                            )}
                                        >
                                            {index + 1}
                                        </span>
                                        <Check
                                            className={cn(
                                                'size-3 transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:scale-100 motion-reduce:transition-none',
                                                completed
                                                    ? 'scale-100 opacity-100'
                                                    : 'scale-75 opacity-0',
                                            )}
                                        />
                                    </span>
                                    {completed && (
                                        <span className="sr-only">
                                            Completed:
                                        </span>
                                    )}
                                    {label}
                                    {index <
                                        uploadProgress.labels.length - 1 && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-1.5 right-2 left-7 block h-2 sm:relative sm:inset-auto sm:mx-2 sm:min-w-4 sm:flex-1"
                                        >
                                            <span className="absolute inset-x-0 top-1/2 border-t border-slate-200 dark:border-neutral-800" />
                                            <motion.span
                                                initial={
                                                    reduceMotion
                                                        ? false
                                                        : {
                                                              clipPath:
                                                                  getUploadConnectorStart(
                                                                      index,
                                                                      uploadProgress.currentIndex,
                                                                      tracedThroughStep,
                                                                  ) === 1
                                                                      ? 'inset(0 0 0 0)'
                                                                      : 'inset(0 100% 0 0)',
                                                          }
                                                }
                                                animate={{
                                                    clipPath: completed
                                                        ? 'inset(0 0 0 0)'
                                                        : 'inset(0 100% 0 0)',
                                                }}
                                                transition={{
                                                    duration: reduceMotion
                                                        ? 0
                                                        : stepperTiming.connectorDuration,
                                                    delay: reduceMotion
                                                        ? 0
                                                        : stepperTiming.entranceDelay,
                                                    ease: 'easeInOut',
                                                }}
                                                className="absolute inset-0"
                                            >
                                                <span className="absolute inset-x-0 top-1/2 border-t border-blue-900 dark:border-blue-700" />
                                            </motion.span>
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </motion.ol>

                    <motion.div
                        key={step}
                        layout={layout}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            layout: resizeTransition,
                            opacity: { duration: 0.14 },
                        }}
                        className={cn(
                            'flex min-h-0 flex-col overflow-hidden',
                            reviewing
                                ? 'flex-1 gap-3'
                                : archivePlacement
                                  ? 'flex-1 gap-4'
                                  : 'shrink-0 gap-5',
                        )}
                    >
                        {step === 'destination' && (
                            <div className="grid gap-3">
                                {[
                                    {
                                        value: 'archive',
                                        title: 'Archive',
                                        description:
                                            'Store the document in this office’s cabinet, drawer, and filing item.',
                                        Icon: Archive,
                                    },
                                    {
                                        value: 'route',
                                        title: 'Route',
                                        description:
                                            'Send the document to Receiving for tracking and routing between offices.',
                                        Icon: Send,
                                    },
                                ].map(({ value, title, description, Icon }) => (
                                    <div key={value}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                                value === 'route' &&
                                                !canUploadToReceiving
                                            }
                                            aria-describedby={
                                                value === 'route' &&
                                                !canUploadToReceiving
                                                    ? 'route-permission'
                                                    : undefined
                                            }
                                            onClick={() => {
                                                chooseDestination(
                                                    value as
                                                        | 'archive'
                                                        | 'route',
                                                );
                                            }}
                                            className="h-auto w-full justify-start gap-4 rounded-lg border-slate-300 px-4 py-4 text-left whitespace-normal shadow-none hover:border-blue-900 hover:bg-blue-50 focus-visible:border-blue-900 dark:border-neutral-700 dark:hover:border-blue-200 dark:hover:bg-neutral-900"
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                className="size-9 shrink-0 bg-blue-50 p-2 text-blue-900 dark:bg-neutral-900 dark:text-blue-200"
                                            />
                                            <span className="grid flex-1 gap-1">
                                                <span className="text-sm font-semibold">
                                                    {title}
                                                </span>
                                                <span className="text-sm leading-5 font-normal text-muted-foreground">
                                                    {description}
                                                </span>
                                            </span>
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </Button>
                                        {value === 'route' &&
                                            !canUploadToReceiving && (
                                                <p
                                                    id="route-permission"
                                                    className="mt-2 text-xs leading-5 text-muted-foreground"
                                                >
                                                    Your office does not have
                                                    permission to send uploads
                                                    to Receiving.
                                                </p>
                                            )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {step === 'file' && (
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2 dark:bg-neutral-950">
                                    <div className="flex min-w-0 items-start gap-2">
                                        {filingPath === 'archive' ? (
                                            <Archive
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0"
                                            />
                                        ) : (
                                            <Send
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {destinationLabel}
                                            </p>
                                            {filingPath === 'archive' && (
                                                <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
                                                    {[
                                                        selectedCabinet?.name,
                                                        selectedDrawer?.label,
                                                        selectedItem?.label,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' / ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 rounded-lg"
                                        onClick={() =>
                                            setStep(
                                                filingPath === 'archive'
                                                    ? 'confirm'
                                                    : 'destination',
                                            )
                                        }
                                    >
                                        Change
                                    </Button>
                                </div>
                                <div className="relative grid gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 transition-colors focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-900/20 hover:bg-blue-50/60 dark:border-neutral-700 dark:bg-neutral-950 dark:focus-within:border-blue-200 dark:hover:bg-neutral-900">
                                    <Upload
                                        aria-hidden="true"
                                        className="mx-auto size-6 text-blue-900 dark:text-blue-200"
                                    />
                                    <Label
                                        htmlFor="document-file"
                                        className="block cursor-pointer text-center text-sm font-medium after:absolute after:inset-0"
                                    >
                                        {file
                                            ? 'Choose a different file'
                                            : 'Choose a file'}
                                    </Label>
                                    <Input
                                        id="document-file"
                                        type="file"
                                        accept={DOCUMENT_FILE_ACCEPT}
                                        aria-describedby={
                                            error
                                                ? 'document-file-help upload-error'
                                                : 'document-file-help'
                                        }
                                        aria-invalid={Boolean(error)}
                                        onChange={(event) => {
                                            const selected =
                                                event.target.files?.[0];
                                            if (selected) setFile(selected);
                                            event.target.value = '';
                                        }}
                                        className="sr-only"
                                    />
                                    <p
                                        id="document-file-help"
                                        className="pointer-events-none text-center text-xs leading-5 text-muted-foreground"
                                    >
                                        PDF, JPEG, PNG, or TIFF · up to 50 MB
                                    </p>
                                </div>
                                {file && (
                                    <div className="flex min-w-0 items-start gap-3 border border-slate-200 px-3 py-3 dark:border-neutral-800">
                                        <FileText
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium break-words">
                                                {file.name}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 rounded-lg"
                                            onClick={() => setFile(null)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'confirm' && (
                            <div
                                className={cn(
                                    'grid min-h-0 flex-1 items-stretch gap-6 overflow-y-auto',
                                    filingPath === 'archive' &&
                                        'lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,26rem)]',
                                )}
                            >
                                {filingPath === 'archive' && (
                                    <div className="order-2 flex min-h-80 min-w-0 overflow-hidden lg:order-1">
                                        <ArchiveLocationPreview
                                            cabinet={selectedCabinet}
                                            drawerId={drawerId}
                                            bookId={itemId}
                                        />
                                    </div>
                                )}
                                <div className="order-1 grid min-w-0 content-start gap-5 lg:order-2 lg:overflow-y-auto lg:pr-1">
                                    {file && (
                                        <div className="flex min-w-0 items-start gap-3 border-b border-slate-200 pb-4 dark:border-neutral-800">
                                            <FileText
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium break-words">
                                                    {file.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}{' '}
                                                    · {destinationLabel}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {filingPath === 'archive' ? (
                                        <ArchivePlacementSelectors
                                            cabinets={cabinetsWithItems}
                                            recentItemIds={recentItemIds}
                                            cabinetId={cabinetId}
                                            drawerId={drawerId}
                                            itemId={itemId}
                                            drawers={drawersWithItems ?? []}
                                            items={selectedDrawer?.books ?? []}
                                            onCabinetChange={(value) => {
                                                setCabinetId(value);
                                                setDrawerId('');
                                                setItemId('');
                                            }}
                                            onDrawerChange={(value) => {
                                                setDrawerId(value);
                                                setItemId('');
                                            }}
                                            onItemChange={setItemId}
                                        />
                                    ) : (
                                        <p className="bg-slate-50 px-3 py-3 text-sm leading-6 text-muted-foreground dark:bg-neutral-950">
                                            Your active office switches to
                                            Receiving to complete OCR and
                                            mapping after upload.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 'ocr' && (
                            <div className="py-1">
                                {error ? (
                                    <InputError role="alert" message={error} />
                                ) : (
                                    <DocumentProcessingProgress
                                        uploading={uploading}
                                        complete={ocrComplete}
                                        onComplete={finishOcrProgress}
                                        filename={
                                            file?.name ??
                                            reviewDocument?.originalFilename ??
                                            'Document'
                                        }
                                        fileSize={
                                            file?.size ??
                                            reviewDocument?.fileSize
                                        }
                                    />
                                )}
                            </div>
                        )}

                        {reviewing && (
                            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
                                <DocumentUploadPreview
                                    pdfUrl={pdfUrl}
                                    file={file}
                                    mimeType={mimeType}
                                />
                                <DocumentFieldReview
                                    workflow={workflow}
                                    mappingModels={mappingModels}
                                    documentTypes={documentTypes}
                                    fieldSections={activeFieldSections}
                                />
                            </div>
                        )}
                        {error && step !== 'ocr' && (
                            <InputError
                                id="upload-error"
                                role="alert"
                                message={error}
                            />
                        )}
                    </motion.div>

                    <AnimatedDialogFooter
                        layout={layout}
                        transition={{ layout: resizeTransition }}
                        className="shrink-0 border-t border-slate-200 pt-4 dark:border-neutral-800"
                    >
                        {step === 'destination' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => close(false)}
                                className="rounded-lg"
                            >
                                Cancel
                            </Button>
                        )}
                        {step === 'file' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setStep(
                                            filingPath === 'archive'
                                                ? 'confirm'
                                                : 'destination',
                                        )
                                    }
                                    className="rounded-lg"
                                >
                                    <ArrowLeft aria-hidden="true" /> Back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        busy ||
                                        !file ||
                                        (filingPath === 'archive' &&
                                            itemId === '')
                                    }
                                    onClick={() => {
                                        if (filingPath === 'archive') {
                                            void upload();
                                        } else {
                                            setStep('confirm');
                                        }
                                    }}
                                    className="rounded-lg bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {filingPath === 'archive' ? (
                                        'Upload to archive'
                                    ) : (
                                        <>
                                            Continue{' '}
                                            <ArrowRight aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                        {step === 'confirm' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() =>
                                        setStep(
                                            filingPath === 'archive'
                                                ? 'destination'
                                                : 'file',
                                        )
                                    }
                                    className="rounded-lg"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        busy ||
                                        (filingPath === 'archive' &&
                                            itemId === '')
                                    }
                                    onClick={() => {
                                        if (filingPath === 'archive') {
                                            setStep('file');
                                        } else {
                                            void upload();
                                        }
                                    }}
                                    className="rounded-lg bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {filingPath === 'archive' ? (
                                        <>
                                            Continue{' '}
                                            <ArrowRight aria-hidden="true" />
                                        </>
                                    ) : (
                                        'Upload to Receiving'
                                    )}
                                </Button>
                            </>
                        )}
                        {step === 'ocr' && (
                            <>
                                {canRetryOcr && (
                                    <Button
                                        type="button"
                                        onClick={() => void retryOcr()}
                                        className="rounded-lg"
                                    >
                                        {retryOcrLabel}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!canDismiss}
                                    onClick={() => close(false)}
                                    className="rounded-lg"
                                >
                                    Close
                                </Button>
                            </>
                        )}
                        {reviewing && confirmSave && (
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <p className="text-sm text-slate-700 dark:text-neutral-300">
                                    Some sections are not checked. Would you
                                    like to continue saving?
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => setConfirmSave(false)}
                                    className="rounded-lg"
                                >
                                    Go back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || documentTypeId === ''}
                                    onClick={() => void saveChecked(true)}
                                    className="rounded-lg bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'save'
                                        ? 'Saving…'
                                        : 'Continue'}
                                </Button>
                            </div>
                        )}
                        {reviewing && !confirmSave && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => close(false)}
                                    className="rounded-lg"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || documentTypeId === ''}
                                    onClick={() => void saveChecked()}
                                    className="rounded-lg bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'save'
                                        ? 'Saving…'
                                        : 'Save document'}
                                </Button>
                            </>
                        )}
                        {(reviewing || canRetryOcr) && !busy && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setTracedThroughStep(-1);
                                    startNewUpload();
                                }}
                                className="rounded-lg"
                            >
                                New upload
                            </Button>
                        )}
                    </AnimatedDialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
