import { Maximize2 } from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArchivedDocument } from '@/pages/documents/types';
import BookCoverFace from '@/pages/manage/books/book-cover-face';
import { useBookPortal } from '../shared/book-portal';
import type { FilingItemViewerProps } from '../shared/filing-item-types';
import {
    FADE_PICKUP_HOLD_MS,
    useFilingItemTransition,
} from '../shared/use-filing-item-transition';
import {
    BookPage,
    DocumentDetails,
    EmptyDocuments,
    FILING_PAGE_HEIGHT,
} from '../shared/filing-document-content';
import {
    measureSlotPose,
    poseFromMatrix,
    type FlyerPose,
} from '../shared/book-world-pose';

const PAGE_W = 440;
const PAGE_H = FILING_PAGE_HEIGHT;
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
const RETURN_MOVE_S = 0.7;
const INSERT_LIFT_RATIO = 1.4;
const INSTANT: Transition = { duration: 0 };
const RETURN_FIT: Transition = {
    duration: RETURN_FIT_S,
    ease: RETURN_EASE,
};
const RETURN_MOVE: Transition = {
    duration: RETURN_MOVE_S,
    ease: [0.4, 0, 0.2, 1],
    transformOrigin: INSTANT,
    width: RETURN_FIT,
    height: RETURN_FIT,
    ['--book-depth' as string]: RETURN_FIT,
    ['--cover-scale' as string]: RETURN_FIT,
};
const INSERT_MOVE: Transition = {
    duration: 0.38,
    ease: [0.4, 0, 0.2, 1],
};
const BACKDROP: Transition = {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1],
};
const FLIP: Transition = { duration: 0.7, ease: [0.4, 0, 0.2, 1] };
const FADE: Transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

type BookPhase =
    | 'appearing'
    | 'rise'
    | 'travel'
    | 'open'
    | 'closing'
    | 'return'
    | 'drop';

// Leave room beyond the normal tween for a delayed completion callback.
const PHASE_RECOVERY_MS: Record<Exclude<BookPhase, 'open'>, number> = {
    appearing: FADE_PICKUP_HOLD_MS,
    rise: 1000,
    travel: 1200,
    closing: 1000,
    return: 1800,
    drop: 1800,
};

const VOLUME_ORIGIN = '50% 50% calc(-0.5 * var(--book-depth, 0px))';

function risenPose(pose: FlyerPose): FlyerPose {
    return liftPose(pose, insertLift(pose.height));
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
    return Math.max(RISE, Math.round(height * INSERT_LIFT_RATIO));
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
        // Stop above the drawer. Insertion happens in its own 3D scene.
        transform: [fromTransform, above.transform],
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
    initialPose,
    drawerSlot,
    outerAnimate,
    outerTransition,
    yawTransition,
    rotateY,
    flying,
    assignHost,
    onOuterComplete,
    onTransformUpdate,
}: {
    initialPose: FlyerPose | null;
    drawerSlot: HTMLElement | null;
    outerAnimate: FlyerOuterAnimate;
    outerTransition: Transition;
    yawTransition: Transition;
    rotateY: number;
    flying: boolean;
    assignHost: (node: HTMLDivElement | null) => void;
    onOuterComplete: (definition?: unknown) => void;
    onTransformUpdate: (transform: string) => void;
}) {
    const flyerRef = useRef<HTMLDivElement>(null);
    const completionFrame = useRef<number | null>(null);
    const latestAnimate = useRef(outerAnimate);
    latestAnimate.current = outerAnimate;
    useEffect(
        () => () => {
            if (completionFrame.current !== null) {
                cancelAnimationFrame(completionFrame.current);
            }
        },
        [],
    );
    const drawerFrame = useMemo(
        () =>
            drawerSlot
                ? new DOMMatrix(
                      measureSlotPose(drawerSlot, initialPose?.depth ?? 0)
                          .transform,
                  )
                : null,
        [drawerSlot, initialPose],
    );
    const inverseFrame = drawerFrame?.inverse();
    const toLocal = (transform: string) => {
        if (!inverseFrame) return transform;
        const matrix = inverseFrame.multiply(new DOMMatrix(transform));
        // Inverting matrices leaves near-zero values in scientific notation,
        // which Motion can mistake for units while interpolating the string.
        return `matrix3d(${Array.from(matrix.toFloat64Array(), (value) =>
            value.toFixed(8),
        ).join(', ')})`;
    };
    const localTransform = Array.isArray(outerAnimate.transform)
        ? outerAnimate.transform.map(toLocal)
        : toLocal(outerAnimate.transform);
    const flyer = (
        <motion.div
            ref={flyerRef}
            aria-hidden="true"
            data-book-flight-space={drawerSlot ? 'drawer' : 'overlay'}
            className="pointer-events-none absolute top-0 left-0"
            style={{
                transformStyle: 'preserve-3d',
                opacity: flying ? 1 : 0,
                visibility: flying ? 'visible' : 'hidden',
                willChange: flying ? 'transform' : 'auto',
            }}
            initial={
                initialPose
                    ? {
                          ...flyerOuterMotion(initialPose),
                          transform: toLocal(initialPose.transform),
                      }
                    : false
            }
            animate={{ ...outerAnimate, transform: localTransform }}
            transition={outerTransition}
            onUpdate={(latest) => {
                if (typeof latest.transform === 'string') {
                    onTransformUpdate(
                        drawerFrame
                            ? drawerFrame
                                  .multiply(new DOMMatrix(latest.transform))
                                  .toString()
                            : latest.transform,
                    );
                }
            }}
            onAnimationComplete={(definition) => {
                // Ignore completion from an interrupted target, and report the
                // world-space target regardless of the flyer's current parent.
                if (
                    typeof definition === 'object' &&
                    'transform' in definition &&
                    JSON.stringify(definition.transform) ===
                        JSON.stringify(localTransform)
                ) {
                    // Motion completes before its final style write. Measure
                    // on the next frame so changing parents preserves that pose.
                    completionFrame.current = requestAnimationFrame(() => {
                        completionFrame.current = null;
                        if (latestAnimate.current !== outerAnimate) return;
                        if (flyerRef.current) {
                            onTransformUpdate(
                                measureSlotPose(
                                    flyerRef.current,
                                    initialPose?.depth ?? 0,
                                ).transform,
                            );
                        }
                        onOuterComplete(outerAnimate);
                    });
                }
            }}
        >
            <motion.div
                className="h-full w-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: VOLUME_ORIGIN,
                }}
                initial={initialPose ? { rotateY: initialPose.rotateY } : false}
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

    return drawerSlot ? createPortal(flyer, drawerSlot) : flyer;
});

