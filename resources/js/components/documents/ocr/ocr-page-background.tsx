import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export default function OcrPageBackground({
    pdfDocument,
    imageUrl,
    pageNumber,
    sourceWidth,
    viewerRef,
}: {
    pdfDocument?: PDFDocumentProxy | null;
    imageUrl?: string;
    pageNumber: number;
    sourceWidth: number;
    viewerRef: RefObject<HTMLDivElement | null>;
}) {
    const layerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nearby, setNearby] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;
        const observer = new IntersectionObserver(
            ([entry]) => setNearby(entry.isIntersecting),
            { root: viewerRef.current, rootMargin: '600px 0px' },
        );
        observer.observe(layer);
        return () => observer.disconnect();
    }, [viewerRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!nearby || !pdfDocument || !canvas) return;

        let disposed = false;
        let task: RenderTask | undefined;
        setFailed(false);

        async function render() {
            try {
                const page = await pdfDocument!.getPage(pageNumber);
                if (disposed) return;
                const original = page.getViewport({ scale: 1 });
                // Keep one sharp raster per visible page; CSS scales it with
                // the OCR overlay instead of rerendering the PDF at each zoom.
                const pixelRatio = Math.min(
                    Math.max(1, sourceWidth / original.width) *
                        Math.min(window.devicePixelRatio || 1, 2),
                    Math.sqrt(12_000_000 / (original.width * original.height)),
                );
                const viewport = page.getViewport({ scale: pixelRatio });
                canvas!.width = Math.max(1, Math.floor(viewport.width));
                canvas!.height = Math.max(1, Math.floor(viewport.height));
                task = page.render({
                    canvas: canvas!,
                    viewport,
                    background: '#ffffff',
                });
                await task.promise;
            } catch {
                if (!disposed) setFailed(true);
            }
        }

        void render();
        return () => {
            disposed = true;
            task?.cancel();
            canvas.width = 0;
            canvas.height = 0;
        };
    }, [nearby, pageNumber, pdfDocument, sourceWidth]);

    return (
        <div
            ref={layerRef}
            data-ocr-background
            className="pointer-events-none absolute inset-0 overflow-hidden bg-white"
        >
            {nearby && pdfDocument ? (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    className="block size-full opacity-35"
                />
            ) : nearby && imageUrl && pageNumber === 1 ? (
                <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    onError={() => setFailed(true)}
                    className="block size-full opacity-35"
                />
            ) : null}
            {failed && (
                <p
                    role="status"
                    className="absolute inset-x-0 bottom-0 bg-white/90 p-1 text-center text-xs text-slate-600"
                >
                    Original page background could not be rendered.
                </p>
            )}
        </div>
    );
}
