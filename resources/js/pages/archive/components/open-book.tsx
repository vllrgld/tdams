import { Maximize2 } from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DocumentThumbnail from '@/pages/documents/components/document-thumbnail';
import { formatDate } from '@/pages/documents/lib/formatters';
import type { ArchivedDocument } from '@/pages/documents/types';
import BookCoverFace from '@/pages/manage/books/book-cover-face';
import type { BookCover, BookOrigin, CabinetBook } from '../data/cabinets';
import { useBookPortal } from './book-portal';
import {
    measureSlotPose,
    poseFromMatrix,
    type FlyerPose,
} from './book-world-pose';

const PAGE_W = 440;
const PAGE_H = 595;
const COVER_THICKNESS = 56;
const RISE = 210;
const OPEN: Transition = {
    duration: 0.85,
    delay: 0.7,
    ease: [0.4, 0, 0.2, 1],
};
const OPEN_AFTER_PICKUP: Transition = {
    duration: 0.85,
    ease: [0.4, 0, 0.2, 1],
};
const COVER_CLOSE: Transition = {
    duration: 0.45,
    ease: [0.4, 0, 0.2, 1],
};
const RISE_MOVE: Transition = {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1],
};
const TRAVEL_MOVE: Transition = {
    duration: 0.6,
    ease: [0.22, 1, 0.36, 1],
    transformOrigin: { duration: 0 },
};
const TRAVEL_YAW: Transition = {
    duration: 0.48,
    delay: 0.1,
    ease: [0.22, 1, 0.36, 1],
};
const RETURN_EASE = [0.22, 1, 0.36, 1] as const;
const RETURN_FIT_S = 0.32;
const RETURN_MOVE_S = 1;
const RETURN_PARK_AT = 0.7;
const INSERT_LIFT_RATIO = 1.4;
const INSTANT: Transition = { duration: 0 };
const RETURN_FIT: Transition = {
    duration: RETURN_FIT_S,
    ease: RETURN_EASE,
};
const RETURN_MOVE: Transition = {
    duration: RETURN_MOVE_S,
    ease: [0.4, 0, 0.2, 1],
    times: [0, RETURN_PARK_AT, 1],
    transformOrigin: INSTANT,
    width: RETURN_FIT,
    height: RETURN_FIT,
    ['--book-depth' as string]: RETURN_FIT,
    ['--cover-scale' as string]: RETURN_FIT,
};
const BACKDROP: Transition = {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1],
};
const FLIP: Transition = { duration: 0.7, ease: [0.4, 0, 0.2, 1] };
const FADE: Transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export type { BookOrigin };

export type OpenedBook = {
    book: CabinetBook;
    cabinetName: string;
    drawerLabel: string;
    cover: BookCover;
    origin: BookOrigin | null;
};

type BookPhase = 'rise' | 'travel' | 'open' | 'closing' | 'return' | 'drop';

const VOLUME_ORIGIN = '50% 50% calc(-0.5 * var(--book-depth, 0px))';

function risenPose(pose: FlyerPose): FlyerPose {
    const matrix = new DOMMatrix(pose.transform).translateSelf(0, -RISE);

    return poseFromMatrix(matrix, pose);
}

function standingPose(): FlyerPose {
    const width = COVER_THICKNESS;
    const height = PAGE_W;
    const depth = PAGE_H;
    const x = (window.innerWidth - width) / 2;
    const y = (window.innerHeight - height) / 2;
    const originX = width / 2;
    const originY = height / 2;
    const originZ = -depth / 2;
    const matrix = new DOMMatrix()
        .translateSelf(x, y)
        .translateSelf(originX, originY, originZ)
        .rotateSelf(0, 0, -90)
        .translateSelf(-originX, -originY, -originZ);

    return poseFromMatrix(matrix, {
        width,
        height,
        depth,
        rotateY: -90,
    });
}

function flyerOuterMotion(pose: FlyerPose) {
    return {
        width: pose.width,
        height: pose.height,
        transformOrigin: pose.origin,
        transform: pose.transform,
        ['--book-depth' as string]: `${pose.depth}px`,
        ['--cover-scale' as string]: Math.min(
            pose.height / PAGE_W,
            pose.depth / PAGE_H,
        ),
    };
}

function liftPose(pose: FlyerPose, lift: number): FlyerPose {
    const matrix = new DOMMatrix(pose.transform).translateSelf(0, -lift);

    return poseFromMatrix(matrix, pose);
}

