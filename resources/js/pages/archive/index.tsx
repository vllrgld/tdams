import { locate as locateDocument } from '@/routes/archive/documents';
import { index as archiveIndex } from '@/routes/archive';
import { index as cabinetsIndex } from '@/routes/manage/cabinets';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSetArchiveHeaderTrail } from '@/components/layout/archive-header-context';
import DocumentViewerDialog from '@/components/documents/viewer/document-viewer-dialog';
import type { ArchivedDocument } from '@/types/documents';
import CabinetSearch, {
    CABINET_SEARCH_FIELDS,
    type CabinetSearchField,
} from '@/components/filing/cabinets/cabinet-search';
import { FilingItemPortalProvider } from '@/components/filing/shared/filing-item-portal';
import FilingCabinet from '@/components/filing/cabinets/filing-cabinet';
import FilingItemViewer from '@/components/filing/shared/filing-item-viewer';
import type { OpenedFilingItem } from '@/components/filing/shared/filing-item-types';
import { filingCover } from '@/lib/filing-appearance';
import type { FilingCabinet as FilingCabinetData } from '@/types/filing';

type ArchiveLocateResponse = {
    document: ArchivedDocument | null;
    cabinetId?: string;
    drawerId?: string;
    bookId?: string;
};

function scrollToCabinet(id: string, smooth: boolean): void {
    document.getElementById(`cabinet-${id}`)?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center',
    });
}

function findFilingItem(
    cabinets: FilingCabinetData[],
    bookId: string,
): {
    cabinet: FilingCabinetData;
    drawer: FilingCabinetData['drawers'][number];
    item: FilingCabinetData['drawers'][number]['books'][number];
} | null {
    for (const cabinet of cabinets) {
        for (const drawer of cabinet.drawers) {
            const book = drawer.books.find((item) => item.id === bookId);

            if (book) {
                return { cabinet, drawer, item: book };
            }
        }
    }

    return null;
}

function includesQuery(value: string, query: string): boolean {
    return value.toLowerCase().includes(query);
}

function cabinetMatchesSearch(
    cabinet: FilingCabinetData,
    query: string,
    field: CabinetSearchField,
): boolean {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return true;
    }

    const name = includesQuery(cabinet.name, needle);
    const drawer = cabinet.drawers.some(
        (item) =>
            includesQuery(item.label, needle) ||
            includesQuery(item.range, needle),
    );
    const book = cabinet.drawers.some((item) =>
        item.books.some((entry) => includesQuery(entry.label, needle)),
    );

    switch (field) {
        case 'name':
            return name;
        case 'drawer':
            return drawer;
        case 'book':
            return book;
        default:
            return name || drawer || book;
    }
}

