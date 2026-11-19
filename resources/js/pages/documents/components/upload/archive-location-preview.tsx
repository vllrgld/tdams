import { useMemo, useState, type ReactNode } from 'react';
import CabinetViewSwitch from '@/components/filing/cabinets/cabinet-view-switch';
import { Spinner } from '@/components/ui/spinner';
import { useClientComponent } from '@/hooks/use-client-component';
import FilingCabinet, {
    filingCabinetFrameSize,
} from '@/components/filing/cabinets/filing-cabinet';
import type { FilingCabinet as FilingCabinetData } from '@/types/filing';
import type { ArchivePlacementCabinet } from '../../types';

const ignorePreviewAction = () => undefined;

function loadCabinetModel() {
    return import('@/components/filing/cabinets/procedural-cabinet-preview');
}

function CabinetModelPreview({
    cabinet,
    drawerId,
    fallback,
}: {
    cabinet: ArchivePlacementCabinet;
    drawerId: string;
    fallback: ReactNode;
}) {
    const [Model, error] = useClientComponent(loadCabinetModel);
    if (error)
        return (
            <div className="grid w-full place-items-center gap-2">
                <p
                    role="status"
                    className="text-center text-xs text-muted-foreground"
                >
                    3D preview is unavailable. Showing the current view.
                </p>
                {fallback}
            </div>
        );
    if (!Model)
        return (
            <div
                role="status"
                className="flex h-[30rem] items-center justify-center gap-2 text-sm text-muted-foreground sm:h-[clamp(28rem,calc(50dvh_+_6rem),36rem)]"
            >
                <Spinner /> Loading cabinet…
            </div>
        );
    return (
        <Model
            cabinet={cabinet}
            openDrawerId={drawerId || null}
            fallback={fallback}
        />
    );
}

export default function ArchiveLocationPreview({
    cabinet,
    drawerId,
    bookId,
}: {
    cabinet?: ArchivePlacementCabinet;
    drawerId: string;
    bookId: string;
}) {
    const frame = filingCabinetFrameSize();
    const [view, setView] = useState<'model' | 'current'>('model');
    const previewCabinet = useMemo<FilingCabinetData | null>(
        () =>
            cabinet
                ? {
                      id: `filing-preview-${cabinet.id}`,
                      name: cabinet.name,
                      location: '',
                      drawers: cabinet.drawers.map((drawer) => ({
                          id: drawer.id,
                          label: drawer.label,
                          range: '',
                          books: drawer.books.map((book) => ({
                              ...book,
                              documentCount: 0,
                          })),
                      })),
                  }
                : null,
        [cabinet],
    );

    const currentPreview = previewCabinet ? (
        <div
            inert
            aria-hidden="true"
            className="pointer-events-none shrink-0"
            style={{
                width: `calc(${frame.width}px * var(--cabinet-scale))`,
                height: `calc(${frame.height}px * var(--cabinet-scale))`,
            }}
        >
            <div
                className="origin-top-left"
                style={{ transform: 'scale(var(--cabinet-scale))' }}
            >
                <FilingCabinet
                    key={previewCabinet.id}
                    cabinet={previewCabinet}
                    preview
                    zoomed={false}
                    openDrawerId={drawerId || null}
                    previewBookId={bookId || null}
                    onOpenDrawerChange={ignorePreviewAction}
                    onZoomChange={ignorePreviewAction}
                    onOpenItem={ignorePreviewAction}
                />
            </div>
        </div>
    ) : null;

    return (
        <figure className="grid min-h-80 w-full content-center justify-items-center gap-3 bg-slate-50 px-4 py-4 [--cabinet-scale:0.86] lg:[--cabinet-scale:1.05] dark:bg-neutral-950">
            <figcaption className="sr-only">
                {cabinet
                    ? `${cabinet.name}${drawerId ? `, ${cabinet.drawers.find((drawer) => drawer.id === drawerId)?.label ?? ''} open` : ', drawers closed'}`
                    : 'Archive location preview'}
            </figcaption>
            {cabinet && <CabinetViewSwitch value={view} onChange={setView} />}
            {cabinet && previewCabinet ? (
                view === 'model' ? (
                    <CabinetModelPreview
                        key={cabinet.id}
                        cabinet={cabinet}
                        drawerId={drawerId}
                        fallback={currentPreview}
                    />
                ) : (
                    currentPreview
                )
            ) : (
                <p className="max-w-56 text-center text-sm text-slate-500 dark:text-neutral-400">
                    Select a cabinet to see where this document will be filed.
                </p>
            )}
        </figure>
    );
}
