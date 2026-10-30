import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import PdfViewerControls from '@/components/pdf-viewer-controls';
import { useDragToPan } from '@/hooks/use-drag-to-pan';
import { usePdfPageScale } from '@/hooks/use-pdf-page-scale';
import type { PdfFitMode } from '@/hooks/use-pdf-page-scale';
import { cn } from '@/lib/utils';

export type PdfHighlight = {
    id: number;
    page: number;
    box: [number, number, number, number] | null;
    pageWidth: number | null;
    pageHeight: number | null;
};

export type PdfViewport = {
    fitWidth: number;
    fitHeight: number;
    pageWidth: number;
    zoom: number;
    pages: Record<number, { width: number; height: number }>;
};

type PdfPreviewProps = {
    url: string;
    title: string;
    highlights?: PdfHighlight[];
    selectedHighlightId?: number | null;
    onSelectHighlight?: (id: number) => void;
    focusPage?: number | null;
    onViewportChange?: (viewport: PdfViewport) => void;
    defaultFit?: PdfFitMode;
};

export default function PdfPreview({
    url,
    title,
    highlights = [],
    selectedHighlightId = null,
    onSelectHighlight,
    focusPage = null,
    onViewportChange,
    defaultFit = 'width',
}: PdfPreviewProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [viewerWidth, setViewerWidth] = useState(0);
    const [viewerHeight, setViewerHeight] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [pageSizes, setPageSizes] = useState<PdfViewport['pages']>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [workerReady, setWorkerReady] = useState(false);
    const [pageReady, setPageReady] = useState(false);

    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
        ).toString();
        setWorkerReady(true);
    }, []);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) {
            return;
        }

        let timer = 0;
        const publish = (width: number, height: number) => {
            const next = Math.floor(width);
            setViewerWidth((current) =>
                Math.abs(current - next) < 8 ? current : next,
            );
            setViewerHeight(Math.floor(height));
        };

        // Wait for the dialog to finish opening so the canvas is not
        // cleared and redrawn on every width change.
        const observer = new ResizeObserver(([entry]) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (entry) {
                    publish(entry.contentRect.width, entry.contentRect.height);
                }
            }, 200);
        });

        observer.observe(viewer);

        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        setPageNumber(1);
        setPageCount(0);
        setPageSizes({});
        setLoadError(null);
        setPageReady(false);
    }, [url]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || pageCount === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visiblePage = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (first, second) =>
                            second.intersectionRatio - first.intersectionRatio,
                    )[0]
                    ?.target.getAttribute('data-page-number');

                if (visiblePage) {
                    setPageNumber(Number(visiblePage));
                }
            },
            {
                root: viewer,
                threshold: [0, 0.25, 0.5, 0.75, 1],
            },
        );

        viewer
            .querySelectorAll('.react-pdf__Page[data-page-number]')
            .forEach((page) => observer.observe(page));

        return () => observer.disconnect();
    }, [pageCount]);

    useEffect(() => {
        if (!focusPage || pageCount === 0) {
            return;
        }

        goToPage(focusPage);
    }, [focusPage, pageCount]);

    function goToPage(nextPage: number) {
        const targetPage = Math.max(1, Math.min(pageCount, nextPage));
        const viewer = viewerRef.current;
        const page = viewer?.querySelector<HTMLElement>(
            `.react-pdf__Page[data-page-number="${targetPage}"]`,
        );

        setPageNumber(targetPage);

        if (viewer && page) {
            const viewerBounds = viewer.getBoundingClientRect();
            const pageBounds = page.getBoundingClientRect();

            viewer.scrollTop += pageBounds.top - viewerBounds.top - 8;
        }
    }

    const fitWidth = Math.max(
        0,
        viewerWidth - (defaultFit === 'page' ? 0 : 40),
    );
    const fitHeight = Math.max(0, viewerHeight);
    const { zoom, pageWidth, canPan, onZoomChange, onFitPage } =
        usePdfPageScale({
            fitWidth,
            fitHeight,
            pages: pageSizes,
            defaultFit,
            resetKey: url,
        });
    const { panning, panHandlers } = useDragToPan(canPan);

    useEffect(() => {
        onViewportChange?.({
            fitWidth,
            fitHeight,
            pageWidth,
            zoom,
            pages: pageSizes,
        });
    }, [onViewportChange, fitWidth, fitHeight, pageWidth, pageSizes, zoom]);

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 dark:border-neutral-800">
            <PdfViewerControls
                pageNumber={pageNumber}
                pageCount={pageCount}
                zoom={zoom}
                onPageChange={goToPage}
                onZoomChange={onZoomChange}
                onFitPage={onFitPage}
            />

            <div
                ref={viewerRef}
                {...panHandlers}
                className={cn(
                    'relative min-h-0 flex-1 overflow-auto bg-slate-200 p-2 dark:bg-neutral-900',
                    canPan &&
                        'cursor-grab touch-none select-none [&_button]:cursor-grab',
                    panning && 'cursor-grabbing [&_button]:cursor-grabbing',
                )}
            >
                {!pageReady && !loadError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200 dark:bg-neutral-900">
                        <p className="text-sm text-slate-600 dark:text-neutral-300">
                            Loading PDF…
                        </p>
                    </div>
                )}
                {workerReady && viewerWidth > 0 ? (
                    <Document
                        file={url}
                        suspense={false}
                        onLoadSuccess={({ numPages }) => {
                            setPageCount(numPages);
                            setPageNumber(1);
                            setLoadError(null);
                        }}
                        onLoadError={(error) => setLoadError(error.message)}
                        loading={
                            <p className="p-6 text-center text-sm text-slate-600 dark:text-neutral-300">
                                Loading PDF…
                            </p>
                        }
                        error={
                            <p
                                role="alert"
                                className="max-w-lg p-6 text-center text-sm text-red-800 dark:text-red-300"
                            >
                                {loadError
                                    ? `Could not load this PDF: ${loadError}`
                                    : 'Could not load this PDF.'}
                            </p>
                        }
                        className="flex w-max min-w-full flex-col items-center gap-4"
                    >
                        {Array.from(
                            { length: pageCount },
                            (_, index) => index + 1,
                        ).map((page) => (
                            <div key={page} className="relative w-fit">
                                <Page
                                    pageNumber={page}
                                    onLoadSuccess={(loadedPage) => {
                                        const { width, height } =
                                            loadedPage.getViewport({
                                                scale: 1,
                                            });
                                        setPageSizes((current) =>
                                            current[page]?.width === width &&
                                            current[page]?.height === height
                                                ? current
                                                : {
                                                      ...current,
                                                      [page]: { width, height },
                                                  },
                                        );
                                    }}
                                    width={pageWidth}
                                    suspense={false}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onLoadError={(error) =>
                                        setLoadError(error.message)
                                    }
                                    onRenderError={(error) =>
                                        setLoadError(error.message)
                                    }
                                    canvasBackground="#ffffff"
                                    onRenderSuccess={() => {
                                        if (page === 1) {
                                            setPageReady(true);
                                        }
                                    }}
                                    loading={
                                        <p className="p-6 text-center text-sm text-slate-600 dark:text-neutral-300">
                                            Rendering page {page}…
                                        </p>
                                    }
                                    error={
                                        <p
                                            role="alert"
                                            className="max-w-lg p-6 text-center text-sm text-red-800 dark:text-red-300"
                                        >
                                            {loadError
                                                ? `Could not render page ${page}: ${loadError}`
                                                : `Could not render page ${page}.`}
                                        </p>
                                    }
                                    className="scroll-m-2 shadow-lg [&_canvas]:block"
                                />
                                {highlights.map((highlight) => {
                                    if (
                                        highlight.page !== page ||
                                        !highlight.box ||
                                        !highlight.pageWidth ||
                                        !highlight.pageHeight
                                    ) {
                                        return null;
                                    }

                                    const [x1, y1, x2, y2] = highlight.box;
                                    const selected =
                                        selectedHighlightId === highlight.id;

                                    return (
                                        <button
                                            key={highlight.id}
                                            data-pan-region
                                            type="button"
                                            aria-label={`OCR region on page ${page}`}
                                            aria-pressed={selected}
                                            onClick={() =>
                                                onSelectHighlight?.(
                                                    highlight.id,
                                                )
                                            }
                                            className={cn(
                                                'absolute border',
                                                selected
                                                    ? 'z-10 border-blue-900 bg-blue-900/20'
                                                    : 'z-0 border-blue-900/40 bg-blue-900/5',
                                            )}
                                            style={{
                                                left: `${(x1 / highlight.pageWidth) * 100}%`,
                                                top: `${(y1 / highlight.pageHeight) * 100}%`,
                                                width: `${((x2 - x1) / highlight.pageWidth) * 100}%`,
                                                height: `${((y2 - y1) / highlight.pageHeight) * 100}%`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </Document>
                ) : null}
            </div>
            <span className="sr-only">{title}</span>
        </div>
    );
}
