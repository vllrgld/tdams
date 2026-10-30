import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PdfViewport } from '@/components/pdf-preview';
import PdfViewerControls from '@/components/pdf-viewer-controls';
import { useDragToPan } from '@/hooks/use-drag-to-pan';
import { usePdfPageScale } from '@/hooks/use-pdf-page-scale';
import { cn } from '@/lib/utils';
import type { OcrRegion } from './document-ocr-panel';

type Props = {
    documentId: number;
    pdfViewport?: PdfViewport | null;
    regions: OcrRegion[];
    pages: string[];
    selectedRegion: number | null;
    onSelectRegion?: (index: number) => void;
    loading?: boolean;
    status?: ReactNode;
};

function hasPosition(region: OcrRegion): boolean {
    const { box, pageWidth, pageHeight } = region;
    return (
        !!box &&
        box.length === 4 &&
        box.every(Number.isFinite) &&
        Number.isFinite(pageWidth) &&
        Number.isFinite(pageHeight) &&
        (pageWidth ?? 0) > 0 &&
        (pageHeight ?? 0) > 0 &&
        box[0] >= 0 &&
        box[1] >= 0 &&
        box[2] > box[0] &&
        box[3] > box[1] &&
        box[2] <= pageWidth! &&
        box[3] <= pageHeight!
    );
}

function PositionedText({
    id,
    text,
    width,
    height,
    scale,
    singleLine,
    selected,
    onSelect,
}: {
    id: string;
    text: string;
    width: number;
    height: number;
    scale: number;
    singleLine: boolean;
    selected: boolean;
    onSelect: () => void;
}) {
    const textRef = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const element = textRef.current;
        if (!element) return;
        const fit = () => {
            if (element.getBoundingClientRect().width === 0) return;
            // scroll sizes round to whole pixels and omit glyphs outside the
            // line box. Measure actual text, in the SVG's scaled coordinates.
            const range = document.createRange();
            range.selectNodeContents(element);
            let low = 0.1;
            let high = height / 1.15;
            const fits = (size: number) => {
                element.style.fontSize = `${size}px`;
                element.style.paddingTop = '0px';
                const bounds = element.getBoundingClientRect();
                const textBounds = range.getBoundingClientRect();
                const scaleY = bounds.height / height;
                const top = Math.max(0, bounds.top - textBounds.top);
                element.style.paddingTop = `${scaleY > 0 ? top / scaleY + 0.05 : 0}px`;
                const adjusted = range.getBoundingClientRect();
                return (
                    adjusted.left >= bounds.left - 0.1 &&
                    adjusted.right <= bounds.right + 0.1 &&
                    adjusted.top >= bounds.top - 0.1 &&
                    adjusted.bottom <= bounds.bottom + 0.1
                );
            };
            for (let attempt = 0; attempt < 12; attempt++) {
                const size = (low + high) / 2;
                if (fits(size)) low = size;
                else high = size;
            }
            fits(low);
        };
        fit();
        // The app font can finish loading after the initial measurement.
        document.fonts.addEventListener('loadingdone', fit);
        return () => document.fonts.removeEventListener('loadingdone', fit);
    }, [height, scale, singleLine, text, width]);
    return (
        <button
            id={id}
            data-pan-region
            type="button"
            aria-label={text}
            aria-pressed={selected}
            onClick={onSelect}
            className={`relative block size-full cursor-pointer overflow-hidden border-0 p-0 text-left align-top text-slate-950 outline-1 -outline-offset-1 selection:bg-blue-200 focus-visible:outline-2 focus-visible:outline-blue-900 ${selected ? 'bg-blue-100 outline-blue-900' : 'bg-transparent outline-blue-900/25 hover:bg-blue-50 hover:outline-blue-900'}`}
        >
            <span
                ref={textRef}
                className={cn(
                    'absolute inset-0 block size-full font-sans leading-[1.15]',
                    singleLine
                        ? 'whitespace-pre'
                        : 'wrap-anywhere whitespace-pre-wrap',
                )}
                style={{ fontSize: Math.max(0.1, height / 1.15) }}
            >
                {singleLine ? text.replace(/\r?\n/g, ' ') : text}
            </span>
        </button>
    );
}

