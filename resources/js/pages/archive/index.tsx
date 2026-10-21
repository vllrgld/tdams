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
import FilingCabinet from './components/filing-cabinet';
import OpenBook, { type OpenedBook } from './components/open-book';
import type { FilingCabinet as FilingCabinetData } from './data/cabinets';

export default function Archive({
    cabinets,
}: {
    cabinets: FilingCabinetData[];
}) {
    const [zoomedCabinetId, setZoomedCabinetId] = useState<string | null>(null);
    const [openedBook, setOpenedBook] = useState<OpenedBook | null>(null);
    const [viewingDocument, setViewingDocument] =
        useState<ArchivedDocument | null>(null);
    const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
    const reduceMotion = useReducedMotion();
    const drawerTotal = cabinets.reduce(
        (total, cabinet) => total + cabinet.drawers.length,
        0,
    );

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
                setOpenedBook(null);
                return;
            }

            setZoomedCabinetId(null);
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openedBook, viewingDocument, zoomedCabinetId]);

    return (
        <>
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
                                    onClick={() => {
                                        if (viewingDocument) {
                                            setViewingDocument(null);
                                            setDocumentInfoOpen(false);
                                            return;
                                        }

                                        if (openedBook) {
                                            setOpenedBook(null);
                                            return;
                                        }

                                        setZoomedCabinetId(null);
                                    }}
                                />
                            )}
                        </AnimatePresence>,
                        document.body,
                    )}

                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
                        <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
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
                                {cabinets.length} cabinets · {drawerTotal}{' '}
                                drawers
                            </Badge>
                        </CardHeader>
                        <CardContent className="grid gap-x-6 gap-y-2 px-4 py-6 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
                            {cabinets.length === 0 ? (
                                <p className="col-span-full text-sm text-slate-600 dark:text-neutral-400">
                                    No cabinets yet. Add one from Cabinets to
                                    see it here.
                                </p>
                            ) : (
                                cabinets.map((cabinet) => (
                                    <FilingCabinet
                                        key={cabinet.id}
                                        cabinet={cabinet}
                                        zoomed={zoomedCabinetId === cabinet.id}
                                        onZoomChange={(zoomed) => {
                                            if (!zoomed) {
                                                setOpenedBook(null);
                                                setViewingDocument(null);
                                                setDocumentInfoOpen(false);
                                            }

                                            setZoomedCabinetId(
                                                zoomed ? cabinet.id : null,
                                            );
                                        }}
                                        onOpenBook={(
                                            book,
                                            cover,
                                            drawerLabel,
                                        ) =>
                                            setOpenedBook({
                                                book,
                                                cover,
                                                drawerLabel,
                                                cabinetName: cabinet.name,
                                            })
                                        }
                                    />
                                ))
                            )}
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
                                onClose={() => {
                                    if (viewingDocument) {
                                        return;
                                    }

                                    setOpenedBook(null);
                                }}
                                onOpenDocument={setViewingDocument}
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
        </>
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