function insertLift(height: number): number {
    return Math.round(height * INSERT_LIFT_RATIO);
}

function parkedAboveSlot(rest: FlyerPose): FlyerPose {
    return liftPose(rest, insertLift(rest.height));
}

function returnOuterMotion(
    to: FlyerPose,
    above: FlyerPose,
    fromTransform: string,
) {
    return {
        ...flyerOuterMotion(to),
        transform: [fromTransform, above.transform, to.transform],
    };
}

type FlyerOuterAnimate =
    | ReturnType<typeof flyerOuterMotion>
    | ReturnType<typeof returnOuterMotion>;

function isReturnOuterAnimate(definition: unknown): boolean {
    return Boolean(
        definition &&
        typeof definition === 'object' &&
        'transform' in definition &&
        Array.isArray((definition as { transform: unknown }).transform),
    );
}

const BookFlyer = memo(function BookFlyer({
    hover,
    outerAnimate,
    outerTransition,
    yawTransition,
    rotateY,
    flying,
    assignHost,
    onOuterComplete,
    onTransformUpdate,
}: {
    hover: FlyerPose | null;
    outerAnimate: FlyerOuterAnimate;
    outerTransition: Transition;
    yawTransition: Transition;
    rotateY: number;
    flying: boolean;
    assignHost: (node: HTMLDivElement | null) => void;
    onOuterComplete: (definition?: unknown) => void;
    onTransformUpdate: (transform: string) => void;
}) {
    return (
        <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-0"
            style={{
                transformStyle: 'preserve-3d',
                opacity: flying ? 1 : 0,
                visibility: flying ? 'visible' : 'hidden',
                willChange: flying ? 'transform' : 'auto',
            }}
            initial={hover ? flyerOuterMotion(hover) : false}
            animate={outerAnimate}
            transition={outerTransition}
            onUpdate={(latest) => {
                if (typeof latest.transform === 'string') {
                    onTransformUpdate(latest.transform);
                }
            }}
            onAnimationComplete={onOuterComplete}
        >
            <motion.div
                className="h-full w-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: VOLUME_ORIGIN,
                }}
                initial={hover ? { rotateY: hover.rotateY } : false}
                animate={{ rotateY }}
                transition={yawTransition}
            >
                <div
                    ref={assignHost}
                    data-book-flyer-host=""
                    className="h-full w-full"
                    style={{ transformStyle: 'preserve-3d' }}
                />
            </motion.div>
        </motion.div>
    );
});

