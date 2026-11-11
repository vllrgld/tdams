import { ocr as documentOcr } from '@/routes/documents';
import { review as reviewOcr } from '@/routes/documents/ocr';
import { FileCheck2, FileX2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { update as correctOcrRegion } from '@/routes/documents/ocr/regions';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { PdfViewport } from '@/components/pdf/pdf-preview';
import type { ArchivedDocument } from '@/types/documents';
import OcrPageLayout from './ocr-page-layout';
import OcrContent from './ocr-content';
import OcrCorrectionDialog from './ocr-correction-dialog';
import OcrIcon from './ocr-icon';
import type { OcrContentBlock, OcrRegion } from './ocr-content-data';
import ViewerActions from '../viewer/viewer-actions';

export type { OcrRegion } from './ocr-content-data';

type OcrPayload = {
    revision: string;
    reviewedAt: string | null;
    status: string;
    text: string | null;
    error: string | null;
    regions?: OcrRegion[];
    pageContents?: OcrContentBlock[][];
};

function statusMessage(payload: OcrPayload): string | null {
    if (payload.status === 'pending' || payload.status === 'processing') {
        return 'OCR is still running for this document.';
    }

    if (payload.status === 'failed') {
        return payload.error || 'OCR failed for this document.';
    }

    if (!payload.text?.trim()) {
        return 'This document has no OCR text.';
    }

    return null;
}

export default function DocumentOcrPanel({
    document,
    comparing = false,
    pdfViewport,
    pdfDocument,
    onRegionsChange,
    selectedRegion = null,
    hoveredRegion = null,
    onSelectRegion,
    onHoverRegion,
    onReviewChange,
}: {
    document: ArchivedDocument;
    comparing?: boolean;
    pdfViewport?: PdfViewport | null;
    pdfDocument?: PDFDocumentProxy | null;
    onRegionsChange?: (regions: OcrRegion[]) => void;
    selectedRegion?: number | null;
    hoveredRegion?: number | null;
    onSelectRegion?: (index: number) => void;
    onHoverRegion?: (index: number | null) => void;
    onReviewChange?: (reviewedAt: string | null) => void;
}) {
    const [payload, setPayload] = useState<OcrPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [reviewError, setReviewError] = useState<string>();
    const [reviewConfirmation, setReviewConfirmation] = useState<{
        reviewed: boolean;
        revision: string;
    } | null>(null);
    const actionTrigger = useRef<HTMLButtonElement | null>(null);
    const cancelReviewButton = useRef<HTMLButtonElement | null>(null);
    const reviewRequest = useRef<AbortController | null>(null);
    useEffect(() => () => reviewRequest.current?.abort(), []);
    const [editing, setEditing] = useState<{
        index: number;
        text: string;
        revision: string;
        anchor: HTMLElement;
    } | null>(null);
    const correctionRequest = useRef<AbortController | null>(null);
    useEffect(() => () => correctionRequest.current?.abort(), []);
    const openCorrection = useCallback(
        (index: number) => {
            const region = payload?.regions?.[index];
            const anchor = globalThis.document.getElementById(
                `ocr-region-${document.id}-${index}`,
            );
            if (region && payload?.revision && anchor) {
                setEditing({
                    index,
                    text: region.text,
                    revision: payload.revision,
                    anchor,
                });
            }
        },
        [document.id, payload],
    );

    const saveCorrection = async (text: string) => {
        if (!editing) return;
        const controller = new AbortController();
        correctionRequest.current?.abort();
        correctionRequest.current = controller;
        const cookie = globalThis.document.cookie
            .split('; ')
            .find((value) => value.startsWith('XSRF-TOKEN='));
        const response = await fetch(
            correctOcrRegion.url({
                document: document.id,
                region: editing.index,
            }),
            {
                method: 'PATCH',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': cookie
                        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
                        : '',
                },
                body: JSON.stringify({ text, revision: editing.revision }),
            },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(
                result?.errors?.text?.[0] ??
                    result?.message ??
                    'Could not save the correction. Please try again.',
            );
        }
        if (!controller.signal.aborted) {
            setPayload(result as OcrPayload);
            setEditing(null);
            onReviewChange?.(result.reviewedAt ?? null);
        }
        correctionRequest.current = null;
    };

    const toggleReview = async () => {
        if (
            !payload ||
            !reviewConfirmation ||
            loading ||
            failed ||
            statusMessage(payload) ||
            reviewing ||
            editing ||
            reviewRequest.current
        )
            return;
        const controller = new AbortController();
        reviewRequest.current = controller;
        setReviewing(true);
        setReviewError(undefined);
        const cookie = globalThis.document.cookie
            .split('; ')
            .find((value) => value.startsWith('XSRF-TOKEN='));
        try {
            const response = await fetch(reviewOcr.url(document.id), {
                method: 'PATCH',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': cookie
                        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
                        : '',
                },
                body: JSON.stringify({
                    reviewed: reviewConfirmation.reviewed,
                    revision: reviewConfirmation.revision,
                }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(
                    result?.errors?.revision?.[0] ??
                        result?.errors?.reviewed?.[0] ??
                        result?.message ??
                        'Could not save the OCR review. Please try again.',
                );
            }
            if (!controller.signal.aborted) {
                setPayload(result as OcrPayload);
                setReviewConfirmation(null);
                onReviewChange?.(result.reviewedAt ?? null);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                setReviewError(
                    error instanceof Error
                        ? error.message
                        : 'Could not save the OCR review. Please try again.',
                );
            }
        } finally {
            if (!controller.signal.aborted) {
                setReviewing(false);
                reviewRequest.current = null;
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setFailed(false);
        setPayload(null);
        setEditing(null);
        setReviewing(false);
        setReviewError(undefined);
        setReviewConfirmation(null);
        reviewRequest.current?.abort();
        reviewRequest.current = null;
        correctionRequest.current?.abort();
        correctionRequest.current = null;

        fetch(documentOcr.url(document.id), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load OCR text.');
                }

                return (await response.json()) as OcrPayload;
            })
            .then((result) => {
                setPayload(result);
                setLoading(false);
            })
            .catch((error: Error) => {
                if (error.name !== 'AbortError') {
                    setFailed(true);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [document.id]);

    useEffect(() => {
        onRegionsChange?.(payload?.regions ?? []);
    }, [onRegionsChange, payload]);

    useEffect(() => {
        if (selectedRegion === null) {
            return;
        }

        globalThis.document
            .getElementById(`ocr-region-${document.id}-${selectedRegion}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [document.id, selectedRegion]);

    const pages = payload?.text?.split('\f') ?? [];
    const regions = payload?.regions ?? [];
    const message = payload ? statusMessage(payload) : null;
    const status = loading ? (
        <div
            role="status"
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300"
        >
            <Spinner />
            Loading OCR text…
        </div>
    ) : failed ? (
        <p role="alert" className="text-sm text-red-800 dark:text-red-300">
            Could not load OCR text.
        </p>
    ) : message ? (
        <p className="text-sm text-slate-600 dark:text-neutral-300">
            {message}
        </p>
    ) : null;

    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {!comparing && (
                <div className="shrink-0 border-b border-slate-200 p-4 pr-12 text-left dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                            <OcrIcon />
                        </span>
                        <div className="min-w-0">
                            <div className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                                OCR text
                            </div>
                            <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                                {document.originalFilename}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div
                className={
                    comparing
                        ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                        : 'min-h-0 flex-1 overflow-y-auto p-4 pb-20'
                }
            >
                {comparing ? (
                    <OcrPageLayout
                        documentId={document.id}
                        pdfViewport={pdfViewport}
                        pdfDocument={pdfDocument}
                        imageUrl={
                            !document.ocrPdfUrl &&
                            document.mimeType !== 'application/pdf'
                                ? document.viewUrl
                                : undefined
                        }
                        regions={regions}
                        pages={pages}
                        pageContents={payload?.pageContents}
                        selectedRegion={selectedRegion}
                        hoveredRegion={hoveredRegion}
                        onSelectRegion={onSelectRegion}
                        onHoverRegion={onHoverRegion}
                        onCorrectRegion={
                            payload?.status === 'completed' && payload.revision
                                ? openCorrection
                                : undefined
                        }
                        loading={loading}
                        status={status}
                    />
                ) : status ? (
                    status
                ) : (
                    <div className="grid gap-4">
                        {pages.map((page, index) => (
                            <section
                                key={`${document.id}-${index}`}
                                className="border border-slate-200 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                {pages.length > 1 && (
                                    <h3 className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                                        Page {index + 1}
                                    </h3>
                                )}
                                <div className="font-mono text-xs leading-5 wrap-break-word whitespace-pre-wrap text-slate-800 dark:text-neutral-200">
                                    <OcrContent
                                        content={payload?.pageContents?.[index]}
                                        text={page}
                                    />
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
            <ViewerActions label="OCR actions" triggerRef={actionTrigger}>
                <DropdownMenuItem
                    closeOnClick
                    disabled={
                        loading ||
                        failed ||
                        Boolean(message) ||
                        reviewing ||
                        Boolean(editing) ||
                        !payload?.revision
                    }
                    onClick={() => {
                        if (!payload?.revision) return;
                        setReviewError(undefined);
                        setReviewConfirmation({
                            reviewed: !payload.reviewedAt,
                            revision: payload.revision,
                        });
                    }}
                >
                    {payload?.reviewedAt ? (
                        <FileX2 aria-hidden="true" />
                    ) : (
                        <FileCheck2 aria-hidden="true" />
                    )}
                    {payload?.reviewedAt
                        ? 'Mark as not reviewed'
                        : 'Verify OCR'}
                </DropdownMenuItem>
            </ViewerActions>
            <Dialog
                open={reviewConfirmation !== null}
                disablePointerDismissal={reviewing}
                onOpenChange={(open) => {
                    if (!open && !reviewing) setReviewConfirmation(null);
                }}
            >
                <DialogContent
                    showClose={false}
                    overlayClassName="z-[80] bg-black/40"
                    className="z-[85] gap-5 sm:max-w-md"
                    finalFocus={actionTrigger}
                    initialFocus={cancelReviewButton}
                >
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-base leading-6">
                            {reviewConfirmation?.reviewed
                                ? 'Mark OCR as reviewed?'
                                : 'Mark OCR as not reviewed?'}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewConfirmation?.reviewed
                                ? 'Confirm that you’ve checked the OCR text against the original document and corrected any errors.'
                                : 'Mark this OCR text as needing review again.'}
                        </DialogDescription>
                    </DialogHeader>
                    {reviewError && (
                        <p role="alert" className="text-sm text-destructive">
                            {reviewError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            ref={cancelReviewButton}
                            type="button"
                            variant="outline"
                            disabled={reviewing}
                            onClick={() => setReviewConfirmation(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={reviewing}
                            onClick={() => void toggleReview()}
                            className="bg-foreground text-background hover:bg-foreground/90"
                        >
                            {reviewing && <Spinner />}
                            {reviewing
                                ? 'Saving…'
                                : reviewConfirmation?.reviewed
                                  ? 'Verify OCR'
                                  : 'Mark as not reviewed'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {editing && (
                <OcrCorrectionDialog
                    key={`${document.id}-${editing.index}`}
                    text={editing.text}
                    anchor={editing.anchor}
                    onConfirm={saveCorrection}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
