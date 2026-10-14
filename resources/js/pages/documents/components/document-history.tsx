import { lazy, Suspense, useEffect, useState } from 'react';
import {
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    FileText,
    History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ArchivedDocument } from '../types';

const PdfPreview = lazy(() => import('@/components/pdf-preview'));

const previousDocuments = [
    { number: 'TD-0002', year: '2022' },
    { number: 'TD-0001', year: '2018' },
    { number: 'TD-0000', year: '2014' },
];

type DocumentHistoryProps = {
    document: ArchivedDocument;
};

export default function DocumentHistory({ document }: DocumentHistoryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [document.id]);

    const currentDocument = previousDocuments[currentIndex];
    const currentNumber =
        currentIndex === 0 && document.previousTaxDeclarationNumber
            ? document.previousTaxDeclarationNumber
            : currentDocument.number;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 p-4 pr-12 text-left dark:border-slate-800">
                <span className="flex size-8 items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <History aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Document history
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {document.originalFilename}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-5 p-4">
                    <section>
                        <div className="mb-3 border-b border-slate-200 pb-2 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Previous documents
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Browse previous declarations
                            </p>
                        </div>
                        <div
                            aria-label="Document navigation"
                            className="mb-3 flex items-center justify-between border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
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
                                className="px-2 text-xs text-slate-700 tabular-nums dark:text-slate-300"
                            >
                                {currentIndex + 1} / {previousDocuments.length}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Next document"
                                title="Next document"
                                disabled={
                                    currentIndex ===
                                    previousDocuments.length - 1
                                }
                                onClick={() =>
                                    setCurrentIndex((index) =>
                                        Math.min(
                                            previousDocuments.length - 1,
                                            index + 1,
                                        ),
                                    )
                                }
                                className="size-8 rounded-none"
                            >
                                <ChevronRight aria-hidden="true" />
                            </Button>
                        </div>

                        <article className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                                        <FileText
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                            Previous declaration
                                        </p>
                                        <h4 className="mt-1 text-sm font-semibold break-words text-slate-900 dark:text-slate-100">
                                            Tax declaration {currentNumber}
                                        </h4>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled
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
                                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Declaration year
                                    </dt>
                                    <dd className="mt-1 text-slate-900 dark:text-slate-100">
                                        {currentDocument.year}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Current declaration
                                    </dt>
                                    <dd className="mt-1 break-words text-slate-900 dark:text-slate-100">
                                        {document.taxDeclarationNumber ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                                <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Document preview
                                </p>
                                {document.mimeType === 'application/pdf' ? (
                                    <div className="flex h-[54vh] min-h-72 flex-col">
                                        <Suspense
                                            fallback={
                                                <div className="flex h-full items-center justify-center gap-2 border border-slate-200 bg-slate-100 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                    <Spinner />
                                                    Loading PDF viewer…
                                                </div>
                                            }
                                        >
                                            <PdfPreview
                                                key={`${document.id}-${currentIndex}`}
                                                url={document.viewUrl}
                                                title={`Preview for ${currentNumber}`}
                                            />
                                        </Suspense>
                                    </div>
                                ) : (
                                    <p className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                        PDF preview is unavailable because the
                                        current document is not a PDF.
                                    </p>
                                )}
                            </div>
                        </article>
                    </section>
                </div>
            </div>
        </div>
    );
}
