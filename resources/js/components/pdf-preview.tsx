import {
    ChevronLeft,
    ChevronRight,
    Maximize,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

type PdfPreviewProps = {
    url: string;
    title: string;
};

export default function PdfPreview({ url, title }: PdfPreviewProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [viewerWidth, setViewerWidth] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setViewerWidth(entry.contentRect.width);
            }
        });

        observer.observe(viewer);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setPageNumber(1);
        setPageCount(0);
        setZoom(1);
        setLoadError(null);
    }, [url]);

    const pageWidth = Math.max(240, Math.floor((viewerWidth - 40) * zoom));

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
                className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-950"
                aria-label="PDF viewer controls"
            >
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Previous page"
                        title="Previous page"
                        disabled={pageNumber <= 1 || pageCount === 0}
                        onClick={() =>
                            setPageNumber((current) => Math.max(1, current - 1))
                        }
                        className="size-8 rounded-none"
                    >
                        <ChevronLeft aria-hidden="true" />
                    </Button>
                    <span className="min-w-20 px-1 text-center text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {pageCount > 0
                            ? `${pageNumber} / ${pageCount}`
                            : '— / —'}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Next page"
                        title="Next page"
                        disabled={pageNumber >= pageCount || pageCount === 0}
                        onClick={() =>
                            setPageNumber((current) =>
                                Math.min(pageCount, current + 1),
                            )
                        }
                        className="size-8 rounded-none"
                    >
                        <ChevronRight aria-hidden="true" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Zoom out"
                        title="Zoom out"
                        disabled={zoom <= 0.5}
                        onClick={() =>
                            setZoom((current) =>
                                Math.max(
                                    0.5,
                                    Math.round((current - 0.25) * 100) / 100,
                                ),
                            )
                        }
                        className="size-8 rounded-none"
                    >
                        <ZoomOut aria-hidden="true" />
                    </Button>
                    <span
                        className="min-w-12 text-center text-xs text-slate-700 tabular-nums dark:text-slate-300"
                        aria-live="polite"
                    >
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Zoom in"
                        title="Zoom in"
                        disabled={zoom >= 2.5}
                        onClick={() =>
                            setZoom((current) =>
                                Math.min(
                                    2.5,
                                    Math.round((current + 0.25) * 100) / 100,
                                ),
                            )
                        }
                        className="size-8 rounded-none"
                    >
                        <ZoomIn aria-hidden="true" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(1)}
                        className="h-8 rounded-none px-2 text-xs"
                    >
                        <Maximize aria-hidden="true" />
                        Fit width
                    </Button>
                </div>
            </div>

            <div
                ref={viewerRef}
                className="min-h-0 flex-1 overflow-auto bg-slate-200 p-2 dark:bg-slate-900"
            >
                <Document
                    file={url}
                    onLoadSuccess={({ numPages }) => {
                        setPageCount(numPages);
                        setPageNumber(1);
                        setLoadError(null);
                    }}
                    onLoadError={(error) => setLoadError(error.message)}
                    loading={
                        <p className="p-6 text-center text-sm text-slate-600 dark:text-slate-300">
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
                    className="flex w-max min-w-full justify-center"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                            <p className="p-6 text-center text-sm text-slate-600 dark:text-slate-300">
                                Rendering page…
                            </p>
                        }
                        error={
                            <p
                                role="alert"
                                className="p-6 text-center text-sm text-red-800 dark:text-red-300"
                            >
                                Could not render this page.
                            </p>
                        }
                        className="shadow-lg"
                    />
                </Document>
            </div>
            <span className="sr-only">{title}</span>
        </div>
    );
}
