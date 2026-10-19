import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export default function PdfThumbnail({
    url,
    fit = 'contain',
}: {
    url: string;
    fit?: 'contain' | 'cover';
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [pageWidthRatio, setPageWidthRatio] = useState<number | null>(null);
    const [error, setError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

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
    }, []);

    useEffect(() => {
        setError(false);
        setPageWidthRatio(null);
    }, [url]);

    return (
        <div
            ref={containerRef}
            className={`h-full w-full overflow-hidden ${
                fit === 'cover'
                    ? 'relative'
                    : 'flex items-center justify-center'
            }`}
        >
            {!isVisible ? (
                <FileText
                    aria-hidden="true"
                    className="size-10 text-slate-400"
                />
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
                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 1 });
                        setPageWidthRatio(viewport.width / viewport.height);
                    }}
                    onLoadError={() => setError(true)}
                    loading={
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Loading preview…
                        </span>
                    }
                    error={null}
                    className={
                        fit === 'cover'
                            ? 'absolute inset-0 h-full w-full'
                            : 'flex h-full w-full items-center justify-center'
                    }
                >
                    {width > 0 && height > 0 && pageWidthRatio !== null && (
                        <Page
                            pageNumber={1}
                            width={Math.floor(
                                fit === 'cover'
                                    ? Math.max(width, height * pageWidthRatio)
                                    : Math.min(width, height * pageWidthRatio),
                            )}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
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
