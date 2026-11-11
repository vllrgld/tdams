import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Image, ImageOff } from 'lucide-react';
import type { PdfViewport } from '@/components/pdf/pdf-preview';
import PdfViewerControls from '@/components/pdf/pdf-viewer-controls';
import PannableViewport from '@/components/pdf/pannable-viewport';
import { Button } from '@/components/ui/button';
import { usePdfPageScale } from '@/components/pdf/use-pdf-page-scale';
import { cn } from '@/lib/utils';
import OcrContent from './ocr-content';
import OcrPageBackground from './ocr-page-background';
import OcrRegionControl from './ocr-region-control';
import {
    contentText,
    displayOcrText,
    hasPosition,
    wordPositions,
} from './ocr-content-data';
import type { OcrContentBlock, OcrRegion } from './ocr-content-data';

type Props = {
    documentId: number;
    pdfViewport?: PdfViewport | null;
    pdfDocument?: PDFDocumentProxy | null;
    imageUrl?: string;
    regions: OcrRegion[];
    pages: string[];
    pageContents?: OcrContentBlock[][];
    selectedRegion: number | null;
    hoveredRegion?: number | null;
    onSelectRegion?: (index: number) => void;
    onHoverRegion?: (index: number | null) => void;
    onCorrectRegion?: (index: number) => void;
    loading?: boolean;
    status?: ReactNode;
};

function FittedContent({
    text,
    content,
    width,
    height,
    ready,
    singleLine,
}: {
    text: string;
    content?: OcrContentBlock[];
    width: number;
    height: number;
    ready: boolean;
    singleLine: boolean;
}) {
    const textRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = textRef.current;
        if (!element || !ready) return;
        const fit = () => {
            if (element.getBoundingClientRect().width === 0) return;
            // scroll sizes round to whole pixels and omit glyphs outside the
            // line box. Measure actual text, in the SVG's scaled coordinates.
            const range = document.createRange();
            range.selectNodeContents(element);
            const cellRange = document.createRange();
            const cells = Array.from(element.querySelectorAll('td, th'));
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
                const scaleX = bounds.width / width;
                const cellsFit = cells.every((cell) => {
                    const cellBounds = cell.getBoundingClientRect();
                    const style = getComputedStyle(cell);
                    cellRange.selectNodeContents(cell);
                    return Array.from(cellRange.getClientRects()).every(
                        (rect) =>
                            rect.left >=
                                cellBounds.left +
                                    parseFloat(style.paddingLeft) * scaleX -
                                    0.1 &&
                            rect.right <=
                                cellBounds.right -
                                    parseFloat(style.paddingRight) * scaleX +
                                    0.1 &&
                            rect.top >= cellBounds.top - 0.1 &&
                            rect.bottom <= cellBounds.bottom + 0.1,
                    );
                });
                return (
                    cellsFit &&
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
    }, [content, height, ready, singleLine, text, width]);
    return (
        <div
            ref={textRef}
            className={cn(
                'absolute inset-0 block size-full font-sans leading-[1.15]',
                singleLine
                    ? 'whitespace-pre'
                    : 'wrap-anywhere whitespace-pre-wrap',
            )}
            style={{ fontSize: Math.max(0.1, height / 1.15) }}
        >
            {content ? (
                <OcrContent content={content} fill />
            ) : singleLine ? (
                displayOcrText(text.replace(/\r?\n/g, ' '))
            ) : (
                displayOcrText(text)
            )}
        </div>
    );
}

