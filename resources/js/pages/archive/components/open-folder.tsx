import { X } from 'lucide-react';
import {
    motion,
    useMotionValue,
    useReducedMotion,
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
import type { ArchivedDocument } from '@/pages/documents/types';
import { useBookPortal } from './book-portal';
import {
    measureSlotPose,
    poseFromMatrix,
    translatePose,
    type FlyerPose,
} from './book-world-pose';
import ClosedFolderMesh, { FOLDER_ASPECT_RATIO } from './closed-folder-mesh';
import { folderMotionTransform } from './folder-motion';
import {
    BookPage,
    DocumentDetails,
    EmptyDocuments,
    FILING_PAGE_HEIGHT,
} from './filing-document-content';
import type { OpenBookProps } from './open-book';

type Phase =
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
const PICKUP_RISE = 210;
const INSERT_LIFT_RATIO = 1.4;

function lift(pose: FlyerPose, distance: number): FlyerPose {
    return poseFromMatrix(
        new DOMMatrix(pose.transform).translateSelf(0, -distance),
        pose,
    );
}

/** Turn back to the slot's angle around the folder's current center. */
function alignForReturn(rest: FlyerPose, fromTransform: string): FlyerPose {
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
    size: Pick<FlyerPose, 'width' | 'height' | 'depth'>,
    viewport: { width: number; height: number },
    opened: boolean,
): FlyerPose {
    const narrow = viewport.width < 960;
    const availableHeight = viewport.height - (narrow ? 256 : 160);
    const scale = Math.max(
        0.1,
        Math.min(
            // Match the book's readable page height, including paper insets.
            FILING_PAGE_HEIGHT / (size.width * 0.98),
            (viewport.width - 48) / (size.height * (narrow ? 1.08 : 2.08)),
            availableHeight / size.width,
        ),
    );
    // After the quarter turn, center the paper (4% top / 2% bottom inset),
    // with the opened cover extending to its left.
    const centerX = size.height * (opened ? 0.49 : 0.54);
    const x = viewport.width / 2 - centerX * scale;
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
}: OpenBookProps) {
    const reduceMotion = useReducedMotion();
    const portal = useBookPortal();
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
        reduceMotion ? 'open' : origin ? 'rise' : 'opening',
    );
    const phaseRef = useRef(phase);
    const [returnPose, setReturnPose] = useState(origin?.rest ?? null);
    const [returnAlignment, setReturnAlignment] = useState<FlyerPose | null>(
        null,
    );
    const dialogRef = useRef<HTMLDivElement>(null);
    const actorRef = useRef<HTMLDivElement>(null);
    const [paperBounds, setPaperBounds] = useState<{
        left: number;
        top: number;
        width: number;
        height: number;
    } | null>(null);
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [index, setIndex] = useState(0);
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
    const canInteract = phase === 'open' && !dimmed;
    const centered = presentationPose(size, viewport, false);
    const spread = presentationPose(size, viewport, true);
    const actorMotion = useMotionValue(
        folderMotionTransform(
            origin?.hover.transform ?? centered.transform,
            size,
        ),
    );
    const pickupRise = Math.max(PICKUP_RISE, size.height * 1.05);
    const coverOpen = phase === 'opening' || phase === 'open';
    const measurePaper = useCallback(() => {
        const paper = actorRef.current?.querySelector('[data-folder-paper]');
        if (!paper) return;
        const rect = paper.getBoundingClientRect();
        setPaperBounds({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
        });
    }, []);

    useEffect(() => {
        if (phase !== 'open') {
            setPaperBounds(null);
            return;
        }
        const frame = requestAnimationFrame(measurePaper);
        return () => cancelAnimationFrame(frame);
    }, [phase, measurePaper, viewport.width, viewport.height]);

    const changePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const finishClose = useCallback(() => {
        if (closeCompleted.current) return;
        closeCompleted.current = true;
        const slot = portal?.getSlot(opened.book.id);
        callbacks.current.onClose();
        requestAnimationFrame(() => {
            if (!document.querySelector('[role="dialog"]')) slot?.focus();
        });
    }, [portal, opened.book.id]);

    const startReturn = useCallback(() => {
        if (!origin || reduceMotion) {
            finishClose();
            return;
        }
        const slot = portal?.getSlot(opened.book.id);
        const rest = slot
            ? measureSlotPose(slot, origin.rest.depth)
            : origin.rest;
        actorMotion.stop();
        setReturnPose(rest);
        setReturnAlignment(alignForReturn(rest, actorMotion.get()));
        changePhase('align');
    }, [
        origin,
        reduceMotion,
        portal,
        opened.book.id,
        centered.transform,
        changePhase,
        finishClose,
        actorMotion,
    ]);

    const requestClose = useCallback(() => {
        if (callbacks.current.dimmed) return;
        const active = phaseRef.current;
        if (
            active === 'closing' ||
            active === 'align' ||
            active === 'return' ||
            active === 'insert'
        )
            return;
        if (reduceMotion) {
            finishClose();
        } else if (active === 'open' || active === 'opening') {
            changePhase('closing');
        } else {
            startReturn();
        }
    }, [reduceMotion, changePhase, startReturn, finishClose]);

    useEffect(() => {
        dialogRef.current?.focus({ preventScroll: true });
        const resize = () => {
            setPaperBounds(null);
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
        fetch(`/archive/books/${opened.book.id}`, {
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
    }, [opened.book.id, attempt]);

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

    const onActorComplete = () => {
        const active = phaseRef.current;
        if (active === 'rise') changePhase('travel');
        else if (active === 'travel') changePhase('opening');
        else if (active === 'align') changePhase('return');
        else if (active === 'return') changePhase('insert');
        else if (active === 'insert') finishClose();
        else if (active === 'open') measurePaper();
    };
    const onCoverComplete = () => {
        if (phaseRef.current === 'opening') changePhase('open');
        else if (phaseRef.current === 'closing') startReturn();
    };

    const pose =
        phase === 'rise' && origin
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
    const actorTransition: Transition = reduceMotion
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
                  lift(origin.hover, pickupRise).transform,
                  translatePose(centered, 0, -12).transform,
                  centered.transform,
              ]
            : pose.transform;
    const actorTransform = Array.isArray(transform)
        ? transform.map((value) => folderMotionTransform(value, size))
        : folderMotionTransform(transform, size);
    const coverTransition = reduceMotion
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
            inert={dimmed || undefined}
            data-folder-phase={phase}
            tabIndex={-1}
            className={cn(
                'fixed inset-0 overflow-hidden outline-none',
                dimmed ? 'z-40' : 'z-[60]',
            )}
            style={{ perspective: '1200px' }}
        >
            <motion.button
                type="button"
                aria-label="Dismiss folder by clicking outside"
                className="absolute inset-0 bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-300"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{
                    opacity: phase === 'return' || phase === 'insert' ? 0 : 1,
                }}
                transition={
                    reduceMotion ? INSTANT : { duration: 0.4, ease: EASE }
                }
                onClick={requestClose}
            />
            <div className="pointer-events-none absolute inset-x-6 top-5 z-20 flex items-start justify-between gap-4 text-white">
                <div className="min-w-0 rounded-md bg-black/75 px-3 py-2">
                    <h2
                        id="open-folder-title"
                        className="text-lg font-semibold"
                    >
                        {opened.book.label}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-200">
                        {opened.cabinetName} · {opened.drawerLabel}
                    </p>
                </div>
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
            <motion.div
                ref={actorRef}
                data-folder-actor
                inert={!canInteract || undefined}
                className="absolute top-0 left-0"
                style={{
                    width: size.width,
                    height: size.height,
                    transformStyle: 'preserve-3d',
                    pointerEvents: canInteract ? 'auto' : 'none',
                    transformOrigin: '0px 0px 0px',
                    willChange: phase === 'open' ? 'auto' : 'transform',
                    transform: actorMotion,
                }}
                initial={
                    reduceMotion
                        ? false
                        : {
                              transform: folderMotionTransform(
                                  origin?.hover.transform ?? centered.transform,
                                  size,
                              ),
                          }
                }
                animate={{ transform: actorTransform }}
                transition={actorTransition}
                onAnimationComplete={onActorComplete}
            >
                <ClosedFolderMesh
                    label={opened.book.label}
                    coverTitle={opened.book.coverTitle}
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
                                <BookPage document={current} eager />
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
                                <DocumentDetails document={current} />
                            ) : null}
                        </PortraitContent>
                    }
                />
            </motion.div>
            {/* Keep the click target in screen space: nested 3D faces have
                inconsistent hit testing in browsers during rotation. */}
            {canInteract && current && paperBounds && (
                <button
                    type="button"
                    aria-label={`Open ${current.originalFilename}`}
                    onClick={() => onOpenDocument(current)}
                    className="absolute z-10 cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    style={paperBounds}
                />
            )}
            {canInteract && (
                <div className="absolute inset-x-4 bottom-5 z-20 flex flex-wrap items-center justify-center gap-3">
                    {loadError ? (
                        <Button
                            variant="outline"
                            className="h-11 rounded-none bg-white text-slate-900"
                            onClick={() => setAttempt((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    ) : documents.length > 0 ? (
                        <>
                            <Button
                                variant="outline"
                                className="h-11 rounded-none bg-white text-slate-900"
                                disabled={index === 0}
                                onClick={() =>
                                    setIndex((value) => Math.max(0, value - 1))
                                }
                            >
                                Previous
                            </Button>
                            <p role="status" className="text-sm text-white">
                                {index + 1} / {documents.length}
                            </p>
                            <Button
                                variant="outline"
                                className="h-11 rounded-none bg-white text-slate-900"
                                disabled={index >= documents.length - 1}
                                onClick={() =>
                                    setIndex((value) =>
                                        Math.min(
                                            documents.length - 1,
                                            value + 1,
                                        ),
                                    )
                                }
                            >
                                Next
                            </Button>
                            <Button
                                className="h-11 rounded-none bg-blue-900 text-white hover:bg-blue-800"
                                onClick={() =>
                                    current && onOpenDocument(current)
                                }
                            >
                                Open document
                            </Button>
                            {current?.previousTaxDeclarationNumber &&
                                onOpenPrevious && (
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-none bg-white text-slate-900"
                                        onClick={() =>
                                            onOpenPrevious(
                                                current.previousTaxDeclarationNumber!,
                                            )
                                        }
                                    >
                                        Previous declaration
                                    </Button>
                                )}
                        </>
                    ) : (
                        <p role="status" className="text-xs text-neutral-200">
                            {loading
                                ? 'Loading documents…'
                                : 'Esc or click outside to close'}
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
}
