import { show as showFilingItem } from '@/routes/archive/books';
import { Maximize2, X } from 'lucide-react';
import {
    motion,
    useReducedMotion,
    type MotionValue,
    type Transition,
} from 'motion/react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArchivedDocument } from '@/types/documents';
import { useFilingItemPortal } from '../shared/filing-item-portal';
import {
    measureSlotPose,
    poseFromMatrix,
    translatePose,
    type FilingItemPose,
} from '../shared/filing-item-pose';
import ClosedFolderMesh, { FOLDER_ASPECT_RATIO } from './closed-folder-mesh';
import FolderActor from './folder-actor';
import {
    FilingDocumentPage,
    DocumentDetails,
    EmptyDocuments,
    FILING_PAGE_HEIGHT,
} from '../shared/filing-document-content';
import type { FilingItemViewerProps } from '../shared/filing-item-types';
import {
    FADE_PICKUP_HOLD_MS,
    useFilingItemTransition,
} from '../shared/use-filing-item-transition';

type Phase =
    | 'appearing'
    | 'rise'
    | 'travel'
    | 'opening'
    | 'open'
    | 'closing'
    | 'align'
    | 'return'
    | 'insert';
const EASE = [0.22, 1, 0.36, 1] as const;
const INSTANT: Transition = { duration: 0 };
const COVER_OPEN: Transition = { duration: 0.85, ease: [0.4, 0, 0.2, 1] };
const COVER_CLOSE: Transition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] };
const PAGE_FLIP: Transition = { duration: 0.7, ease: [0.4, 0, 0.2, 1] };
const PICKUP_RISE = 210;
const INSERT_LIFT_RATIO = 1.4;
const PHASE_RECOVERY_MS: Record<Exclude<Phase, 'open'>, number> = {
    appearing: FADE_PICKUP_HOLD_MS,
    rise: 1100,
    travel: 1300,
    opening: 1500,
    closing: 1100,
    align: 900,
    return: 1500,
    insert: 1100,
};
type PageBounds = { left: number; top: number; width: number; height: number };

function screenBounds(element: Element | null | undefined): PageBounds | null {
    if (!element) return null;
    const { left, top, width, height } = element.getBoundingClientRect();
    return { left, top, width, height };
}

function lift(pose: FilingItemPose, distance: number): FilingItemPose {
    return poseFromMatrix(
        new DOMMatrix(pose.transform).translateSelf(0, -distance),
        pose,
    );
}

/** Turn back to the slot's angle around the folder's current center. */
function alignForReturn(
    rest: FilingItemPose,
    fromTransform: string,
): FilingItemPose {
    const from = new DOMMatrix(fromTransform);
    const target = new DOMMatrix(rest.transform);
    const center = new DOMPoint(
        rest.width / 2,
        rest.height / 2,
        -rest.depth / 2,
    );
    const currentCenter = center.matrixTransform(from);
    const targetCenter = center.matrixTransform(target);
    target.m41 += currentCenter.x - targetCenter.x;
    target.m42 += currentCenter.y - targetCenter.y;
    target.m43 += currentCenter.z - targetCenter.z;
    return poseFromMatrix(target, rest);
}

/** The folder keeps its drawer dimensions; only its world pose changes. */
function presentationPose(
    size: Pick<FilingItemPose, 'width' | 'height' | 'depth'>,
    viewport: { width: number; height: number },
    opened: boolean,
): FilingItemPose {
    const narrow = viewport.width < 960;
    const availableHeight = viewport.height - (narrow ? 256 : 136);
    const scale = Math.max(
        0.1,
        Math.min(
            // Bring the A4 paper width closer to the book's wider page.
            (FILING_PAGE_HEIGHT * 1.06) / (size.width * 0.98),
            (viewport.width - 48) / (size.height * 2.3),
            availableHeight / size.width,
        ),
    );
    // Prefer the paper centered on wide screens. On smaller screens, center
    // the whole spread so the left page and its navigation remain reachable.
    const centerX =
        size.height * (opened ? (viewport.width < 1400 ? 0 : 0.49) : 0.54);
    const preferredX = viewport.width / 2 - centerX * scale;
    // The angled cover projects beyond its flat width as the spread grows.
    const x = opened
        ? Math.max(preferredX, 24 + size.height * scale * 1.2)
        : preferredX;
    const y = (viewport.height - size.width * scale) / 2;
    const matrix = new DOMMatrix()
        .translateSelf(x + size.height * scale, y)
        .scaleSelf(scale)
        .rotateSelf(0, 0, 90);

    return poseFromMatrix(matrix, { ...size, rotateY: 0 });
}