const PositionedText = memo(function PositionedText({
    id,
    index,
    region,
    width,
    height,
    ready,
    selected,
    highlighted,
    overDocument,
    onSelect,
    onHover,
    onCorrect,
}: {
    id: string;
    index: number;
    region: OcrRegion;
    width: number;
    height: number;
    ready: boolean;
    selected: boolean;
    highlighted: boolean;
    overDocument: boolean;
    onSelect?: (index: number) => void;
    onHover?: (index: number | null) => void;
    onCorrect?: (index: number) => void;
}) {
    const words = wordPositions(region);
    return (
        <div
            data-pan-region
            className={cn(
                'relative block size-full overflow-hidden text-left outline-1 -outline-offset-1 selection:bg-blue-200 selection:text-slate-950',
                overDocument ? 'text-slate-950' : 'text-foreground',
                highlighted
                    ? overDocument
                        ? 'bg-blue-100/70 outline-blue-900'
                        : 'bg-blue-100 outline-blue-900 dark:bg-blue-900 dark:text-white'
                    : overDocument
                      ? 'bg-white/70 outline-blue-900/25 hover:bg-blue-50/80 hover:outline-blue-900'
                      : 'bg-transparent outline-blue-900/25 hover:bg-blue-50 hover:outline-blue-900 dark:hover:bg-blue-900 dark:hover:text-white',
            )}
        >
            {words.length > 0 ? (
                words.map((word, index) => (
                    <div
                        key={index}
                        className="absolute"
                        style={{
                            left: `${word.left * 100}%`,
                            top: `${word.top * 100}%`,
                            width: `${word.width * 100}%`,
                            height: `${word.height * 100}%`,
                        }}
                    >
                        <FittedContent
                            text={word.text}
                            width={width * word.width}
                            height={height * word.height}
                            ready={ready}
                            singleLine
                        />
                    </div>
                ))
            ) : (
                <FittedContent
                    text={region.text}
                    content={region.content}
                    width={width}
                    height={height}
                    ready={ready}
                    singleLine={region.kind === 'line'}
                />
            )}
            <OcrRegionControl
                id={id}
                index={index}
                label={contentText(region.content, region.text)}
                selected={selected}
                onHover={onHover}
                onSelect={onSelect}
                onCorrect={onCorrect}
            />
        </div>
    );
});

