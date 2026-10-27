import { useEffect, useState, type ReactNode } from 'react';
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    FileText,
    History,
} from 'lucide-react';
import ClientOnly from '@/components/client-only';
import { Button } from '@/components/ui/button';
import { useClientComponent } from '@/hooks/use-client-component';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '../lib/formatters';
import type { ArchivedDocument, PreviousDeclarationEntry } from '../types';

function loadPdfPreview() {
    return import('@/components/pdf-preview');
}

function pdfViewerFallback(): ReactNode {
    return (
        <div className="flex h-full items-center justify-center gap-2 border border-slate-200 bg-slate-100 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Spinner />
            Loading PDF viewer…
        </div>
    );
}

function ClientPdfPreview({ url, title }: { url: string; title: string }) {
    const PdfPreview = useClientComponent(loadPdfPreview);

    if (!PdfPreview) {
        return pdfViewerFallback();
    }

    return <PdfPreview url={url} title={title} />;
}

type DocumentHistoryProps = {
    document: ArchivedDocument;
    onDocumentChange: (document: ArchivedDocument) => void;
    onShowInfo: () => void;
};

export default function DocumentHistory({
    document,
    onDocumentChange,
    onShowInfo,
}: DocumentHistoryProps) {
    const [entries, setEntries] = useState<PreviousDeclarationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setCurrentIndex(0);
        setEntries([]);

        fetch(`/documents/${document.id}/history`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load document history.');
                }

                return (await response.json()) as PreviousDeclarationEntry[];
            })
            .then((history) => {
                setEntries(history);
                setLoading(false);
            })
            .catch((error: Error) => {
                if (error.name !== 'AbortError') {
                    setEntries([]);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [document.id]);

    const currentEntry = entries[currentIndex];
    const currentDocument = currentEntry?.document ?? null;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 p-4 pr-12 text-left dark:border-neutral-800">
                <span className="flex size-8 items-center justify-center bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                    <History aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                        Document history
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                        {document.originalFilename}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-5 p-4">
                    <section>
                        <div className="mb-3 border-b border-slate-200 pb-2 dark:border-neutral-800">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                Previous documents
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                                Browse previous declarations
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex min-h-48 items-center justify-center gap-2 border border-slate-200 bg-slate-50 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                                <Spinner />
                                Loading previous declarations…
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                                <p>
                                    No previous tax declaration number is linked
                                    to this record yet.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onShowInfo}
                                    className="mt-3 h-8 rounded-none text-xs"
                                >
                                    Add it in document information
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div
                                    aria-label="Document navigation"
                                    className="mb-3 flex items-center justify-between border border-slate-200 bg-card p-2 dark:border-neutral-800 dark:bg-black"
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Previous document"
                                        title="Previous document"
                                        disabled={currentIndex === 0}
                                        onClick={() =>
                                            setCurrentIndex((index) =>
                                                Math.max(0, index - 1),
                                            )
                                        }
                                        className="size-8 rounded-none"
                                    >
                                        <ChevronLeft aria-hidden="true" />
                                    </Button>
                                    <span
                                        aria-live="polite"
                                        className="px-2 text-xs text-slate-700 tabular-nums dark:text-neutral-300"
                                    >
                                        {currentIndex + 1} / {entries.length}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Next document"
                                        title="Next document"
                                        disabled={
                                            currentIndex === entries.length - 1
                                        }
                                        onClick={() =>
                                            setCurrentIndex((index) =>
                                                Math.min(
                                                    entries.length - 1,
                                                    index + 1,
                                                ),
                                            )
                                        }
                                        className="size-8 rounded-none"
                                    >
                                        <ChevronRight aria-hidden="true" />
                                    </Button>
                                </div>

                                {currentEntry && (
                                    <article className="overflow-hidden border border-slate-200 bg-card shadow-sm dark:border-neutral-800 dark:bg-black">
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                                                    <FileText
                                                        aria-hidden="true"
                                                        className="size-5"
                                                    />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                                                        Previous declaration
                                                    </p>
                                                    <h4 className="mt-1 text-sm font-semibold break-words text-slate-900 dark:text-neutral-100">
                                                        Tax declaration{' '}
                                                        {
                                                            currentEntry.taxDeclarationNumber
                                                        }
                                                    </h4>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!currentDocument}
                                                onClick={() => {
                                                    if (currentDocument) {
                                                        onDocumentChange(
                                                            currentDocument,
                                                        );
                                                    }
                                                }}
                                                className="h-8 shrink-0 rounded-none px-2 text-xs"
                                            >
                                                Open document
                                                <ArrowUpRight
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                            </Button>
                                        </div>
                                        <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    Date added
                                                </dt>
                                                <dd className="mt-1 text-slate-900 dark:text-neutral-100">
                                                    {currentDocument
                                                        ? formatDate(
                                                              currentDocument.createdAt,
                                                          )
                                                        : 'Not in archive yet'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    Current declaration
                                                </dt>
                                                <dd className="mt-1 break-words text-slate-900 dark:text-neutral-100">
                                                    {document.taxDeclarationNumber ??
                                                        '—'}
                                                </dd>
                                            </div>
                                        </dl>
                                        <div className="border-t border-slate-200 p-3 dark:border-neutral-800">
                                            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                Document preview
                                            </p>
                                            {currentDocument &&
                                            (currentDocument.ocrPdfUrl ||
                                                currentDocument.mimeType ===
                                                    'application/pdf') ? (
                                                <div className="flex h-[54vh] min-h-72 flex-col">
                                                    <ClientOnly
                                                        fallback={pdfViewerFallback()}
                                                    >
                                                        <ClientPdfPreview
                                                            key={`${currentDocument.id}-${currentDocument.ocrPdfUrl ?? 'original'}`}
                                                            url={
                                                                currentDocument.ocrPdfUrl ??
                                                                currentDocument.viewUrl
                                                            }
                                                            title={`Preview for ${currentEntry.taxDeclarationNumber}`}
                                                        />
                                                    </ClientOnly>
                                                </div>
                                            ) : currentDocument ? (
                                                <div className="flex min-h-48 items-center justify-center overflow-auto border border-slate-200 bg-slate-100 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                                                    <img
                                                        src={
                                                            currentDocument.viewUrl
                                                        }
                                                        alt={
                                                            currentDocument.originalFilename
                                                        }
                                                        className="max-h-72 max-w-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                                                    This previous declaration
                                                    number is not in the archive
                                                    yet.
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