function PortraitContent({
    width,
    height,
    children,
}: {
    width: number;
    height: number;
    children: ReactNode;
}) {
    return (
        <div
            className="absolute top-1/2 left-1/2 overflow-hidden"
            style={{
                width: height,
                height: width,
                transform: 'translate(-50%, -50%) rotate(-90deg)',
            }}
        >
            {children}
        </div>
    );
}

export default function OpenFolder({
    opened,
    dimmed,
    initialDocumentId,
    onClose,
    onOpenDocument,
    onOpenPrevious,
    onInitialDocumentConsumed,
}: FilingItemViewerProps) {
    const reduceMotion = useReducedMotion();
    const portal = useFilingItemPortal();
    const dialogRef = useRef<HTMLDivElement>(null);
    const actorRef = useRef<HTMLDivElement>(null);
    const animation = useFilingItemTransition({
        kind: 'folder',
        dialogRef,
        onClose: () => finishClose(),
        getActor: () => actorRef.current,
    });
    const fadePickup = animation.pickup === 'fade';
    const origin = opened.origin;
    const [size] = useState(
        () =>
            origin?.rest ?? {
                width: 594,
                height: 594 / FOLDER_ASPECT_RATIO,
                depth: 14,
            },
    );
    const [viewport, setViewport] = useState(() => ({
        width: typeof window === 'undefined' ? 1440 : window.innerWidth,
        height: typeof window === 'undefined' ? 900 : window.innerHeight,
    }));
    const [phase, setPhase] = useState<Phase>(() =>
        reduceMotion
            ? 'open'
            : fadePickup
              ? 'appearing'
              : origin
                ? 'rise'
                : 'opening',
    );
    const phaseRef = useRef(phase);
    const [returnPose, setReturnPose] = useState(origin?.rest ?? null);
    const [returnAlignment, setReturnAlignment] =
        useState<FilingItemPose | null>(null);
    const actorMotion = useRef<MotionValue<string> | null>(null);
    const [handoffPose, setHandoffPose] = useState(
        fadePickup ? null : (origin?.hover ?? null),
    );
    const [paperBounds, setPaperBounds] = useState<PageBounds | null>(null);
    const [coverBounds, setCoverBounds] = useState<PageBounds | null>(null);
    const [previousBounds, setPreviousBounds] = useState<PageBounds | null>(
        null,
    );
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [index, setIndex] = useState(0);
    const [flip, setFlip] = useState<'next' | 'prev' | null>(null);
    const flipRef = useRef(flip);
    flipRef.current = flip;
    const callbacks = useRef({
        onClose,
        onOpenDocument,
        onOpenPrevious,
        onInitialDocumentConsumed,
        initialDocumentId,
        dimmed,
    });
    callbacks.current = {
        onClose,
        onOpenDocument,
        onOpenPrevious,
        onInitialDocumentConsumed,
        initialDocumentId,
        dimmed,
    };
    const consumedInitial = useRef(false);
    const closeCompleted = useRef(false);
    const current = documents[index] ?? null;
    const nextDocument = documents[index + 1] ?? null;
    const previousDocument = documents[index - 1] ?? null;
    const prefetchDocuments = [nextDocument, previousDocument].filter(
        (document): document is ArchivedDocument => document !== null,
    );
    const canInteract = phase === 'open' && !dimmed && !animation.fadingOut;
    const canGoNext = canInteract && Boolean(nextDocument) && !flip;
    const canGoPrevious = canInteract && Boolean(previousDocument) && !flip;
    const finishFlip = useCallback(
        (direction: 'next' | 'prev') => {
            if (phaseRef.current !== 'open' || flipRef.current !== direction)
                return;
            setIndex((value) =>
                direction === 'next'
                    ? Math.min(documents.length - 1, value + 1)
                    : Math.max(0, value - 1),
            );
            flipRef.current = null;
            setFlip(null);
        },
        [documents.length],
    );
    const turnPage = (direction: 'next' | 'prev') => {
        if (
            !canInteract ||
            flipRef.current ||
            (direction === 'next' ? !nextDocument : !previousDocument)
        )
            return;
        flipRef.current = direction;
        if (reduceMotion) finishFlip(direction);
        else setFlip(direction);
    };
    const openPreviousDeclaration = (number: string) => {
        const match = documents.findIndex(
            (document) =>
                document.taxDeclarationNumber?.toLowerCase() ===
                number.toLowerCase(),
        );
        flipRef.current = null;
        setFlip(null);
        if (match >= 0) setIndex(match);
        else onOpenPrevious?.(number);
    };
    const insideDrawer =
        Boolean(origin) && (phase === 'rise' || phase === 'insert');
    const drawerSlot = insideDrawer
        ? (portal?.getSlot(opened.item.id) ?? null)
        : null;
    const centered = presentationPose(size, viewport, false);
    const spread = presentationPose(size, viewport, true);
    const pickupRise = Math.max(PICKUP_RISE, size.height * INSERT_LIFT_RATIO);
    const coverOpen = phase === 'opening' || phase === 'open';
    const measurePaper = useCallback(() => {
        const actor = actorRef.current;
        setPaperBounds(
            screenBounds(actor?.querySelector('[data-folder-paper]')),
        );
        setCoverBounds(
            screenBounds(actor?.querySelector('[data-folder-inside-cover]')),
        );
        setPreviousBounds(
            screenBounds(
                actor?.querySelector('[data-folder-inside-cover] button'),
            ),
        );
    }, []);

    useEffect(() => {
        if (phase !== 'open') {
            setPaperBounds(null);
            setCoverBounds(null);
            setPreviousBounds(null);
            return;
        }
        const frame = requestAnimationFrame(measurePaper);
        return () => cancelAnimationFrame(frame);
    }, [
        phase,
        index,
        documents,
        measurePaper,
        viewport.width,
        viewport.height,
    ]);

    const changePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const finishClose = useCallback(() => {
        if (closeCompleted.current) return;
        closeCompleted.current = true;
        const slot = portal?.getSlot(opened.item.id);
        callbacks.current.onClose();
        requestAnimationFrame(() => {
            if (!document.querySelector('[role="dialog"]')) slot?.focus();
        });
    }, [portal, opened.item.id]);

    const startInsertion = useCallback(() => {
        if (!origin || reduceMotion) {
            finishClose();
            return;
        }
        const slot = portal?.getSlot(opened.item.id);
        const rest = slot
            ? measureSlotPose(slot, origin.rest.depth)
            : origin.rest;
        actorMotion.current?.stop();
        setReturnPose(rest);
        setHandoffPose(
            actorRef.current
                ? measureSlotPose(actorRef.current, size.depth)
                : rest,
        );
        changePhase('insert');
    }, [
        origin,
        reduceMotion,
        finishClose,
        portal,
        opened.item.id,
        size.depth,
        changePhase,
    ]);

    const startReturn = useCallback(() => {
        if (!origin || reduceMotion) {
            finishClose();
            return;
        }
        const slot = portal?.getSlot(opened.item.id);
        const rest = slot
            ? measureSlotPose(slot, origin.rest.depth)
            : origin.rest;
        actorMotion.current?.stop();
        const currentPose = actorRef.current
            ? measureSlotPose(actorRef.current, size.depth)
            : centered;
        setReturnPose(rest);
        setReturnAlignment(alignForReturn(rest, currentPose.transform));
        changePhase('align');
    }, [
        origin,
        reduceMotion,
        portal,
        opened.item.id,
        centered.transform,
        changePhase,
        finishClose,
        size.depth,
    ]);

    const requestClose = useCallback(() => {
        if (callbacks.current.dimmed || animation.fadingOutRef.current) return;
        flipRef.current = null;
        setFlip(null);
        const active = phaseRef.current;
        if (
            active === 'closing' ||
            active === 'align' ||
            active === 'return' ||
            active === 'insert'
        )
            return;
        if (animation.returnAnimation === 'fade') {
            actorMotion.current?.stop();
            animation.closeWithFade();
        } else if (reduceMotion) {
            finishClose();
        } else if (active === 'rise') {
            startInsertion();
        } else if (active === 'open' || active === 'opening') {
            changePhase('closing');
        } else {
            startReturn();
        }
    }, [
        reduceMotion,
        changePhase,
        startReturn,
        startInsertion,
        finishClose,
        animation.returnAnimation,
        animation.closeWithFade,
        animation.fadingOutRef,
    ]);

    useEffect(() => {
        dialogRef.current?.focus({ preventScroll: true });
        const resize = () => {
            setPaperBounds(null);
            setCoverBounds(null);
            setPreviousBounds(null);
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(false);
        fetch(showFilingItem.url(Number(opened.item.id)), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error('Failed to load folder documents');
                return (await response.json()) as {
                    documents: ArchivedDocument[];
                };
            })
            .then((data) => {
                if (controller.signal.aborted) return;
                setDocuments(data.documents);
                const pending = callbacks.current.initialDocumentId;
                if (pending && !consumedInitial.current) {
                    consumedInitial.current = true;
                    const match = data.documents.findIndex(
                        (document) => String(document.id) === pending,
                    );
                    if (match >= 0) setIndex(match);
                    callbacks.current.onInitialDocumentConsumed?.();
                }
                setLoading(false);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setLoadError(true);
                setLoading(false);
            });
        return () => controller.abort();
    }, [opened.item.id, attempt]);

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (callbacks.current.dimmed) return;
            if (event.key === 'Tab') {
                const controls = Array.from(
                    dialogRef.current?.querySelectorAll<HTMLElement>(
                        'button:not(:disabled), a[href], [tabindex="0"]',
                    ) ?? [],
                ).filter(
                    (control) =>
                        !control.closest('[inert]') &&
                        control.getClientRects().length > 0,
                );
                const first = controls[0];
                const last = controls.at(-1);
                if (
                    event.shiftKey &&
                    (document.activeElement === first ||
                        document.activeElement === dialogRef.current)
                ) {
                    event.preventDefault();
                    last?.focus();
                } else if (
                    !event.shiftKey &&
                    (document.activeElement === last ||
                        document.activeElement === dialogRef.current)
                ) {
                    event.preventDefault();
                    first?.focus();
                }
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                requestClose();
            }
        };
        window.addEventListener('keydown', keydown);
        return () => window.removeEventListener('keydown', keydown);
    }, [requestClose]);

    const onActorComplete = (completedPhase: Phase) => {
        if (animation.fadingOutRef.current) return;
        const active = phaseRef.current;
        if (active !== completedPhase) return;
        if (active === 'rise') {
            setHandoffPose(
                actorRef.current
                    ? measureSlotPose(actorRef.current, size.depth)
                    : lift(origin!.hover, pickupRise),
            );
            changePhase('travel');
        } else if (active === 'travel') changePhase('opening');
        else if (active === 'align') changePhase('return');
        else if (active === 'return') startInsertion();
        else if (active === 'insert') finishClose();
        else if (active === 'open') measurePaper();
    };
    const onCoverComplete = () => {
        if (animation.fadingOutRef.current) return;
        if (phaseRef.current === 'opening') changePhase('open');
        else if (phaseRef.current === 'closing') startReturn();
    };
    const completePhase = useRef(onActorComplete);
    completePhase.current = onActorComplete;

    useEffect(() => {
        if (phase === 'open' || reduceMotion || animation.fadingOut) return;
        const timer = window.setTimeout(() => {
            if (phaseRef.current !== phase || animation.fadingOutRef.current)
                return;
            if (phase === 'appearing') changePhase('opening');
            else if (phase === 'opening') changePhase('open');
            else if (phase === 'closing') startReturn();
            else completePhase.current(phase);
        }, PHASE_RECOVERY_MS[phase]);
        return () => window.clearTimeout(timer);
    }, [
        phase,
        reduceMotion,
        changePhase,
        startReturn,
        animation.fadingOut,
        animation.fadingOutRef,
    ]);

    const pose =
        phase === 'appearing'
            ? centered
            : phase === 'rise' && origin
              ? lift(origin.hover, pickupRise)
              : phase === 'travel'
                ? centered
                : phase === 'align' && returnAlignment
                  ? returnAlignment
                  : phase === 'return' && returnPose
                    ? lift(returnPose, returnPose.height * INSERT_LIFT_RATIO)
                    : phase === 'insert' && returnPose
                      ? returnPose
                      : spread;
    const actorTransition: Transition =
        reduceMotion ||
        phase === 'appearing' ||
        (fadePickup && phase === 'open')
            ? INSTANT
            : phase === 'rise'
              ? { duration: 0.42, ease: EASE }
              : phase === 'travel'
                ? { duration: 0.6, ease: EASE, times: [0, 0.78, 1] }
                : phase === 'align'
                  ? { duration: 0.32, ease: EASE }
                  : phase === 'return'
                    ? { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                    : phase === 'insert'
                      ? { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
                      : { duration: 0.55, ease: EASE };
    const transform =
        phase === 'travel' && origin
            ? [
                  handoffPose?.transform ??
                      lift(origin.hover, pickupRise).transform,
                  translatePose(centered, 0, -12).transform,
                  centered.transform,
              ]
            : pose.transform;
    const coverTransition =
        reduceMotion || phase === 'appearing'
            ? INSTANT
            : phase === 'closing'
              ? COVER_CLOSE
              : COVER_OPEN;

    return (
        <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-folder-title"
            aria-hidden={dimmed || undefined}
            inert={dimmed || animation.fadingOut || undefined}
            data-folder-phase={phase}
            data-pickup-animation={animation.pickup}
            data-return-animation={animation.returnAnimation}
            data-fading-out={animation.fadingOut || undefined}
            tabIndex={-1}
            className={cn(
                'fixed inset-0 overflow-hidden outline-none',
                dimmed ? 'z-40' : 'z-[60]',
            )}
            style={{ perspective: '1200px' }}
            initial={fadePickup ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: animation.duration }}
        >
            <motion.button
                type="button"
                aria-label="Dismiss folder by clicking outside"
                className={cn(
                    'absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-300',
                    insideDrawer ? 'bg-transparent' : 'bg-black/70',
                )}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{
                    opacity: insideDrawer || phase === 'return' ? 0 : 1,
                }}
                transition={
                    reduceMotion ? INSTANT : { duration: 0.4, ease: EASE }
                }
                onClick={requestClose}
            />
            <h2 id="open-folder-title" className="sr-only">
                {opened.item.label}
            </h2>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute size-px overflow-hidden opacity-0"
            >
                {prefetchDocuments.map((document) => (
                    <FilingDocumentPage
                        key={document.id}
                        document={document}
                        eager
                    />
                ))}
            </div>
            <div className="pointer-events-none absolute top-5 right-6 z-20 text-white">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close folder"
                    onClick={requestClose}
                    className="pointer-events-auto size-11 shrink-0 rounded-none text-white hover:bg-white/10 hover:text-white"
                >
                    <X aria-hidden="true" />
                </Button>
            </div>
            <FolderActor
                key={drawerSlot ? 'drawer' : 'overlay'}
                actorRef={actorRef}
                motionRef={actorMotion}
                drawerSlot={drawerSlot}
                initialPose={handoffPose ?? centered}
                size={size}
                phase={phase}
                target={transform}
                transition={actorTransition}
                interactive={canInteract}
                onComplete={() => onActorComplete(phase)}
            >
                <ClosedFolderMesh
                    detail={insideDrawer ? 'closed' : 'full'}
                    label={opened.item.label}
                    coverTitle={opened.item.coverTitle}
                    depth={size.depth}
                    open={coverOpen}
                    transition={coverTransition}
                    onCoverComplete={onCoverComplete}
                    content={
                        <PortraitContent
                            width={size.width * 0.98}
                            height={size.height * 0.94}
                        >
                            {loadError ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-800">
                                    <p>Could not load folder documents.</p>
                                </div>
                            ) : current ? (
                                <FilingDocumentPage
                                    document={
                                        flip === 'next' && nextDocument
                                            ? nextDocument
                                            : current
                                    }
                                    eager
                                />
                            ) : (
                                <EmptyDocuments loading={loading} />
                            )}
                        </PortraitContent>
                    }
                    insideCover={
                        <PortraitContent
                            width={size.width}
                            height={size.height * 0.9}
                        >
                            {current ? (
                                <div
                                    aria-hidden="true"
                                    inert
                                    className="h-full text-left"
                                >
                                    <DocumentDetails
                                        document={current}
                                        onOpenPrevious={
                                            canInteract && !flip
                                                ? openPreviousDeclaration
                                                : undefined
                                        }
                                    />
                                </div>
                            ) : null}
                        </PortraitContent>
                    }
                />
            </FolderActor>
            {canInteract && current && (
                <div className="sr-only">
                    <DocumentDetails document={current} />
                </div>
            )}
            {canInteract && previousDocument && coverBounds && (
                <button
                    type="button"
                    aria-label={`Previous page, ${previousDocument.originalFilename}`}
                    disabled={!canGoPrevious}
                    onClick={() => turnPage('prev')}
                    style={coverBounds}
                    className="absolute z-10 cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-700 disabled:cursor-default"
                />
            )}
            {canInteract &&
                !flip &&
                current?.previousTaxDeclarationNumber &&
                previousBounds && (
                    <button
                        type="button"
                        aria-label={current.previousTaxDeclarationNumber}
                        onClick={() =>
                            openPreviousDeclaration(
                                current.previousTaxDeclarationNumber!,
                            )
                        }
                        style={previousBounds}
                        className="absolute z-20 cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    />
                )}
            {/* Keep the page controls in screen space: nested 3D faces have
                inconsistent hit testing in browsers during rotation. */}
            {canInteract && current && paperBounds && (
                <div
                    className="group/folder absolute z-10"
                    style={{ ...paperBounds, perspective: '1540px' }}
                >
                    <button
                        type="button"
                        aria-label="Next page"
                        onClick={() => turnPage('next')}
                        disabled={!canGoNext}
                        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-default"
                    />
                    {!flip && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenDocument(current)}
                            aria-label={`Open ${current.originalFilename}`}
                            title="Open document"
                            className="absolute top-2 right-2 z-30 size-8 cursor-pointer rounded-none bg-transparent text-blue-900 opacity-0 shadow-none [filter:drop-shadow(0_0_2px_rgb(255_255_255))_drop-shadow(0_1px_2px_rgb(255_255_255_/_0.9))] transition-transform duration-200 ease-out group-focus-within/folder:opacity-100 group-hover/folder:opacity-100 hover:scale-150 hover:bg-transparent hover:text-blue-950 focus-visible:opacity-100 focus-visible:ring-blue-700 motion-reduce:transition-none motion-reduce:hover:scale-100 [@media(hover:none)]:opacity-100"
                        >
                            <Maximize2 aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                    {flip && (
                        <motion.div
                            key={`${index}-${flip}`}
                            data-folder-page-turn={flip}
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-20"
                            style={{
                                transformOrigin: 'left center',
                                transformStyle: 'preserve-3d',
                            }}
                            initial={{
                                transform:
                                    flip === 'next'
                                        ? 'rotateY(0deg)'
                                        : 'rotateY(-180deg)',
                            }}
                            animate={{
                                transform:
                                    flip === 'next'
                                        ? 'rotateY(-180deg)'
                                        : 'rotateY(0deg)',
                            }}
                            transition={PAGE_FLIP}
                            onAnimationComplete={() => finishFlip(flip)}
                        >
                            <div
                                className="absolute inset-0 overflow-hidden border border-slate-200 bg-white"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(1px)',
                                }}
                            >
                                <FilingDocumentPage
                                    document={
                                        flip === 'prev'
                                            ? previousDocument!
                                            : current
                                    }
                                    eager
                                />
                            </div>
                            <div
                                className="absolute inset-0 overflow-hidden border border-slate-200 bg-white"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform:
                                        'rotateY(180deg) translateZ(1px)',
                                }}
                            >
                                <DocumentDetails
                                    document={
                                        flip === 'next'
                                            ? nextDocument!
                                            : current
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
            {canInteract && (
                <div className="absolute inset-x-4 bottom-8 z-20 flex justify-center">
                    {loadError ? (
                        <Button
                            variant="outline"
                            className="h-11 rounded-none bg-white text-slate-900"
                            onClick={() => setAttempt((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    ) : (
                        <p
                            role="status"
                            className="pointer-events-none text-center text-xs text-neutral-300"
                        >
                            {loading
                                ? 'Loading documents…'
                                : documents.length > 0
                                  ? `${index + 1} / ${documents.length} · click a page to flip · Esc to close`
                                  : 'Esc or click outside to close'}
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