export default function Archive({
    cabinets,
}: {
    cabinets: FilingCabinetData[];
}) {
    const pageUrl = usePage().url;
    const setHeaderTrail = useSetArchiveHeaderTrail();
    const [focusedCabinetId, setFocusedCabinetId] = useState<string | null>(
        null,
    );
    const [zoomedCabinetId, setZoomedCabinetId] = useState<string | null>(null);
    const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
    const [openedItem, setOpenedItem] = useState<OpenedFilingItem | null>(null);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(null);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
    const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<CabinetSearchField>(
        CABINET_SEARCH_FIELDS[0].value,
    );
    const reduceMotion = useReducedMotion();
    const visibleCabinets = cabinets.filter((cabinet) =>
        cabinetMatchesSearch(cabinet, searchQuery, searchField),
    );
    const visibleDrawerTotal = visibleCabinets.reduce(
        (total, cabinet) => total + cabinet.drawers.length,
        0,
    );
    const visibleBookTotal = visibleCabinets.reduce(
        (total, cabinet) =>
            total +
            cabinet.drawers.reduce(
                (books, drawer) => books + drawer.books.length,
                0,
            ),
        0,
    );
    const isFiltering = searchQuery.trim() !== '';

    useEffect(() => {
        const params = new URL(pageUrl, window.location.origin).searchParams;
        const located = params.get('book')
            ? findFilingItem(cabinets, params.get('book')!)
            : null;
        const cabinet =
            located?.cabinet ??
            cabinets.find((item) => item.id === params.get('cabinet'));
        if (!cabinet) return;
        const drawer =
            located?.drawer ??
            cabinet.drawers.find((item) => item.id === params.get('drawer'));
        setFocusedCabinetId(cabinet.id);
        setOpenDrawerId(drawer?.id ?? null);
        setZoomedCabinetId(drawer ? cabinet.id : null);
        setOpenedItem(
            located
                ? {
                      item: located.item,
                      cover: filingCover(located.item.kind),
                      drawerLabel: located.drawer.label,
                      cabinetName: located.cabinet.name,
                      origin: null,
                  }
                : null,
        );
        setSearchQuery('');
        scrollToCabinet(cabinet.id, false);
    }, [cabinets, pageUrl]);

    useEffect(() => {
        if (!setHeaderTrail) return;
        const cabinet = cabinets.find(
            (item) =>
                item.id === focusedCabinetId ||
                item.id === zoomedCabinetId ||
                item.drawers.some((drawer) => drawer.id === openDrawerId),
        );
        const drawer = cabinet?.drawers.find(
            (item) => item.id === openDrawerId,
        );
        function closeDocumentAndBook() {
            setOpenedItem(null);
            setPendingDocumentId(null);
            setViewingDocument(null);
            setDocumentInfoOpen(false);
        }
        setHeaderTrail([
            {
                title: 'Archive',
                onSelect: () => {
                    closeDocumentAndBook();
                    setOpenDrawerId(null);
                    setZoomedCabinetId(null);
                    setFocusedCabinetId(null);
                    setSearchQuery('');
                },
            },
            ...(cabinet
                ? [
                      {
                          title: cabinet.name,
                          onSelect: () => {
                              closeDocumentAndBook();
                              setOpenDrawerId(null);
                              setZoomedCabinetId(null);
                              setFocusedCabinetId(cabinet.id);
                              scrollToCabinet(cabinet.id, !reduceMotion);
                          },
                      },
                  ]
                : []),
            ...(cabinet && drawer
                ? [
                      {
                          title: drawer.label,
                          onSelect: () => {
                              closeDocumentAndBook();
                              setOpenDrawerId(drawer.id);
                              setZoomedCabinetId(cabinet.id);
                          },
                      },
                  ]
                : []),
            ...(openedItem ? [{ title: openedItem.item.label }] : []),
        ]);
        return () => setHeaderTrail([]);
    }, [
        cabinets,
        focusedCabinetId,
        openDrawerId,
        openedItem,
        reduceMotion,
        setHeaderTrail,
        zoomedCabinetId,
    ]);

    useEffect(() => {
        if (!zoomedCabinetId) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') {
                return;
            }

            if (viewingDocument) {
                setViewingDocument(null);
                setDocumentInfoOpen(false);
                return;
            }

            if (openedItem) {
                return;
            }

            setZoomedCabinetId(null);
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openedItem, viewingDocument, zoomedCabinetId]);

    function closeOverlayLayer(): void {
        if (viewingDocument) {
            setViewingDocument(null);
            setDocumentInfoOpen(false);
            return;
        }

        if (openedItem) {
            return;
        }

        setZoomedCabinetId(null);
    }

    async function openPreviousDeclaration(number: string): Promise<void> {
        const response = await fetch(
            locateDocument.url({ query: { number } }),
            {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            },
        );

        if (!response.ok) {
            return;
        }

        const data = (await response.json()) as ArchiveLocateResponse;

        if (
            !data.document ||
            !data.cabinetId ||
            !data.drawerId ||
            !data.bookId
        ) {
            return;
        }

        const located = findFilingItem(cabinets, data.bookId);

        if (!located) {
            return;
        }

        setOpenDrawerId(located.drawer.id);
        setFocusedCabinetId(located.cabinet.id);
        setZoomedCabinetId(located.cabinet.id);
        setOpenedItem({
            item: located.item,
            cover: filingCover(located.item.kind),
            drawerLabel: located.drawer.label,
            cabinetName: located.cabinet.name,
            origin: null,
        });
        setPendingDocumentId(String(data.document.id));
        setViewingDocument(null);
        setDocumentInfoOpen(false);
        scrollToCabinet(located.cabinet.id, !reduceMotion);
    }

    return (
        <FilingItemPortalProvider>
            <Head title="Archive" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                {typeof document !== 'undefined' &&
                    createPortal(
                        <AnimatePresence>
                            {zoomedCabinetId && (
                                <motion.div
                                    aria-hidden="true"
                                    className="fixed inset-0 z-40 bg-black/60"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: reduceMotion ? 0 : 0.45,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    onClick={closeOverlayLayer}
                                />
                            )}
                        </AnimatePresence>,
                        document.body,
                    )}

                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-end dark:border-blue-200">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                Archive
                            </h1>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Browse the filing cabinets to find a folder or
                                book and its tax declarations.
                            </p>
                        </div>
                        <Link
                            href={cabinetsIndex.url()}
                            className={buttonVariants({
                                variant: 'outline',
                                className:
                                    'w-fit shrink-0 rounded-none border-slate-300 shadow-none dark:border-neutral-700',
                            })}
                        >
                            Manage cabinets
                        </Link>
                    </header>

                    <section
                        aria-label="Archive cabinets"
                        className="min-w-0 border border-slate-200 bg-card dark:border-neutral-800 dark:bg-black"
                    >
                        {cabinets.length > 0 && (
                            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 dark:border-neutral-800">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="min-w-0 flex-1 basis-64 sm:max-w-2xl [&_[data-slot=select-trigger]]:w-24 sm:[&_[data-slot=select-trigger]]:w-32">
                                        <CabinetSearch
                                            query={searchQuery}
                                            field={searchField}
                                            onQueryChange={setSearchQuery}
                                            onFieldChange={setSearchField}
                                            placeholderAll="Search cabinets, drawers, folders or books…"
                                        />
                                    </div>
                                    {isFiltering && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-10 rounded-none px-3 text-blue-900 dark:text-blue-200"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Clear search
                                        </Button>
                                    )}
                                </div>
                                <p
                                    role="status"
                                    className="text-xs text-slate-600 tabular-nums dark:text-neutral-400"
                                >
                                    {isFiltering
                                        ? `${visibleCabinets.length} of ${cabinets.length} cabinets`
                                        : `${cabinets.length} ${cabinets.length === 1 ? 'cabinet' : 'cabinets'}`}
                                    {' · '}
                                    {visibleDrawerTotal}{' '}
                                    {visibleDrawerTotal === 1
                                        ? 'drawer'
                                        : 'drawers'}
                                    {' · '}
                                    {visibleBookTotal}{' '}
                                    {visibleBookTotal === 1
                                        ? 'folder / book'
                                        : 'folders / books'}
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21.25rem),1fr))] items-start justify-items-center gap-x-6 gap-y-8 py-8 sm:px-4">
                            {cabinets.length === 0 ? (
                                <div className="col-span-full flex min-h-64 flex-col items-center justify-center px-5 text-center">
                                    <h2 className="text-base font-semibold text-slate-950 dark:text-neutral-50">
                                        No cabinets yet
                                    </h2>
                                    <p className="mt-2 max-w-[45ch] text-sm text-slate-600 dark:text-neutral-400">
                                        Add a cabinet and its drawers to start
                                        organizing the archive.
                                    </p>
                                    <Link
                                        href={cabinetsIndex.url()}
                                        className={buttonVariants({
                                            variant: 'outline',
                                            className:
                                                'mt-5 rounded-none border-slate-300 shadow-none dark:border-neutral-700',
                                        })}
                                    >
                                        Add a cabinet
                                    </Link>
                                </div>
                            ) : visibleCabinets.length === 0 ? (
                                <div className="col-span-full flex min-h-64 flex-col items-center justify-center px-5 text-center">
                                    <h2 className="text-base font-semibold text-slate-950 dark:text-neutral-50">
                                        No cabinets match your search.
                                    </h2>
                                    <p className="mt-2 max-w-[45ch] text-sm text-slate-600 dark:text-neutral-400">
                                        Try another cabinet name, drawer, or
                                        folder or book, or clear the search
                                        above.
                                    </p>
                                </div>
                            ) : (
                                visibleCabinets.map((cabinet) => (
                                    <FilingCabinet
                                        key={cabinet.id}
                                        cabinet={cabinet}
                                        zoomed={zoomedCabinetId === cabinet.id}
                                        openDrawerId={
                                            cabinet.drawers.some(
                                                (drawer) =>
                                                    drawer.id === openDrawerId,
                                            )
                                                ? openDrawerId
                                                : null
                                        }
                                        onOpenDrawerChange={(drawerId) => {
                                            setFocusedCabinetId(cabinet.id);
                                            setOpenedItem(null);
                                            setPendingDocumentId(null);
                                            setViewingDocument(null);
                                            setDocumentInfoOpen(false);

                                            if (!drawerId) {
                                                setOpenDrawerId(null);
                                                setZoomedCabinetId(null);
                                                return;
                                            }

                                            setOpenDrawerId(drawerId);
                                            setZoomedCabinetId(null);
                                        }}
                                        onZoomChange={(zoomed) => {
                                            setFocusedCabinetId(cabinet.id);
                                            if (!zoomed) {
                                                setOpenedItem(null);
                                                setPendingDocumentId(null);
                                                setViewingDocument(null);
                                                setDocumentInfoOpen(false);
                                                setZoomedCabinetId(null);
                                                return;
                                            }

                                            setZoomedCabinetId(cabinet.id);
                                        }}
                                        openedItemId={
                                            openedItem?.item.id ?? null
                                        }
                                        onOpenItem={(
                                            book,
                                            cover,
                                            drawerLabel,
                                            origin,
                                        ) => {
                                            setFocusedCabinetId(cabinet.id);
                                            setOpenedItem({
                                                item: book,
                                                cover,
                                                drawerLabel,
                                                cabinetName: cabinet.name,
                                                origin,
                                            });
                                            setPendingDocumentId(null);
                                            setViewingDocument(null);
                                            setDocumentInfoOpen(false);
                                        }}
                                    />
                                ))
                            )}
                        </div>
                        {visibleCabinets.length > 0 && (
                            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-neutral-800 dark:bg-neutral-950">
                                <p className="text-xs text-slate-600 dark:text-neutral-400">
                                    Select a drawer to pull it out, then click
                                    inside to choose a book.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {openedItem && (
                            <FilingItemViewer
                                key={openedItem.item.id}
                                opened={openedItem}
                                dimmed={viewingDocument !== null}
                                initialDocumentId={pendingDocumentId}
                                onClose={() => {
                                    if (viewingDocument) {
                                        return;
                                    }

                                    setOpenedItem(null);
                                    setPendingDocumentId(null);
                                }}
                                onOpenDocument={setViewingDocument}
                                onOpenPrevious={openPreviousDeclaration}
                                onInitialDocumentConsumed={() =>
                                    setPendingDocumentId(null)
                                }
                            />
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
            <DocumentViewerDialog
                document={viewingDocument}
                infoOpen={documentInfoOpen}
                onDocumentChange={setViewingDocument}
                onInfoOpenChange={setDocumentInfoOpen}
            />
        </FilingItemPortalProvider>
    );
}

Archive.layout = {
    breadcrumbs: [
        {
            title: 'Archive',
            href: archiveIndex.url(),
        },
    ],
};
