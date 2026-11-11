import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
    type SetStateAction,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import PdfViewerControls from '@/components/pdf/pdf-viewer-controls';
import PannableViewport from '@/components/pdf/pannable-viewport';
import { usePdfPageScale } from '@/components/pdf/use-pdf-page-scale';
import type { PdfFitMode } from '@/components/pdf/use-pdf-page-scale';
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
    pages: Record<number, { width: number; height: number }>;
};

type PdfPreviewProps = {
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
    defaultFit?: PdfFitMode;
    extraControls?: ReactNode;
};

export default function PdfPreview({
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
    const [renderedPages, setRenderedPages] = useState(() => new Set([1]));
    const [scrollAnchor, setScrollAnchor] = useState<{
        page: number;
        offset: number;
    } | null>(null);

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
        setRenderedPages(new Set([1]));
        setScrollAnchor(null);
        if (viewerRef.current) viewerRef.current.scrollTop = 0;
    }, [url]);

    useEffect(() => {
        return () => onDocumentLoad?.(null);
    }, [onDocumentLoad, url]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || pageCount === 0) {
            return;
        }

        const intersections = new Map<number, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const page = Number(
                        entry.target.getAttribute('data-pdf-page'),
                    );
                    if (entry.isIntersecting)
                        intersections.set(page, entry.intersectionRatio);
                    else intersections.delete(page);
                }
                const visiblePage = [...intersections].sort(
                    (a, b) => b[1] - a[1],
                )[0]?.[0];

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
            .querySelectorAll('[data-pdf-page]')
            .forEach((page) => observer.observe(page));

        return () => observer.disconnect();
    }, [pageCount, url]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || pageCount === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                setRenderedPages((current) => {
                    const next = new Set(current);
                    for (const entry of entries) {
                        const page = Number(
                            entry.target.getAttribute('data-pdf-page'),
                        );
                        if (entry.isIntersecting) next.add(page);
                        else next.delete(page);
                    }
                    return next;
                });
            },
            { root: viewer, rootMargin: '600px 0px' },
        );

        viewer
            .querySelectorAll('[data-pdf-page]')
            .forEach((page) => observer.observe(page));
        return () => observer.disconnect();
    }, [pageCount, url]);

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
            `[data-pdf-page="${targetPage}"]`,
        );

        setPageNumber(targetPage);
        setRenderedPages((current) => new Set([...current, targetPage]));

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

    function rememberScrollPosition() {
        const viewer = viewerRef.current;
        const page = viewer?.querySelector<HTMLElement>(
            `[data-pdf-page="${pageNumber}"]`,
        );
        if (!viewer || !page) return;
        const bounds = page.getBoundingClientRect();
        setScrollAnchor({
            page: pageNumber,
            offset:
                (viewer.getBoundingClientRect().top - bounds.top) /
                bounds.height,
        });
    }

    function changeZoom(next: SetStateAction<number>) {
        rememberScrollPosition();
        onZoomChange(next);
    }

    function fitPage() {
        rememberScrollPosition();
        onFitPage();
    }

    useLayoutEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !scrollAnchor) return;
        const page = viewer.querySelector<HTMLElement>(
            `[data-pdf-page="${scrollAnchor.page}"]`,
        );
        if (page) {
            const bounds = page.getBoundingClientRect();
            viewer.scrollTop +=
                bounds.top -
                viewer.getBoundingClientRect().top +
                scrollAnchor.offset * bounds.height;
        }
        setScrollAnchor(null);
    }, [pageWidth, scrollAnchor]);

    useEffect(() => {
        onViewportChange?.({
            fitWidth,
            fitHeight,
            pages: pageSizes,
        });
    }, [onViewportChange, fitWidth, fitHeight, pageSizes]);

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 dark:border-neutral-800">
            <PdfViewerControls
                pageNumber={pageNumber}
                pageCount={pageCount}
                zoom={zoom}
                onPageChange={goToPage}
                onZoomChange={changeZoom}
                onFitPage={fitPage}
                extraControls={extraControls}
            />

            <PannableViewport
                viewerRef={viewerRef}
                enabled={canPan}
                className="bg-slate-200 p-2 dark:bg-neutral-900"
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
                        onLoadSuccess={(document) => {
                            const { numPages } = document;
                            setPageCount(numPages);
                            setPageNumber(1);
                            setLoadError(null);
                            onDocumentLoad?.(document);
                        }}
                        onLoadError={(error) => {
                            setLoadError(error.message);
                            onDocumentLoad?.(null);
                        }}
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
                        ).map((page) => {
                            const size = pageSizes[page] ??
                                pageSizes[1] ?? { width: 612, height: 792 };
                            const height =
                                (pageWidth * size.height) / size.width;
                            const shouldRender = renderedPages.has(page);

                            return (
                                <div
                                    key={page}
                                    data-pdf-page={page}
                                    className="relative shrink-0"
                                    style={{ width: pageWidth, height }}
                                >
                                    {shouldRender && (
                                        <>
                                            <Page
                                                pageNumber={page}
                                                onLoadSuccess={(loadedPage) => {
                                                    const { width, height } =
                                                        loadedPage.getViewport({
                                                            scale: 1,
                                                        });
                                                    setPageSizes((current) =>
                                                        current[page]?.width ===
                                                            width &&
                                                        current[page]
                                                            ?.height === height
                                                            ? current
                                                            : {
                                                                  ...current,
                                                                  [page]: {
                                                                      width,
                                                                      height,
                                                                  },
                                                              },
                                                    );
                                                }}
                                                width={pageWidth}
                                                devicePixelRatio={Math.min(
                                                    window.devicePixelRatio ||
                                                        1,
                                                    2,
                                                    Math.sqrt(
                                                        12_000_000 /
                                                            (pageWidth *
                                                                height),
                                                    ),
                                                )}
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
                                                    setPageReady(true);
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

                                                const [x1, y1, x2, y2] =
                                                    highlight.box;
                                                const selected =
                                                    selectedHighlightId ===
                                                    highlight.id;
                                                const highlighted =
                                                    (hoveredHighlightId ??
                                                        selectedHighlightId) ===
                                                    highlight.id;

                                                return (
                                                    <button
                                                        key={highlight.id}
                                                        data-pan-region
                                                        type="button"
                                                        aria-label={`OCR region on page ${page}`}
                                                        aria-pressed={selected}
                                                        onPointerEnter={() =>
                                                            onHoverHighlight?.(
                                                                highlight.id,
                                                            )
                                                        }
                                                        onPointerLeave={() =>
                                                            onHoverHighlight?.(
                                                                null,
                                                            )
                                                        }
                                                        onFocus={() =>
                                                            onHoverHighlight?.(
                                                                highlight.id,
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            onHoverHighlight?.(
                                                                null,
                                                            )
                                                        }
                                                        onClick={() =>
                                                            onSelectHighlight?.(
                                                                highlight.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            'absolute border',
                                                            highlighted
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
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </Document>
                ) : null}
            </PannableViewport>
            <span className="sr-only">{title}</span>
        </div>
    );
}
