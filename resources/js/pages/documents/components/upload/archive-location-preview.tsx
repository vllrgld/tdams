import { useMemo } from 'react';
import FilingCabinet from '@/components/filing/cabinets/filing-cabinet';
import type { FilingCabinet as FilingCabinetData } from '@/types/filing';
import type { ArchivePlacementCabinet } from '../../types';

const ignorePreviewAction = () => undefined;

export default function ArchiveLocationPreview({
    cabinet,
    drawerId,
    bookId,
}: {
    cabinet?: ArchivePlacementCabinet;
    drawerId: string;
    bookId: string;
}) {
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

    return (
        <figure className="flex h-80 min-w-0 items-center justify-center bg-slate-50 dark:bg-neutral-950">
            <figcaption className="sr-only">
                {cabinet
                    ? `${cabinet.name}${drawerId ? `, ${cabinet.drawers.find((drawer) => drawer.id === drawerId)?.label ?? ''} open` : ', drawers closed'}`
                    : 'Archive location preview'}
            </figcaption>
            {previewCabinet ? (
                <div
                    inert
                    aria-hidden="true"
                    className="pointer-events-none h-full w-[12.5rem]"
                >
                    <div className="origin-top-left scale-[0.66]">
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
            ) : (
                <p className="max-w-48 px-4 text-center text-sm text-slate-500 dark:text-neutral-400">
                    Select a cabinet to preview its drawers.
                </p>
            )}
        </figure>
    );
}
