import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { PdfViewport } from '@/components/pdf-preview';
import type { ArchivedDocument } from '../types';
import OcrPageLayout from './ocr-page-layout';

type OcrPayload = {
    status: string;
    text: string | null;
    error: string | null;
    regions?: OcrRegion[];
};

export type OcrRegion = {
    kind?: 'line' | 'block';
    page: number;
    text: string;
    box: [number, number, number, number] | null;
    pageWidth: number | null;
    pageHeight: number | null;
};

export function OcrIcon() {
    return (
        <svg
            viewBox="0 0 32 16"
            className="size-auto h-4 w-8"
            aria-hidden="true"
        >
            <path
                d="M1 5.5V1.5H5M27 1.5h4v4M31 10.5v4h-4M5 14.5H1v-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <text
                x="16"
                y="11.5"
                textAnchor="middle"
                fill="currentColor"
                fontSize="8"
                fontWeight="700"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
                OCR
            </text>
        </svg>
    );
}

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
    onComparisonChange,
    onRegionsChange,
    selectedRegion = null,
    onSelectRegion,
}: {
    document: ArchivedDocument;
    comparing?: boolean;
    pdfViewport?: PdfViewport | null;
    onComparisonChange?: () => void;
    onRegionsChange?: (regions: OcrRegion[]) => void;
    selectedRegion?: number | null;
    onSelectRegion?: (index: number) => void;
}) {
    const [payload, setPayload] = useState<OcrPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setFailed(false);
        setPayload(null);

        fetch(`/documents/${document.id}/ocr`, {
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                    <Button
                        type="button"
                        variant={comparing ? 'secondary' : 'outline'}
                        aria-pressed={comparing}
                        onClick={onComparisonChange}
                        className="mt-3 h-auto w-full rounded-none px-3 py-2 text-left text-xs whitespace-normal"
                    >
                        Side by side comparison
                    </Button>
                </div>
            )}
            <div
                className={
                    comparing
                        ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                        : 'min-h-0 flex-1 overflow-y-auto p-4'
                }
            >
                {comparing ? (
                    <OcrPageLayout
                        documentId={document.id}
                        pdfViewport={pdfViewport}
                        regions={regions}
                        pages={pages}
                        selectedRegion={selectedRegion}
                        onSelectRegion={onSelectRegion}
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
                                <p className="font-mono text-xs leading-5 wrap-break-word whitespace-pre-wrap text-slate-800 dark:text-neutral-200">
                                    {page.trim()}
                                </p>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
