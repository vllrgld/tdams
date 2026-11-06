import {
    ChevronLeft,
    ChevronRight,
    Scan,
    Maximize,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PdfViewerControls({
    pageNumber,
    pageCount,
    zoom,
    onPageChange,
    onZoomChange,
    onFitPage,
    label = 'PDF viewer',
}: {
    pageNumber: number;
    pageCount: number;
    zoom: number;
    onPageChange: (page: number) => void;
    onZoomChange: Dispatch<SetStateAction<number>>;
    onFitPage?: () => void;
    label?: string;
}) {
    return (
        <div
            className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-card px-2 py-2 dark:border-neutral-800 dark:bg-black"
            aria-label={`${label} controls`}
        >
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    title="Previous page"
                    disabled={pageNumber <= 1 || pageCount === 0}
                    onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
                    className="size-8 rounded-none"
                >
                    <ChevronLeft aria-hidden="true" />
                </Button>
                <span className="min-w-20 px-1 text-center text-xs text-slate-700 tabular-nums dark:text-neutral-300">
                    <Input
                        aria-label={`Current ${label} page`}
                        type="number"
                        min={1}
                        max={pageCount}
                        value={pageNumber}
                        disabled={pageCount === 0}
                        onChange={(event) => {
                            const requestedPage = Number(event.target.value);

                            if (
                                Number.isInteger(requestedPage) &&
                                requestedPage >= 1 &&
                                requestedPage <= pageCount
                            ) {
                                onPageChange(requestedPage);
                            }
                        }}
                        className="mr-1 inline-flex h-8 w-12 rounded-none px-1 text-center text-xs tabular-nums"
                    />
                    <span aria-live="polite">
                        / {pageCount > 0 ? pageCount : '—'}
                    </span>
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    title="Next page"
                    disabled={pageNumber >= pageCount || pageCount === 0}
                    onClick={() =>
                        onPageChange(Math.min(pageCount, pageNumber + 1))
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
                        onZoomChange((current) =>
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
                    className="min-w-12 text-center text-xs text-slate-700 tabular-nums dark:text-neutral-300"
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
                        onZoomChange((current) =>
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
                    onClick={() => onZoomChange(1)}
                    className="h-8 rounded-none px-2 text-xs"
                >
                    <Maximize aria-hidden="true" />
                    Fit width
                </Button>
                {onFitPage && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onFitPage}
                        className="h-8 rounded-none px-2 text-xs"
                    >
                        <Scan aria-hidden="true" />
                        Fit page
                    </Button>
                )}
            </div>
        </div>
    );
}
