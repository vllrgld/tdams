import { Head } from '@inertiajs/react';
import { Archive as ArchiveIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import DocumentViewerDialog from '@/pages/documents/components/document-viewer-dialog';
import type { ArchivedDocument } from '@/pages/documents/types';
import CabinetSearch, {
    CABINET_SEARCH_FIELDS,
    type CabinetSearchField,
} from './components/cabinet-search';
import { BookPortalProvider } from './components/book-portal';
import FilingCabinet from './components/filing-cabinet';
import OpenBook, { type OpenedBook } from './components/open-book';
import {
    BOOK_COVER,
    type FilingCabinet as FilingCabinetData,
} from './data/cabinets';

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

function findBook(
    cabinets: FilingCabinetData[],
    bookId: string,
): {
    cabinet: FilingCabinetData;
    drawer: FilingCabinetData['drawers'][number];
    book: FilingCabinetData['drawers'][number]['books'][number];
} | null {
    for (const cabinet of cabinets) {
        for (const drawer of cabinet.drawers) {
            const book = drawer.books.find((item) => item.id === bookId);

            if (book) {
                return { cabinet, drawer, book };
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
    const [zoomedCabinetId, setZoomedCabinetId] = useState<string | null>(null);
    const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
    const [openedBook, setOpenedBook] = useState<OpenedBook | null>(null);
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
    const drawerTotal = cabinets.reduce(
        (total, cabinet) => total + cabinet.drawers.length,
        0,
    );
    const visibleDrawerTotal = visibleCabinets.reduce(
        (total, cabinet) => total + cabinet.drawers.length,
        0,
    );
    const isFiltering = searchQuery.trim() !== '';

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

            if (openedBook) {
                return;
            }

            setZoomedCabinetId(null);
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openedBook, viewingDocument, zoomedCabinetId]);

    function closeOverlayLayer(): void {
        if (viewingDocument) {
            setViewingDocument(null);
            setDocumentInfoOpen(false);
            return;
        }

        if (openedBook) {
            return;
        }

        setZoomedCabinetId(null);
    }

    async function openPreviousDeclaration(number: string): Promise<void> {
        const params = new URLSearchParams({ number });
        const response = await fetch(
            `/archive/documents?${params.toString()}`,
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

        const located = findBook(cabinets, data.bookId);

        if (!located) {
            return;
        }

        setOpenDrawerId(located.drawer.id);
        setZoomedCabinetId(located.cabinet.id);
        setOpenedBook({
            book: located.book,
            cover: BOOK_COVER,
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
        <BookPortalProvider>
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
                    <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
                        <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                        <ArchiveIcon
                                            aria-hidden="true"
                                            className="size-4 text-blue-900 dark:text-blue-200"
                                        />
                                        Archive
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Pick a drawer to pull it out, then click
                                        inside to look closer
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-neutral-700 dark:text-neutral-300"
                                >
                                    {isFiltering
                                        ? `${visibleCabinets.length} of ${cabinets.length} cabinets · ${visibleDrawerTotal} drawers`
                                        : `${cabinets.length} cabinets · ${drawerTotal} drawers`}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 py-0">
                            <div className="border-b border-slate-200 p-3 sm:p-4 dark:border-neutral-800">
                                <CabinetSearch
                                    query={searchQuery}
                                    field={searchField}
                                    onQueryChange={setSearchQuery}
                                    onFieldChange={setSearchField}
                                />
                            </div>
                            <div className="grid grid-cols-1 items-start justify-items-center gap-x-8 gap-y-12 px-4 py-6 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
                                {cabinets.length === 0 ? (
                                    <p className="col-span-full text-sm text-slate-600 dark:text-neutral-400">
                                        No cabinets yet. Add one from Cabinets
                                        to see it here.
                                    </p>
                                ) : visibleCabinets.length === 0 ? (
                                    <p className="col-span-full text-sm text-slate-600 dark:text-neutral-400">
                                        No cabinets match that search.
                                    </p>
                                ) : (
                                    visibleCabinets.map((cabinet) => (
                                        <FilingCabinet
                                            key={cabinet.id}
                                            cabinet={cabinet}
                                            zoomed={
                                                zoomedCabinetId === cabinet.id
                                            }
                                            openDrawerId={
                                                cabinet.drawers.some(
                                                    (drawer) =>
                                                        drawer.id ===
                                                        openDrawerId,
                                                )
                                                    ? openDrawerId
                                                    : null
                                            }
                                            onOpenDrawerChange={(drawerId) => {
                                                setOpenedBook(null);
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
                                                if (!zoomed) {
                                                    setOpenedBook(null);
                                                    setPendingDocumentId(null);
                                                    setViewingDocument(null);
                                                    setDocumentInfoOpen(false);
                                                    setZoomedCabinetId(null);
                                                    return;
                                                }

                                                setZoomedCabinetId(cabinet.id);
                                            }}
                                            openedBookId={
                                                openedBook?.book.id ?? null
                                            }
                                            onOpenBook={(
                                                book,
                                                cover,
                                                drawerLabel,
                                                origin,
                                            ) => {
                                                setOpenedBook({
                                                    book,
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
                        </CardContent>
                    </Card>
                </div>
            </main>
            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {openedBook && (
                            <OpenBook
                                key={openedBook.book.id}
                                opened={openedBook}
                                dimmed={viewingDocument !== null}
                                initialDocumentId={pendingDocumentId}
                                onClose={() => {
                                    if (viewingDocument) {
                                        return;
                                    }

                                    setOpenedBook(null);
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
        </BookPortalProvider>
    );
}

Archive.layout = {
    breadcrumbs: [
        {
            title: 'Archive',
            href: '/archive',
        },
    ],
};