export default function OcrPageLayout({
    documentId,
    pdfViewport,
    pdfDocument,
    imageUrl,
    regions,
    pages,
    pageContents,
    selectedRegion,
    hoveredRegion = null,
    onSelectRegion,
    onHoverRegion,
    onCorrectRegion,
    loading = false,
    status,
}: Props) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [showBackground, setShowBackground] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    useEffect(() => {
        setShowBackground(true);
    }, [documentId]);
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
                extraControls={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={
                                showBackground
                                    ? 'Hide document background'
                                    : 'Show document background'
                            }
                            title={
                                showBackground
                                    ? 'Hide document background'
                                    : 'Show document background'
                            }
                            aria-pressed={showBackground}
                            disabled={
                                Boolean(status) ||
                                !(pdfDocument || imageUrl) ||
                                !regions.some(hasPosition)
                            }
                            onClick={() =>
                                setShowBackground((current) => !current)
                            }
                            className="size-8 rounded-none bg-white text-black hover:bg-slate-100 hover:text-black dark:bg-white dark:text-black dark:hover:bg-slate-100 dark:hover:text-black"
                        >
                            <span
                                className="relative size-4"
                                aria-hidden="true"
                            >
                                <Image
                                    className={cn(
                                        'absolute inset-0 size-4 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none',
                                        showBackground
                                            ? 'scale-100 opacity-100'
                                            : 'scale-75 opacity-0',
                                    )}
                                />
                                <ImageOff
                                    className={cn(
                                        'absolute inset-0 size-4 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none',
                                        showBackground
                                            ? 'scale-75 opacity-0'
                                            : 'scale-100 opacity-100',
                                    )}
                                />
                            </span>
                        </Button>
                    </>
                }
            />
            <div className="relative flex min-h-0 flex-1 flex-col">
                <PannableViewport
                    viewerRef={viewerRef}
                    className="bg-slate-200 p-2 dark:bg-neutral-900"
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
                            const hasPageBackground = Boolean(
                                pdfDocument || (imageUrl && page === 1),
                            );
                            const overDocument =
                                !showBackground || hasPageBackground;
                            const pageText =
                                pages[page - 1] ||
                                entries
                                    .map(({ region }) => region.text)
                                    .join('\n');
                            const fullContent = pageContents?.[page - 1];
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
                                            className="bg-transparent"
                                            style={{ height: pageHeight }}
                                        />
                                    ) : size ? (
                                        <div
                                            className={cn(
                                                'relative isolate',
                                                overDocument &&
                                                    'bg-white shadow-lg',
                                            )}
                                        >
                                            {showBackground &&
                                                hasPageBackground && (
                                                    <OcrPageBackground
                                                        pdfDocument={
                                                            pdfDocument
                                                        }
                                                        imageUrl={imageUrl}
                                                        pageNumber={page}
                                                        sourceWidth={
                                                            size.pageWidth!
                                                        }
                                                        viewerRef={viewerRef}
                                                    />
                                                )}
                                            <svg
                                                viewBox={`0 0 ${size.pageWidth} ${size.pageHeight}`}
                                                width={pageWidth}
                                                height={pageHeight}
                                                preserveAspectRatio="none"
                                                role="group"
                                                aria-label={`Positioned OCR text on page ${page}`}
                                                className="relative block bg-transparent"
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
                                                                height={
                                                                    boxHeight
                                                                }
                                                            >
                                                                <PositionedText
                                                                    id={`ocr-region-${documentId}-${index}`}
                                                                    index={
                                                                        index
                                                                    }
                                                                    region={
                                                                        region
                                                                    }
                                                                    width={
                                                                        boxWidth
                                                                    }
                                                                    height={
                                                                        boxHeight
                                                                    }
                                                                    ready={
                                                                        pageWidth >
                                                                        1
                                                                    }
                                                                    selected={
                                                                        selectedRegion ===
                                                                        index
                                                                    }
                                                                    highlighted={
                                                                        (hoveredRegion ??
                                                                            selectedRegion) ===
                                                                        index
                                                                    }
                                                                    overDocument={
                                                                        overDocument
                                                                    }
                                                                    onSelect={
                                                                        onSelectRegion
                                                                    }
                                                                    onHover={
                                                                        onHoverRegion
                                                                    }
                                                                    onCorrect={
                                                                        onCorrectRegion
                                                                    }
                                                                />
                                                            </foreignObject>
                                                        );
                                                    },
                                                )}
                                            </svg>
                                        </div>
                                    ) : (
                                        <div
                                            className="overflow-auto bg-transparent p-4 text-sm text-foreground"
                                            style={{ height: pageHeight }}
                                        >
                                            <p className="mb-3 text-xs text-muted-foreground">
                                                Page positions are unavailable
                                                for this OCR result.
                                            </p>
                                            <div
                                                className="whitespace-pre-wrap select-text"
                                                onPointerDown={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <OcrContent
                                                    content={fullContent}
                                                    text={
                                                        pageText ||
                                                        'No recognized text on this page.'
                                                    }
                                                />
                                            </div>
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
                                                        <div
                                                            key={index}
                                                            data-pan-region
                                                            className={`relative block w-full border p-3 text-left text-sm whitespace-pre-wrap text-foreground ${(hoveredRegion ?? selectedRegion) === index ? 'border-blue-900 bg-blue-100 dark:bg-blue-900 dark:text-white' : 'border-border bg-transparent'}`}
                                                        >
                                                            <OcrContent
                                                                content={
                                                                    region.content
                                                                }
                                                                text={
                                                                    region.text
                                                                }
                                                            />
                                                            <OcrRegionControl
                                                                id={`ocr-region-${documentId}-${index}`}
                                                                index={index}
                                                                label={contentText(
                                                                    region.content,
                                                                    region.text,
                                                                )}
                                                                selected={
                                                                    selectedRegion ===
                                                                    index
                                                                }
                                                                onSelect={
                                                                    onSelectRegion
                                                                }
                                                                onHover={
                                                                    onHoverRegion
                                                                }
                                                                onCorrect={
                                                                    onCorrectRegion
                                                                }
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </section>
                            );
                        })}
                    </div>
                </PannableViewport>
                {status && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