export default function OpenBook({
    opened,
    dimmed,
    initialDocumentId,
    onClose,
    onOpenDocument,
    onOpenPrevious,
    onInitialDocumentConsumed,
}: FilingItemViewerProps) {
    const reduceMotion = useReducedMotion();
    const portal = useBookPortal();
    const setHost = portal?.setHost;
    const getSlot = portal?.getSlot;
    const dialogRef = useRef<HTMLDivElement>(null);
    const animation = useFilingItemTransition({
        kind: 'book',
        dialogRef,
        onClose,
        getActor: () =>
            portal?.host?.closest<HTMLElement>('[data-book-flight-space]') ??
            null,
    });
    const fadePickup = animation.pickup === 'fade';
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
    const [phase, setPhase] = useState<BookPhase>(
        reduceMotion
            ? 'open'
            : fadePickup
              ? 'appearing'
              : hasPickup
                ? 'rise'
                : 'open',
    );
    const phaseRef = useRef(phase);
    phaseRef.current = phase;
    const returnFromRef = useRef(hover?.transform ?? '');
    const [returnFrom, setReturnFrom] = useState(returnFromRef.current);
    const [handoffPose, setHandoffPose] = useState(hover);

    const goToPhase = useCallback(
        (next: BookPhase) => {
            if (next === 'travel' && origin) {
                setHandoffPose(
                    poseFromMatrix(
                        new DOMMatrix(returnFromRef.current),
                        origin.hover,
                    ),
                );
            }
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
                    if (next === 'drop') {
                        setHandoffPose(
                            poseFromMatrix(
                                new DOMMatrix(returnFromRef.current),
                                restPose,
                            ),
                        );
                    }
                }
            }

            phaseRef.current = next;
            setPhase(next);
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
    const canInteract = phase === 'open' && !animation.fadingOut;
    const insideDrawer = phase === 'rise' || phase === 'drop';
    const flying =
        phase === 'rise' ||
        phase === 'travel' ||
        phase === 'closing' ||
        phase === 'return' ||
        phase === 'drop';
    const showSpread =
        !hasPickup ||
        phase === 'appearing' ||
        phase === 'open' ||
        phase === 'closing';
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
          : origin || fadePickup
            ? OPEN_AFTER_PICKUP
            : OPEN;
    const flipTransition = reduceMotion ? INSTANT : FLIP;
    const flyerAnimate =
        phase === 'rise'
            ? risenHover
            : phase === 'return'
              ? above
              : phase === 'drop'
                ? rest
                : standing;
    const flyerTransition = reduceMotion
        ? INSTANT
        : phase === 'rise'
          ? RISE_MOVE
          : phase === 'drop'
            ? INSERT_MOVE
            : phase === 'return'
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
        if (phase === 'return' && rest && above) {
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
            if (animation.fadingOutRef.current) return;
            const current = phaseRef.current;
            const transform =
                definition &&
                typeof definition === 'object' &&
                'transform' in definition
                    ? definition.transform
                    : null;

            if (current === 'rise' && transform === risenHover?.transform) {
                goToPhase('travel');
                return;
            }

            if (current === 'travel' && transform === standing?.transform) {
                goToPhase('open');
                return;
            }

            if (current === 'return') {
                if (
                    definition !== undefined &&
                    !isReturnOuterAnimate(definition)
                ) {
                    return;
                }

                goToPhase('drop');
            } else if (current === 'drop' && transform === rest?.transform) {
                onCloseRef.current();
            }
        },
        [goToPhase, risenHover, standing, rest, animation.fadingOutRef],
    );
    const handleCoverComplete = useCallback(
        (definition?: unknown) => {
            if (animation.fadingOutRef.current) return;
            if (phaseRef.current !== 'closing') {
                return;
            }

            const transform =
                definition &&
                typeof definition === 'object' &&
                'transform' in definition
                    ? (definition as { transform: unknown }).transform
                    : null;

            if (transform !== coverClosed) {
                return;
            }

            goToPhase('return');
        },
        [coverClosed, goToPhase, animation.fadingOutRef],
    );
    const onFlyerTransformUpdate = useCallback((transform: string) => {
        returnFromRef.current = transform;
    }, []);

    useEffect(() => {
        if (
            (!hasPickup && phase !== 'appearing') ||
            phase === 'open' ||
            animation.fadingOut
        ) {
            return;
        }

        // Interrupted/no-op animations may not deliver a completion event.
        // Recover only the phase that scheduled this timer; never skip a newer one.
        const timeout = window.setTimeout(() => {
            if (phaseRef.current !== phase || animation.fadingOutRef.current) {
                return;
            }

            if (phase === 'appearing') {
                goToPhase('open');
            } else if (phase === 'rise') {
                goToPhase('travel');
            } else if (phase === 'travel') {
                goToPhase('open');
            } else if (phase === 'closing') {
                goToPhase('return');
            } else if (phase === 'return') {
                goToPhase('drop');
            } else {
                onCloseRef.current();
            }
        }, PHASE_RECOVERY_MS[phase]);

        return () => window.clearTimeout(timeout);
    }, [
        goToPhase,
        hasPickup,
        phase,
        animation.fadingOut,
        animation.fadingOutRef,
    ]);

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
        if (dimmed || animation.fadingOutRef.current) {
            return;
        }

        if (animation.returnAnimation === 'fade' || !origin) {
            setFlip(null);
            animation.closeWithFade();
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
            setFlip(null);
            goToPhase('closing');
            return;
        }

        goToPhase(currentPhase === 'rise' ? 'drop' : 'return');
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
    }, [
        dimmed,
        opened.origin,
        reduceMotion,
        animation.returnAnimation,
        animation.closeWithFade,
    ]);

    function finishFlip(direction: 'next' | 'prev') {
        if (phaseRef.current !== 'open') {
            setFlip(null);
            return;
        }

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
            data-pickup-animation={animation.pickup}
            data-return-animation={animation.returnAnimation}
            data-fading-out={animation.fadingOut || undefined}
            inert={animation.fadingOut || dimmed || undefined}
            tabIndex={-1}
            ref={dialogRef}
            className={cn(
                'fixed inset-0 grid place-items-center outline-none',
                dimmed ? 'z-40' : 'z-[60]',
            )}
            style={{ perspective: '1200px' }}
            initial={
                fadePickup
                    ? { opacity: 0 }
                    : hasPickup || reduceMotion
                      ? false
                      : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            exit={
                hasPickup || animation.fadingOut
                    ? { opacity: 0, transition: INSTANT }
                    : reduceMotion
                      ? undefined
                      : { opacity: 0 }
            }
            transition={
                fadePickup
                    ? { duration: animation.duration }
                    : reduceMotion || hasPickup
                      ? INSTANT
                      : FADE
            }
        >
            <motion.button
                type="button"
                aria-label="Close book"
                className={cn(
                    'absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-300',
                    insideDrawer ? 'bg-transparent' : 'bg-black/70',
                )}
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
                    initialPose={phase === 'rise' ? hover : handoffPose}
                    drawerSlot={
                        insideDrawer
                            ? (getSlot?.(opened.book.id) ?? null)
                            : null
                    }
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
                    inert={!canInteract || undefined}
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
                            data-folder-paper
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
                            data-folder-leaf
                            className="absolute inset-0"
                            style={{
                                transformOrigin: 'left center',
                                transformStyle: 'preserve-3d',
                            }}
                            initial={
                                reduceMotion || fadePickup
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
