import { type ComponentProps, useMemo } from 'react';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { useDocumentUpload } from '@/pages/documents/hooks/use-document-upload';
import { formatFileSize } from '@/lib/document-formatters';
import type { ArchivedDocument } from '@/types/documents';
import type {
    ArchivePlacementCabinet,
    DocumentFieldSection,
} from '../../types';
import ArchiveLocationPreview from './archive-location-preview';
import ArchivePlacementSelectors from './archive-placement-selectors';
import DocumentFieldReview from './document-field-review';
import DocumentUploadPreview from './document-upload-preview';

type DocumentUploadDialogProps = {
    archive: ArchivePlacementCabinet[];
    mappingModels: string[];
    fieldSections: DocumentFieldSection[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reviewDocument?: ArchivedDocument | null;
    finalFocus?: ComponentProps<typeof DialogContent>['finalFocus'];
};

export default function DocumentUploadDialog({
    archive,
    mappingModels,
    fieldSections,
    open,
    onOpenChange,
    reviewDocument,
    finalFocus,
}: DocumentUploadDialogProps) {
    const workflow = useDocumentUpload({
        open,
        onOpenChange,
        mappingModels,
        fieldSections,
        reviewDocument,
    });
    const {
        step,
        file,
        setFile,
        cabinetId,
        setCabinetId,
        drawerId,
        setDrawerId,
        itemId,
        setItemId,
        busy,
        pending,
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
        hasCheckedField,
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
    const reviewing = step === 'review';

    return (
        <>
            <Dialog open={open} onOpenChange={close}>
                <DialogContent
                    finalFocus={finalFocus}
                    showClose={canDismiss}
                    className={
                        reviewing
                            ? 'flex h-[84dvh] max-h-[84dvh] w-[calc(100%-1rem)] max-w-7xl flex-col gap-3 overflow-hidden rounded-none p-4 sm:w-[88vw] sm:max-w-7xl sm:p-6 dark:border-neutral-800 dark:bg-black'
                            : step === 'confirm'
                              ? 'max-h-[90vh] overflow-y-auto rounded-none sm:max-w-3xl dark:border-neutral-800 dark:bg-black'
                              : 'max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl dark:border-neutral-800 dark:bg-black'
                    }
                >
                    <DialogHeader
                        className={reviewing ? 'shrink-0' : undefined}
                    >
                        <DialogTitle>
                            {step === 'file' && 'Add document to archive'}
                            {step === 'confirm' && 'Confirm upload'}
                            {step === 'ocr' && 'Reading the document'}
                            {step === 'review' && 'Review mapped fields'}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 'file' &&
                                'Choose a scanned PDF or image. Nothing is stored until you confirm the upload.'}
                            {step === 'confirm' &&
                                'Choose where to file this document, then confirm the upload.'}
                            {step === 'ocr' &&
                                'The file is in the archive. OCR runs before the fields can be mapped.'}
                            {step === 'review' &&
                                'Map the OCR text, check the fields you want to keep, then save.'}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'file' && (
                        <div className="grid gap-2">
                            <Label htmlFor="document-file">
                                Scanned document
                            </Label>
                            <Input
                                id="document-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                                className="h-auto rounded-none border-dashed p-3 file:mr-3 file:rounded-none file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-950 dark:file:bg-blue-950 dark:file:text-white"
                            />
                            <p className="text-xs text-slate-500 dark:text-neutral-400">
                                PDF, JPEG, PNG, or TIFF · maximum file size 50
                                MB
                            </p>
                        </div>
                    )}

                    {step === 'confirm' && file && (
                        <div className="grid gap-5 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:items-start">
                            <div className="grid min-w-0 gap-5">
                                <p className="text-sm break-words text-slate-700 dark:text-neutral-300">
                                    Upload{' '}
                                    <span className="font-medium">
                                        {file.name}
                                    </span>{' '}
                                    ({formatFileSize(file.size)})?
                                </p>
                                <ArchivePlacementSelectors
                                    cabinets={cabinetsWithItems}
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
                            </div>
                            <div className="sm:order-first">
                                <ArchiveLocationPreview
                                    cabinet={selectedCabinet}
                                    drawerId={drawerId}
                                    bookId={itemId}
                                />
                            </div>
                        </div>
                    )}

                    {step === 'ocr' && (
                        <div className="flex items-center gap-3 py-6 text-sm text-slate-700 dark:text-neutral-300">
                            {!error && <Spinner />}
                            <span>
                                {error
                                    ? error
                                    : 'Waiting for OCR to finish. This can take a few minutes.'}
                            </span>
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
                                fieldSections={fieldSections}
                            />
                        </div>
                    )}

                    {error && step !== 'ocr' && <InputError message={error} />}

                    <DialogFooter
                        className={reviewing ? 'shrink-0' : undefined}
                    >
                        {step === 'file' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => close(false)}
                                    className="rounded-none"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!file}
                                    onClick={() => setStep('confirm')}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    Continue
                                </Button>
                            </>
                        )}
                        {step === 'confirm' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => setStep('file')}
                                    className="rounded-none"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || itemId === ''}
                                    onClick={() => void upload()}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'upload'
                                        ? 'Uploading…'
                                        : 'Upload'}
                                </Button>
                            </>
                        )}
                        {step === 'ocr' && (
                            <>
                                {canRetryOcr && (
                                    <Button
                                        type="button"
                                        onClick={() => void retryOcr()}
                                        className="rounded-none"
                                    >
                                        {retryOcrLabel}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => close(false)}
                                    className="rounded-none"
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
                                    className="rounded-none"
                                >
                                    Go back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void saveChecked(true)}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
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
                                    className="rounded-none"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || !hasCheckedField}
                                    onClick={() => void saveChecked()}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'save'
                                        ? 'Saving…'
                                        : 'Save checked fields'}
                                </Button>
                            </>
                        )}
                        {(reviewing || canRetryOcr) && !busy && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={startNewUpload}
                                className="rounded-none"
                            >
                                New upload
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
