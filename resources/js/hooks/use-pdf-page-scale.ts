import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type PdfFitMode = 'width' | 'page';
type PageSize = { width: number; height: number };

export function usePdfPageScale({
    fitWidth,
    fitHeight,
    pages,
    defaultFit = 'width',
    resetKey,
}: {
    fitWidth: number;
    fitHeight: number;
    pages: Record<number, PageSize>;
    defaultFit?: PdfFitMode;
    resetKey?: string | number;
}) {
    const [fitPage, setFitPage] = useState(defaultFit === 'page');
    const [manualZoom, setManualZoom] = useState(1);

    useEffect(() => {
        setFitPage(defaultFit === 'page');
        setManualZoom(1);
    }, [defaultFit, resetKey]);

    // A common width keeps mixed-size documents aligned in both panes;
    // the tallest page determines how much space a complete page needs.
    const aspectRatio = Math.max(
        0,
        ...Object.values(pages)
            .filter((page) => page.width > 0 && page.height > 0)
            .map((page) => page.height / page.width),
    );
    const fittedZoom =
        fitWidth > 0 && fitHeight > 0 && aspectRatio > 0
            ? Math.min(1, fitHeight / (fitWidth * aspectRatio))
            : 1;
    const zoom = fitPage ? fittedZoom : manualZoom;
    const pageWidth = Math.max(fitPage ? 1 : 240, Math.floor(fitWidth * zoom));

    const onZoomChange: Dispatch<SetStateAction<number>> = (next) => {
        setManualZoom(typeof next === 'function' ? next(zoom) : next);
        setFitPage(false);
    };

    return {
        zoom,
        pageWidth,
        canPan:
            pageWidth > fitWidth ||
            Math.floor(pageWidth * aspectRatio) > fitHeight,
        onZoomChange,
        onFitPage: () => setFitPage(true),
    };
}