export default function OcrPageLayout({
    documentId,
    pdfViewport,
    regions,
    pages,
    selectedRegion,
    onSelectRegion,
    loading = false,
    status,
}: Props) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const { panning, panHandlers } = useDragToPan();
    const [pageNumber, setPageNumber] = useState(1);
    const goToPage = (page: number) => {
        setPageNumber(page);
        viewerRef.current
            ?.querySelector('[data-ocr-page="' + page + '"]')
            ?.scrollIntoView({ block: 'start', inline: 'nearest' });
    };
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setWidth(entry.contentRect.width);
                setHeight(entry.contentRect.height);
            }
        });
        observer.observe(viewer);
        return () => observer.disconnect();
    }, []);
    const pageNumbers = Array.from(
        new Set([
            ...pages.map((_, index) => index + 1),
            ...regions.map((region) => region.page),
            ...Object.keys(pdfViewport?.pages ?? {}).map(Number),
            ...(status ? [1] : []),
        ]),
    )
        .filter((page) => Number.isInteger(page) && page > 0)
        .sort((a, b) => a - b);
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const current = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) => b.intersectionRatio - a.intersectionRatio,
                    )[0];
                if (current)
                    setPageNumber(
                        Number(current.target.getAttribute('data-ocr-page')),
                    );
            },
            { root: viewer, threshold: [0, 0.25, 0.5, 0.75, 1] },
        );
        viewer
            .querySelectorAll('[data-ocr-page]')
            .forEach((page) => observer.observe(page));
        return () => observer.disconnect();
    }, [pageNumbers.length]);

    useEffect(() => {
        if (selectedRegion !== null && regions[selectedRegion]) {
            setPageNumber(regions[selectedRegion].page);
        }
    }, [regions, selectedRegion]);

    // Use the PDF's fit-width baseline, with independent zoom for this pane.
    const fitWidth =
        pdfViewport?.fitWidth ?? Math.max(0, Math.floor(width) - 40);
    const pageSizes = Object.fromEntries(
        regions
            .filter(hasPosition)
            .map((region) => [
                region.page,
                { width: region.pageWidth!, height: region.pageHeight! },
            ]),
    );
    const viewportPages: Record<number, { width: number; height: number }> = {
        ...pageSizes,
        ...pdfViewport?.pages,
    };
    if (status && Object.keys(viewportPages).length === 0) {
        viewportPages[1] = { width: 612, height: 792 };
    }
    const { zoom, pageWidth, onZoomChange, onFitPage } = usePdfPageScale({
        fitWidth,
        fitHeight: pdfViewport?.fitHeight ?? Math.floor(height),
        pages: viewportPages,
        defaultFit: 'page',
        resetKey: documentId,
    });
    return (
        <div
            aria-busy={loading}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 dark:border-neutral-800"
        >
            <PdfViewerControls
                label="OCR layout"
                pageNumber={pageNumber}
                pageCount={pageNumbers.length}
                zoom={zoom}
                onPageChange={goToPage}
                onZoomChange={onZoomChange}
                onFitPage={onFitPage}
            />
            <div className="relative flex min-h-0 flex-1 flex-col">
                <div
                    ref={viewerRef}
                    {...panHandlers}
                    className={cn(
                        'relative min-h-0 flex-1 touch-none overflow-auto bg-slate-200 p-2 select-none dark:bg-neutral-900',
                        panning
                            ? 'cursor-grabbing [&_button]:cursor-grabbing'
                            : 'cursor-grab [&_button]:cursor-grab',
                    )}
                >
                    <div className="flex w-max min-w-full flex-col items-center gap-4">
                        {pageNumbers.map((page) => {
                            const entries = regions
                                .map((region, index) => ({ region, index }))
                                .filter(({ region }) => region.page === page);
                            const positioned = entries.filter(({ region }) =>
                                hasPosition(region),
                            );
                            const unpositioned = entries.filter(
                                ({ region }) => !hasPosition(region),
                            );
                            const size = positioned[0]?.region;
                            const pageText =
                                pages[page - 1]?.trim() ||
                                entries
                                    .map(({ region }) => region.text)
                                    .join('\n');
                            const pdfSize = pdfViewport?.pages[page];
                            const aspectRatio = pdfSize
                                ? pdfSize.height / pdfSize.width
                                : size
                                  ? size.pageHeight! / size.pageWidth!
                                  : status
                                    ? 792 / 612
                                    : null;
                            // react-pdf floors the canvas CSS height to whole pixels.
                            const pageHeight =
                                aspectRatio === null
                                    ? undefined
                                    : Math.floor(pageWidth * aspectRatio);
                            return (
                                <section
                                    key={page}
                                    aria-label={`OCR layout page ${page}`}
                                    data-ocr-page={page}
                                    style={{ width: pageWidth }}
                                >
                                    {status ? (
                                        <div
                                            aria-hidden="true"
                                            className="bg-white"
                                            style={{ height: pageHeight }}
                                        />
                                    ) : size ? (
                                        <svg
                                            viewBox={`0 0 ${size.pageWidth} ${size.pageHeight}`}
                                            width={pageWidth}
                                            height={pageHeight}
                                            preserveAspectRatio="none"
                                            role="group"
                                            aria-label={`Positioned OCR text on page ${page}`}
                                            className="block bg-white"
                                        >
                                            {positioned.map(
                                                ({ region, index }) => {
                                                    const [x1, y1, x2, y2] =
                                                        region.box!;
                                                    // Normalize to page coordinates before SVG scales both text and boxes.
                                                    const x =
                                                        (x1 /
                                                            region.pageWidth!) *
                                                        size.pageWidth!;
                                                    const y =
                                                        (y1 /
                                                            region.pageHeight!) *
                                                        size.pageHeight!;
                                                    const boxWidth =
                                                        ((x2 - x1) /
                                                            region.pageWidth!) *
                                                        size.pageWidth!;
                                                    const boxHeight =
                                                        ((y2 - y1) /
                                                            region.pageHeight!) *
                                                        size.pageHeight!;
                                                    return (
                                                        <foreignObject
                                                            key={index}
                                                            x={x}
                                                            y={y}
                                                            width={boxWidth}
                                                            height={boxHeight}
                                                        >
                                                            <PositionedText
                                                                id={`ocr-region-${documentId}-${index}`}
                                                                text={
                                                                    region.text
                                                                }
                                                                width={boxWidth}
                                                                height={
                                                                    boxHeight
                                                                }
                                                                scale={
                                                                    pageWidth /
                                                                    size.pageWidth!
                                                                }
                                                                singleLine={
                                                                    region.kind ===
                                                                    'line'
                                                                }
                                                                selected={
                                                                    selectedRegion ===
                                                                    index
                                                                }
                                                                onSelect={() =>
                                                                    onSelectRegion?.(
                                                                        index,
                                                                    )
                                                                }
                                                            />
                                                        </foreignObject>
                                                    );
                                                },
                                            )}
                                        </svg>
                                    ) : (
                                        <div
                                            className="overflow-auto bg-white p-4 text-sm text-slate-950"
                                            style={{ height: pageHeight }}
                                        >
                                            <p className="mb-3 text-xs text-slate-600">
                                                Page positions are unavailable
                                                for this OCR result.
                                            </p>
                                            <p
                                                className="whitespace-pre-wrap select-text"
                                                onPointerDown={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                {pageText ||
                                                    'No recognized text on this page.'}
                                            </p>
                                        </div>
                                    )}
                                    {!status &&
                                        size &&
                                        unpositioned.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-xs text-slate-600 dark:text-neutral-300">
                                                    Text without saved positions
                                                </p>
                                                {unpositioned.map(
                                                    ({ region, index }) => (
                                                        <button
                                                            key={index}
                                                            data-pan-region
                                                            id={`ocr-region-${documentId}-${index}`}
                                                            type="button"
                                                            aria-pressed={
                                                                selectedRegion ===
                                                                index
                                                            }
                                                            onClick={() =>
                                                                onSelectRegion?.(
                                                                    index,
                                                                )
                                                            }
                                                            className={`block w-full border p-3 text-left text-sm whitespace-pre-wrap text-foreground focus-visible:outline-2 focus-visible:outline-blue-700 ${selectedRegion === index ? 'border-blue-900 bg-blue-100 dark:bg-blue-900 dark:text-white' : 'border-border bg-card'}`}
                                                        >
                                                            {region.text}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </section>
                            );
                        })}
                    </div>
                </div>
                {status && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
