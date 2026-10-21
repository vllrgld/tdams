import { Maximize2 } from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/pages/documents/lib/formatters';
import DocumentThumbnail from '@/pages/documents/components/document-thumbnail';
import type { ArchivedDocument } from '@/pages/documents/types';
import type { BookCover, CabinetBook } from '../data/cabinets';

const PAGE_W = 400;
const PAGE_H = 540;
const OPEN: Transition = { duration: 0.85, ease: [0.4, 0, 0.2, 1] };
const FLIP: Transition = { duration: 0.7, ease: [0.4, 0, 0.2, 1] };
const INSTANT: Transition = { duration: 0 };
const FADE: Transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export type OpenedBook = {
    book: CabinetBook;
    cabinetName: string;
    drawerLabel: string;
    cover: BookCover;
};

function BookPage({ document }: { document: ArchivedDocument }) {
    return (
        <DocumentThumbnail
            mimeType={document.mimeType}
            url={document.viewUrl}
            title={document.originalFilename}
            pageNumber={1}
            fit="contain"
            fill
            quality="book"
            className="h-full bg-transparent dark:bg-transparent"
        />
    );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-sm break-words text-neutral-900">
                {value || '—'}
            </p>
        </div>
    );
}

function DocumentDetails({ document }: { document: ArchivedDocument }) {
    const title = document.taxDeclarationNumber || document.originalFilename;
    const showFilename = Boolean(document.taxDeclarationNumber);

    return (
        <div className="flex h-full flex-col justify-between p-6">
            <div className="space-y-4">
                <p className="text-lg font-semibold break-words text-neutral-900">
                    {title}
                </p>
                <div className="space-y-3">
                    <DetailRow label="Owner" value={document.registeredOwner} />
                    <DetailRow label="Lot" value={document.lotNumber} />
                    <DetailRow
                        label="Date"
                        value={
                            document.declarationDate
                                ? formatDate(document.declarationDate)
                                : null
                        }
                    />
                </div>
            </div>
            {showFilename ? (
                <p className="truncate text-[10px] text-neutral-500">
                    {document.originalFilename}
                </p>
            ) : null}
        </div>
    );
}

function EmptyDocuments() {
    return (
        <div className="flex h-full flex-col gap-3 p-6">
            <p className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                Documents
            </p>
            <p className="text-sm text-neutral-700">
                Saved documents in this book will appear here.
            </p>
        </div>
    );
}

