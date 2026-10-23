import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText } from 'lucide-react';
import {
    acquireThumbnailSlot,
    cacheRenderedThumbnail,
    getCachedThumbnail,
    releaseThumbnailSlot,
    thumbnailCacheKey,
    type ThumbnailQuality,
} from './pdf-thumbnail-cache';

const A4_WIDTH_RATIO = 210 / 297;
const DEVICE_PIXEL_RATIO: Record<ThumbnailQuality, number> = {
    card: 1,
    book: 1.75,
};

function PlaceholderIcon() {
    return (
        <FileText
            aria-hidden="true"
            className="size-10 animate-pulse text-slate-400 motion-reduce:animate-none"
        />
    );
}

export default function PdfThumbnail({
    url,
    fit = 'contain',
    pageNumber = 1,
    fill = false,
    quality = 'card',
    eager = false,
}: {
    url: string;
    fit?: 'contain' | 'cover';
    pageNumber?: number;
    fill?: boolean;
    quality?: ThumbnailQuality;
    eager?: boolean;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const slotHeldRef = useRef(false);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [pageWidthRatio, setPageWidthRatio] = useState(A4_WIDTH_RATIO);
    const [error, setError] = useState(false);
    const [missingPage, setMissingPage] = useState(false);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(eager);
    const [canLoad, setCanLoad] = useState(false);
    const [cachedSrc, setCachedSrc] = useState<string | null>(null);
    const quiet = pageNumber > 1;
    const containImageClass = fill
        ? 'h-full w-full object-contain'
        : 'h-full w-full object-contain p-1.5';
    const containPageClass = fill
        ? 'max-h-full max-w-full [&_canvas]:max-h-full [&_canvas]:max-w-full [&_canvas]:object-contain'
        : 'max-w-full shadow-md [&_canvas]:h-auto [&_canvas]:max-w-full';
    const pageWidth =
        width > 0 && height > 0
            ? Math.floor(
                  fit === 'cover'
                      ? Math.max(width, height * pageWidthRatio)
                      : Math.min(width, height * pageWidthRatio),
              )
            : 0;

    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
        ).toString();
    }, []);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setWidth(Math.floor(entry.contentRect.width));
                setHeight(Math.floor(entry.contentRect.height));
            }
        });

        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (cachedSrc) {
            return;
        }

        const container = containerRef.current;

        if (!container) {
            return;
        }

        if (eager) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(container);

        return () => observer.disconnect();
    }, [cachedSrc, eager]);

    useEffect(() => {
        if (cachedSrc || !isVisible) {
            return;
        }

        let cancelled = false;

        void acquireThumbnailSlot().then(() => {
            if (cancelled) {
                releaseThumbnailSlot();
                return;
            }

            slotHeldRef.current = true;
            setCanLoad(true);
        });

        return () => {
            cancelled = true;

            if (slotHeldRef.current) {
                slotHeldRef.current = false;
                releaseThumbnailSlot();
            }
        };
    }, [cachedSrc, isVisible, url, pageNumber, quality]);

    useEffect(() => {
        setError(false);
        setMissingPage(false);
        setPageCount(null);
        setPageWidthRatio(A4_WIDTH_RATIO);
    }, [url, pageNumber, quality]);

    useEffect(() => {
        if (width <= 0) {
            return;
        }

        setCachedSrc(
            getCachedThumbnail(
                thumbnailCacheKey(url, pageNumber, quality, width),
            ),
        );
    }, [url, pageNumber, quality, width]);

    const releaseSlot = () => {
        if (!slotHeldRef.current) {
            return;
        }

        slotHeldRef.current = false;
        releaseThumbnailSlot();
    };

    return (
        <div
            ref={containerRef}
            aria-busy={!cachedSrc && !error && !canLoad}
            className={`h-full w-full overflow-hidden ${
                fit === 'cover'
                    ? 'relative'
                    : 'flex items-center justify-center'
            }`}
        >
            {cachedSrc ? (
                <img
                    src={cachedSrc}
                    alt=""
                    className={
                        fit === 'cover'
                            ? 'h-full w-full object-cover object-top'
                            : containImageClass
                    }
                />
            ) : !isVisible || !canLoad ? (
                quiet ? null : (
                    <div className="flex h-full w-full items-center justify-center">
                        <PlaceholderIcon />
                    </div>
                )
            ) : error ? (
                quiet ? null : (
                    <p
                        role="img"
                        aria-label="PDF preview unavailable"
                        className="pt-16 text-center text-xs text-slate-500 dark:text-neutral-400"
                    >
                        Preview unavailable
                    </p>
                )
            ) : missingPage ? null : (
                <Document
                    file={url}
                    onLoadSuccess={async (pdf) => {
                        releaseSlot();
                        setPageCount(pdf.numPages);

                        if (pageNumber > pdf.numPages) {
                            setMissingPage(true);
                            return;
                        }

                        const page = await pdf.getPage(pageNumber);
                        const viewport = page.getViewport({ scale: 1 });
                        setPageWidthRatio(viewport.width / viewport.height);
                    }}
                    onLoadError={() => {
                        releaseSlot();
                        setError(true);
                    }}
                    loading={
                        quiet ? null : (
                            <div className="flex h-full w-full items-center justify-center">
                                <PlaceholderIcon />
                            </div>
                        )
                    }
                    error={null}
                    className={
                        fit === 'cover'
                            ? 'absolute inset-0 overflow-hidden'
                            : 'flex h-full w-full items-center justify-center'
                    }
                >
                    {pageWidth > 0 &&
                        pageCount !== null &&
                        pageNumber <= pageCount &&
                        !missingPage && (
                            <div
                                className={
                                    fit === 'cover'
                                        ? 'absolute top-0 left-1/2 -translate-x-1/2'
                                        : undefined
                                }
                                style={
                                    fit === 'cover'
                                        ? { width: pageWidth }
                                        : undefined
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={pageWidth}
                                    devicePixelRatio={
                                        DEVICE_PIXEL_RATIO[quality]
                                    }
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    onRenderSuccess={() => {
                                        const canvas =
                                            containerRef.current?.querySelector(
                                                'canvas',
                                            );

                                        if (canvas) {
                                            cacheRenderedThumbnail(
                                                url,
                                                pageNumber,
                                                quality,
                                                width,
                                                canvas,
                                            );
                                        }
                                    }}
                                    className={
                                        fit === 'cover'
                                            ? '[&_canvas]:max-w-none'
                                            : containPageClass
                                    }
                                />
                            </div>
                        )}
                </Document>
            )}
        </div>
    );
}
