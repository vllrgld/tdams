import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText } from 'lucide-react';

const A4_WIDTH_RATIO = 210 / 297;
const MAX_CONCURRENT_THUMBNAILS = 3;
const thumbnailObjectUrls = new Map<string, string>();
let activeThumbnails = 0;
const thumbnailQueue: Array<() => void> = [];

function acquireThumbnailSlot(): Promise<void> {
    return new Promise((resolve) => {
        const start = () => {
            activeThumbnails += 1;
            resolve();
        };

        if (activeThumbnails < MAX_CONCURRENT_THUMBNAILS) {
            start();
            return;
        }

        thumbnailQueue.push(start);
    });
}

function releaseThumbnailSlot() {
    activeThumbnails = Math.max(0, activeThumbnails - 1);
    thumbnailQueue.shift()?.();
}

function cacheRenderedThumbnail(url: string, canvas: HTMLCanvasElement) {
    if (thumbnailObjectUrls.has(url)) {
        return;
    }

    canvas.toBlob(
        (blob) => {
            if (!blob || thumbnailObjectUrls.has(url)) {
                return;
            }

            thumbnailObjectUrls.set(url, URL.createObjectURL(blob));
        },
        'image/jpeg',
        0.72,
    );
}

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
}: {
    url: string;
    fit?: 'contain' | 'cover';
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const slotHeldRef = useRef(false);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [pageWidthRatio, setPageWidthRatio] = useState(A4_WIDTH_RATIO);
    const [error, setError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [canLoad, setCanLoad] = useState(false);
    const [cachedSrc] = useState(() => thumbnailObjectUrls.get(url) ?? null);

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
    }, [cachedSrc]);

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
    }, [cachedSrc, isVisible]);

    useEffect(() => {
        setError(false);
        setPageWidthRatio(A4_WIDTH_RATIO);
    }, [url]);

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
                            : 'h-full w-full object-contain p-1.5'
                    }
                />
            ) : !isVisible || !canLoad ? (
                <div className="flex h-full w-full items-center justify-center">
                    <PlaceholderIcon />
                </div>
            ) : error ? (
                <p
                    role="img"
                    aria-label="PDF preview unavailable"
                    className="pt-16 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                    Preview unavailable
                </p>
            ) : (
                <Document
                    file={url}
                    onLoadSuccess={async (pdf) => {
                        releaseSlot();

                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 1 });
                        setPageWidthRatio(viewport.width / viewport.height);
                    }}
                    onLoadError={() => {
                        releaseSlot();
                        setError(true);
                    }}
                    loading={
                        <div className="flex h-full w-full items-center justify-center">
                            <PlaceholderIcon />
                        </div>
                    }
                    error={null}
                    className={
                        fit === 'cover'
                            ? 'absolute inset-0 flex h-full w-full items-center justify-center'
                            : 'flex h-full w-full items-center justify-center'
                    }
                >
                    {width > 0 && height > 0 && (
                        <Page
                            pageNumber={1}
                            width={Math.floor(
                                fit === 'cover'
                                    ? Math.max(width, height * pageWidthRatio)
                                    : Math.min(width, height * pageWidthRatio),
                            )}
                            devicePixelRatio={1}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onRenderSuccess={() => {
                                const canvas =
                                    containerRef.current?.querySelector(
                                        'canvas',
                                    );

                                if (canvas) {
                                    cacheRenderedThumbnail(url, canvas);
                                }
                            }}
                            className={
                                fit === 'cover'
                                    ? '!absolute !inset-0 !h-full !w-full [&_canvas]:!h-full [&_canvas]:!w-full [&_canvas]:max-w-none [&_canvas]:object-cover [&_canvas]:object-top'
                                    : 'max-w-full shadow-md [&_canvas]:h-auto [&_canvas]:max-w-full'
                            }
                        />
                    )}
                </Document>
            )}
        </div>
    );
}