function BookPage({
    document,
    eager = false,
}: {
    document: ArchivedDocument;
    eager?: boolean;
}) {
    return (
        <DocumentThumbnail
            mimeType={document.mimeType}
            url={document.viewUrl}
            title={document.originalFilename}
            pageNumber={1}
            fit="contain"
            fill
            quality="book"
            eager={eager}
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

function DocumentDetails({
    document,
    onOpenPrevious,
}: {
    document: ArchivedDocument;
    onOpenPrevious?: (number: string) => void;
}) {
    const title = document.taxDeclarationNumber || document.originalFilename;
    const showFilename = Boolean(document.taxDeclarationNumber);
    const previous = document.previousTaxDeclarationNumber;

    return (
        <div className="flex h-full flex-col justify-between p-6">
            <div className="space-y-4">
                <p className="text-lg font-semibold break-words text-neutral-900">
                    {title}
                </p>
                <div className="space-y-3">
                    {previous && onOpenPrevious ? (
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">
                                Previous declaration
                            </p>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenPrevious(previous);
                                }}
                                className="mt-0.5 text-left text-sm break-words text-blue-900 underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                                {previous}
                            </button>
                        </div>
                    ) : (
                        <DetailRow
                            label="Previous declaration"
                            value={previous}
                        />
                    )}
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

function EmptyDocuments({ loading }: { loading?: boolean }) {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-neutral-700">
                {loading
                    ? 'Loading documents…'
                    : 'Saved documents in this book will appear here.'}
            </p>
        </div>
    );
}

export default function OpenBook({
    opened,
    dimmed,
    initialDocumentId,
    onClose,
    onOpenDocument,
    onOpenPrevious,
    onInitialDocumentConsumed,
}: {
    opened: OpenedBook;
    dimmed?: boolean;
    initialDocumentId?: string | null;
    onClose: () => void;
    onOpenDocument: (document: ArchivedDocument) => void;
    onOpenPrevious?: (number: string) => void;
    onInitialDocumentConsumed?: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const portal = useBookPortal();
    const setHost = portal?.setHost;
    const getSlot = portal?.getSlot;
    const dialogRef = useRef<HTMLDivElement>(null);
    const consumedInitialRef = useRef(false);
    const initialDocumentIdRef = useRef(initialDocumentId);
    const onInitialDocumentConsumedRef = useRef(onInitialDocumentConsumed);
    const onCloseRef = useRef(onClose);
    initialDocumentIdRef.current = initialDocumentId;
    onInitialDocumentConsumedRef.current = onInitialDocumentConsumed;
    onCloseRef.current = onClose;
    const origin = opened.origin;
    const hasPickup = Boolean(origin) && reduceMotion !== true;
    const [hover] = useState(() => origin?.hover ?? null);
    const [rest, setRest] = useState(() => origin?.rest ?? null);
    const [above, setAbove] = useState(() =>
        origin?.rest ? parkedAboveSlot(origin.rest) : null,
    );
    const [risenHover] = useState(() =>
        origin?.hover ? risenPose(origin.hover) : null,
    );
    const [standing] = useState(() => (origin ? standingPose() : null));
    const [phase, setPhase] = useState<BookPhase>(hasPickup ? 'rise' : 'open');
    const phaseRef = useRef(phase);
    phaseRef.current = phase;
    const allowCompleteRef = useRef(true);
    const returnFromRef = useRef(hover?.transform ?? '');
    const [returnFrom, setReturnFrom] = useState(returnFromRef.current);

    const goToPhase = useCallback(
        (next: BookPhase) => {
            allowCompleteRef.current = false;

            if (next === 'open' && standing) {
                returnFromRef.current = standing.transform;
            }

            if (next === 'return' || next === 'drop') {
                setReturnFrom(returnFromRef.current);
                const slot = getSlot?.(opened.book.id);

                if (slot && origin) {
                    const restPose = measureSlotPose(slot, origin.rest.depth);

                    setRest(restPose);
                    setAbove(liftPose(restPose, insertLift(slot.offsetHeight)));
                }
            }

            phaseRef.current = next;
            setPhase(next);
            requestAnimationFrame(() => {
                allowCompleteRef.current = true;
            });
        },
        [standing, getSlot, opened.book.id, origin],
    );
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const lastIndex = Math.max(0, documents.length - 1);
    const [index, setIndex] = useState(0);
    const [flip, setFlip] = useState<'next' | 'prev' | null>(null);
    const current = documents[index] ?? null;
    const nextDoc = documents[index + 1] ?? null;
    const upcomingDoc = documents[index + 2] ?? null;
    const prevDoc = index > 0 ? (documents[index - 1] ?? null) : null;
    const prefetchDocs = [nextDoc, upcomingDoc, prevDoc].filter(
        (document): document is ArchivedDocument => document !== null,
    );
    const canInteract = phase === 'open';
    const flying =
        phase === 'rise' ||
        phase === 'travel' ||
        phase === 'closing' ||
        phase === 'return' ||
        phase === 'drop';
    const showSpread = !hasPickup || phase === 'open' || phase === 'closing';
    const canGoNext =
        canInteract && current !== null && index < lastIndex && !flip;
    const canGoPrev = canInteract && index > 0 && !flip;
    const coverOpen = 'rotateY(-158deg)';
    const coverClosed = 'rotateY(0deg)';
    const coverIsOpen = phase === 'open';
    const motionTransition = reduceMotion
        ? INSTANT
        : phase === 'closing'
          ? COVER_CLOSE
          : origin
            ? OPEN_AFTER_PICKUP
            : OPEN;
    const flipTransition = reduceMotion ? INSTANT : FLIP;
    const flyerAnimate =
        phase === 'rise'
            ? risenHover
            : phase === 'return' || phase === 'drop'
              ? rest
              : standing;
    const flyerTransition = reduceMotion
        ? INSTANT
        : phase === 'rise'
          ? RISE_MOVE
          : phase === 'return' || phase === 'drop'
            ? RETURN_MOVE
            : phase === 'travel'
              ? TRAVEL_MOVE
              : INSTANT;
    const flyerYawTransition = reduceMotion
        ? INSTANT
        : phase === 'return' || phase === 'drop'
          ? RETURN_FIT
          : phase === 'travel'
            ? TRAVEL_YAW
            : flyerTransition;
    const flyerOuterAnimate = useMemo(() => {
        if ((phase === 'return' || phase === 'drop') && rest && above) {
            return returnOuterMotion(rest, above, returnFrom);
        }

        return flyerAnimate ? flyerOuterMotion(flyerAnimate) : null;
    }, [phase, rest, above, returnFrom, flyerAnimate]);
    const assignFlyerHost = useCallback(
        (node: HTMLDivElement | null) => {
            setHost?.(node);
        },
        [setHost],
    );
    const handleFlyerComplete = useCallback(
        (definition?: unknown) => {
            if (!allowCompleteRef.current) {
                return;
            }

            const current = phaseRef.current;

            if (current === 'rise') {
                goToPhase('travel');
                return;
            }

            if (current === 'travel') {
                goToPhase('open');
                return;
            }

            if (current === 'return' || current === 'drop') {
                if (
                    definition !== undefined &&
                    !isReturnOuterAnimate(definition)
                ) {
                    return;
                }

                onCloseRef.current();
            }
        },
        [goToPhase],
    );
    const handleCoverComplete = useCallback(
        (definition?: unknown) => {
            if (!allowCompleteRef.current) {
                return;
            }

            if (phaseRef.current !== 'closing') {
                return;
            }

            const transform =
                definition &&
                typeof definition === 'object' &&
                'transform' in definition
                    ? (definition as { transform: unknown }).transform
                    : null;

            if (transform != null && transform !== coverClosed) {
                return;
            }

            goToPhase('return');
        },
        [coverClosed, goToPhase],
    );
    const onFlyerTransformUpdate = useCallback((transform: string) => {
        returnFromRef.current = transform;
    }, []);

    useEffect(() => {
        dialogRef.current?.focus({ preventScroll: true });
        consumedInitialRef.current = false;
        setIndex(0);
        setFlip(null);
        setDocuments([]);
        setLoading(true);

        const controller = new AbortController();

        fetch(`/archive/books/${opened.book.id}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Failed to load documents');
                }

                return (await response.json()) as {
                    documents: ArchivedDocument[];
                };
            })
            .then((data) => {
                const loaded = data.documents;
                setDocuments(loaded);
                setLoading(false);

                const pendingId = initialDocumentIdRef.current;

                if (consumedInitialRef.current || !pendingId) {
                    return;
                }

                const matchIndex = loaded.findIndex(
                    (document) => String(document.id) === pendingId,
                );

                if (matchIndex < 0) {
                    onInitialDocumentConsumedRef.current?.();
                    return;
                }

                consumedInitialRef.current = true;
                setIndex(matchIndex);
                onInitialDocumentConsumedRef.current?.();
            })
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setDocuments([]);
                setLoading(false);
            });

        return () => controller.abort();
    }, [opened.book.id]);

    function requestClose() {
        if (dimmed) {
            return;
        }

        if (reduceMotion || !opened.origin) {
            onCloseRef.current();
            return;
        }

        const currentPhase = phaseRef.current;

        if (
            currentPhase === 'closing' ||
            currentPhase === 'return' ||
            currentPhase === 'drop'
        ) {
            return;
        }

        if (currentPhase === 'open') {
            goToPhase('closing');
            return;
        }

        goToPhase('return');
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') {
                return;
            }

            requestClose();
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dimmed, opened.origin, reduceMotion]);

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

    function openPreviousDeclaration(number: string) {
        const matchIndex = documents.findIndex(
            (document) =>
                document.taxDeclarationNumber?.toLowerCase() ===
                number.toLowerCase(),
        );

        if (matchIndex >= 0) {
            setIndex(matchIndex);
            return;
        }

        onOpenPrevious?.(number);
    }

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-book-title"
            data-book-phase={phase}
            tabIndex={-1}
            ref={dialogRef}
            className={cn(
                'fixed inset-0 grid place-items-center outline-none',
                dimmed ? 'z-40' : 'z-[60]',
            )}
            style={{ perspective: '1200px' }}
            initial={hasPickup || reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
                hasPickup
                    ? { opacity: 0, transition: INSTANT }
                    : reduceMotion
                      ? undefined
                      : { opacity: 0 }
            }
            transition={reduceMotion || hasPickup ? INSTANT : FADE}
        >
            <motion.button
                type="button"
                aria-label="Close book"
                className="absolute inset-0 bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-300"
                initial={hasPickup ? { opacity: 0 } : false}
                animate={{
                    opacity:
                        phase === 'rise' ||
                        phase === 'return' ||
                        phase === 'drop'
                            ? 0
                            : 1,
                }}
                transition={
                    reduceMotion ? INSTANT : hasPickup ? BACKDROP : INSTANT
                }
                onClick={requestClose}
            />
            {hasPickup && origin && flyerAnimate && flyerOuterAnimate ? (
                <BookFlyer
                    hover={hover}
                    outerAnimate={flyerOuterAnimate}
                    outerTransition={flyerTransition}
                    yawTransition={flyerYawTransition}
                    rotateY={flyerAnimate.rotateY}
                    flying={flying}
                    assignHost={assignFlyerHost}
                    onOuterComplete={handleFlyerComplete}
                    onTransformUpdate={onFlyerTransformUpdate}
                />
            ) : null}
            {showSpread ? (
                <div
                    className="group/book relative z-10"
                    style={{
                        width: PAGE_W * 2,
                        height: PAGE_H,
                        perspective: '1540px',
                        transform: `translateX(-${PAGE_W / 2}px)`,
                    }}
                >
                    {prefetchDocs.length > 0 && (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute top-0 left-0 overflow-hidden opacity-0"
                            style={{ width: PAGE_W, height: PAGE_H }}
                        >
                            {prefetchDocs.map((document) => (
                                <div
                                    key={document.id}
                                    className="absolute inset-0"
                                >
                                    <BookPage document={document} eager />
                                </div>
                            ))}
                        </div>
                    )}
                    {current && canInteract && (
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
                            perspective: '1540px',
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
                                    <BookPage
                                        key={current.id}
                                        document={current}
                                        eager
                                    />
                                </button>
                            ) : (
                                <EmptyDocuments loading={loading} />
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
                                    <BookPage
                                        key={current.id}
                                        document={current}
                                        eager
                                    />
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
                                        onOpenPrevious={openPreviousDeclaration}
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
                                reduceMotion
                                    ? false
                                    : { transform: coverClosed }
                            }
                            animate={{
                                transform: coverIsOpen
                                    ? coverOpen
                                    : coverClosed,
                            }}
                            transition={motionTransition}
                            onAnimationComplete={handleCoverComplete}
                        >
                            <div
                                className={cn(
                                    'absolute inset-0 overflow-hidden border border-black/25 shadow-lg',
                                    opened.cover.cover,
                                    opened.cover.text,
                                )}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(1px)',
                                }}
                            >
                                <BookCoverFace title={opened.book.coverTitle} />
                            </div>
                            <div
                                id="open-book-title"
                                role={canGoPrev ? 'button' : undefined}
                                tabIndex={canGoPrev ? 0 : undefined}
                                onClick={canGoPrev ? goPrev : undefined}
                                onKeyDown={(event) => {
                                    if (
                                        !canGoPrev ||
                                        (event.key !== 'Enter' &&
                                            event.key !== ' ')
                                    ) {
                                        return;
                                    }

                                    event.preventDefault();
                                    goPrev();
                                }}
                                aria-label={
                                    prevDoc
                                        ? `Previous page, ${prevDoc.originalFilename}`
                                        : opened.book.label
                                }
                                className={cn(
                                    'absolute inset-0 overflow-hidden border border-neutral-300 bg-amber-50 text-left dark:border-neutral-400 dark:bg-amber-100',
                                    canGoPrev
                                        ? 'cursor-pointer'
                                        : 'cursor-default',
                                )}
                                style={{
                                    transform:
                                        'rotateY(180deg) translateZ(1px)',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                {current ? (
                                    <DocumentDetails
                                        key={current.id}
                                        document={current}
                                        onOpenPrevious={openPreviousDeclaration}
                                    />
                                ) : null}
                            </div>
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
                                    <BookPage
                                        key={prevDoc.id}
                                        document={prevDoc}
                                        eager
                                    />
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
                                        onOpenPrevious={openPreviousDeclaration}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            ) : null}
            {canInteract ? (
                <p className="pointer-events-none absolute bottom-8 z-10 text-center text-xs text-neutral-300">
                    {loading
                        ? 'Loading documents…'
                        : documents.length > 0
                          ? `${index + 1} / ${documents.length} · click a page to flip · Esc to close`
                          : 'Esc or click outside to close'}
                </p>
            ) : null}
        </motion.div>
    );
}