export default function OpenBook({
    opened,
    dimmed,
    onClose,
    onOpenDocument,
}: {
    opened: OpenedBook;
    dimmed?: boolean;
    onClose: () => void;
    onOpenDocument: (document: ArchivedDocument) => void;
}) {
    const reduceMotion = useReducedMotion();
    const dialogRef = useRef<HTMLDivElement>(null);
    const documents = opened.book.documents;
    const lastIndex = Math.max(0, documents.length - 1);
    const [index, setIndex] = useState(0);
    const [flip, setFlip] = useState<'next' | 'prev' | null>(null);
    const current = documents[index] ?? null;
    const nextDoc = documents[index + 1] ?? null;
    const prevDoc = index > 0 ? (documents[index - 1] ?? null) : null;
    const canGoNext = current !== null && index < lastIndex && !flip;
    const canGoPrev = index > 0 && !flip;
    const coverOpen = 'rotateY(-158deg)';
    const coverClosed = 'rotateY(0deg)';
    const motionTransition = reduceMotion ? INSTANT : OPEN;
    const flipTransition = reduceMotion ? INSTANT : FLIP;

    useEffect(() => {
        dialogRef.current?.focus({ preventScroll: true });
        setIndex(0);
        setFlip(null);
    }, [opened.book.id]);

    function finishFlip(direction: 'next' | 'prev') {
        setIndex((currentIndex) =>
            direction === 'next'
                ? Math.min(lastIndex, currentIndex + 1)
                : Math.max(0, currentIndex - 1),
        );
        setFlip(null);
    }

    function goNext() {
        if (!canGoNext) {
            return;
        }

        if (reduceMotion) {
            finishFlip('next');
            return;
        }

        setFlip('next');
    }

    function goPrev() {
        if (!canGoPrev) {
            return;
        }

        if (reduceMotion) {
            finishFlip('prev');
            return;
        }

        setFlip('prev');
    }

    function openCurrentDocument() {
        if (!current) {
            return;
        }

        onOpenDocument(current);
    }

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-book-title"
            tabIndex={-1}
            ref={dialogRef}
            className={cn(
                'fixed inset-0 grid place-items-center outline-none',
                dimmed ? 'z-40' : 'z-[60]',
            )}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? INSTANT : FADE}
        >
            <button
                type="button"
                aria-label="Close book"
                className="absolute inset-0 bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-300"
                onClick={onClose}
            />
            <div
                className="group/book relative z-10"
                style={{
                    width: PAGE_W * 2,
                    height: PAGE_H,
                    transform: `translateX(-${PAGE_W / 2}px)`,
                }}
            >
                {current && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={openCurrentDocument}
                        aria-label={`Open ${current.originalFilename}`}
                        title="Open document"
                        className="absolute top-2 right-2 z-30 size-8 cursor-pointer rounded-none bg-transparent text-blue-900 opacity-0 shadow-none [filter:drop-shadow(0_0_2px_rgb(255_255_255))_drop-shadow(0_1px_2px_rgb(255_255_255_/_0.9))] transition-transform duration-200 ease-out group-focus-within/book:opacity-100 group-hover/book:opacity-100 hover:scale-150 hover:bg-transparent hover:text-blue-950 focus-visible:opacity-100 focus-visible:ring-blue-700 motion-reduce:transition-none motion-reduce:hover:scale-100"
                    >
                        <Maximize2 aria-hidden="true" className="size-4" />
                    </Button>
                )}
                <div
                    className="absolute top-0 left-1/2 origin-left"
                    style={{
                        width: PAGE_W,
                        height: PAGE_H,
                        perspective: '1400px',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div
                        className="absolute inset-0 overflow-hidden border border-neutral-300 bg-neutral-50 shadow-2xl dark:border-neutral-400 dark:bg-neutral-100"
                        style={{ transform: 'translateZ(0px)' }}
                    >
                        {current ? (
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={!canGoNext}
                                aria-label="Next page"
                                className="h-full w-full disabled:cursor-default"
                            >
                                <BookPage key={current.id} document={current} />
                            </button>
                        ) : (
                            <EmptyDocuments />
                        )}
                    </div>

                    {flip === 'next' && current && nextDoc && (
                        <motion.div
                            className="absolute inset-0 z-10"
                            style={{
                                transformOrigin: 'left center',
                                transformStyle: 'preserve-3d',
                            }}
                            initial={{ transform: 'rotateY(0deg)' }}
                            animate={{ transform: 'rotateY(-180deg)' }}
                            transition={flipTransition}
                            onAnimationComplete={() => finishFlip('next')}
                        >
                            <div
                                className="absolute inset-0 overflow-hidden border border-neutral-300 bg-neutral-50"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(1px)',
                                }}
                            >
                                <BookPage key={current.id} document={current} />
                            </div>
                            <div
                                className="absolute inset-0 overflow-hidden border border-neutral-300 bg-amber-50 text-left dark:border-neutral-400 dark:bg-amber-100"
                                style={{
                                    transform:
                                        'rotateY(180deg) translateZ(1px)',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                <DocumentDetails
                                    key={nextDoc.id}
                                    document={nextDoc}
                                />
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        className="absolute inset-0"
                        style={{
                            transformOrigin: 'left center',
                            transformStyle: 'preserve-3d',
                        }}
                        initial={
                            reduceMotion ? false : { transform: coverClosed }
                        }
                        animate={{ transform: coverOpen }}
                        transition={motionTransition}
                    >
                        <div
                            className={cn(
                                'absolute inset-0 flex items-center justify-center border border-black/25 px-6 text-center shadow-lg',
                                opened.cover.cover,
                                opened.cover.text,
                            )}
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'translateZ(1px)',
                            }}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <img
                                    src="/logo.png"
                                    alt=""
                                    className="size-24 object-contain"
                                />
                                <p className="text-lg font-semibold tracking-wide">
                                    {opened.book.label}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            id="open-book-title"
                            onClick={goPrev}
                            disabled={!canGoPrev}
                            aria-label={
                                prevDoc
                                    ? `Previous page, ${prevDoc.originalFilename}`
                                    : opened.book.label
                            }
                            className="absolute inset-0 overflow-hidden border border-neutral-300 bg-amber-50 text-left disabled:cursor-default dark:border-neutral-400 dark:bg-amber-100"
                            style={{
                                transform: 'rotateY(180deg) translateZ(1px)',
                                backfaceVisibility: 'hidden',
                            }}
                        >
                            {current ? (
                                <DocumentDetails
                                    key={current.id}
                                    document={current}
                                />
                            ) : null}
                        </button>
                    </motion.div>

                    {flip === 'prev' && prevDoc && current && (
                        <motion.div
                            className="absolute inset-0 z-20"
                            style={{
                                transformOrigin: 'left center',
                                transformStyle: 'preserve-3d',
                            }}
                            initial={{ transform: 'rotateY(-180deg)' }}
                            animate={{ transform: 'rotateY(0deg)' }}
                            transition={flipTransition}
                            onAnimationComplete={() => finishFlip('prev')}
                        >
                            <div
                                className="absolute inset-0 overflow-hidden border border-neutral-300 bg-neutral-50"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(1px)',
                                }}
                            >
                                <BookPage key={prevDoc.id} document={prevDoc} />
                            </div>
                            <div
                                className="absolute inset-0 overflow-hidden border border-neutral-300 bg-amber-50 text-left dark:border-neutral-400 dark:bg-amber-100"
                                style={{
                                    transform:
                                        'rotateY(180deg) translateZ(1px)',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                <DocumentDetails
                                    key={current.id}
                                    document={current}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            <p className="pointer-events-none absolute bottom-8 z-10 text-center text-xs text-neutral-300">
                {documents.length > 0
                    ? `${index + 1} / ${documents.length} · click a page to flip · Esc to close`
                    : 'Esc or click outside to close'}
            </p>
        </motion.div>
    );
}
