import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type Transition,
} from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { filingTitle } from '@/lib/filing-appearance';
import type {
    FilingItemCover,
    FilingItemOrigin,
    CabinetFilingItem,
    FilingCabinet as FilingCabinetData,
} from '@/types/filing';
import CabinetDrawer from './cabinet-drawer';

const CLOSEUP_WIDTH = 806;
const CLOSEUP_HEIGHT = 420;
const CLOSEUP_DEPTH = 682;

const HEIGHT = 360;
const MM_SCALE = HEIGHT / 1320;
const WIDTH = 460 * MM_SCALE;
const DEPTH = 620 * MM_SCALE;
const FRAME_PADDING = 20 * MM_SCALE;
const TOP_BAND = 32 * MM_SCALE;
const BASE_BAND = 45 * MM_SCALE;
const DRAWER_GAP = 2.8 * MM_SCALE;
const DRAWER_DEPTH = DEPTH - 8 * MM_SCALE;
const DRAWER_TRAVEL = 480 * MM_SCALE;
const PERSPECTIVE = HEIGHT * 8;
const REST_ROTATE_Y = 24;
const REST_TRANSFORM = `rotateY(${REST_ROTATE_Y}deg)`;
const SLOT_PAD_LEFT = Math.round(
    DEPTH * Math.sin((Math.abs(REST_ROTATE_Y) * Math.PI) / 180),
);
const SLOT_PAD_RIGHT = Math.round(
    DRAWER_TRAVEL * Math.sin((Math.abs(REST_ROTATE_Y) * Math.PI) / 180) * 1.2,
);
const SLOT_PAD_TOP = 56;
const SLOT_PAD_BOTTOM = 32;
const SLOT_WIDTH = SLOT_PAD_LEFT + WIDTH + SLOT_PAD_RIGHT;
const SLOT_HEIGHT = SLOT_PAD_TOP + HEIGHT + SLOT_PAD_BOTTOM;

export function filingCabinetFrameSize(): { width: number; height: number } {
    return { width: SLOT_WIDTH, height: SLOT_HEIGHT };
}

const CLOSEUP_SCALE_FROM = 0.72;
const CLOSEUP_SCALE_TO = 0.9;
const CLOSEUP_TILT_FROM = -32;
const CLOSEUP_TILT_TO = -52;

function rotatedDrawerY(
    localY: number,
    localZ: number,
    tiltDeg: number,
): number {
    const theta = (tiltDeg * Math.PI) / 180;

    return localY * Math.cos(theta) - localZ * Math.sin(theta);
}

function closeupPose(scale: number, tiltDeg: number): string {
    const halfH = CLOSEUP_HEIGHT / 2;
    const ys = [
        rotatedDrawerY(-halfH, 0, tiltDeg),
        rotatedDrawerY(halfH, 0, tiltDeg),
        rotatedDrawerY(-halfH, -CLOSEUP_DEPTH, tiltDeg),
        rotatedDrawerY(halfH, -CLOSEUP_DEPTH, tiltDeg),
    ];
    const centerY = ((Math.min(...ys) + Math.max(...ys)) / 2) * scale;

    return `translateY(${-centerY}px) scale3d(${scale}, ${scale}, ${scale}) rotateX(${tiltDeg}deg)`;
}

const CLOSEUP_FROM = closeupPose(CLOSEUP_SCALE_FROM, CLOSEUP_TILT_FROM);
const CLOSEUP_TO = closeupPose(CLOSEUP_SCALE_TO, CLOSEUP_TILT_TO);

const SLIDE: Transition = { type: 'spring', stiffness: 140, damping: 28 };
const CLOSEUP: Transition = { type: 'spring', stiffness: 110, damping: 26 };
const FADE: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };
const INSTANT: Transition = { duration: 0 };

function Face({
    className,
    style,
}: {
    className: string;
    style: CSSProperties;
}) {
    return (
        <div
            aria-hidden="true"
            className={cn('absolute', className)}
            style={style}
        />
    );
}

type FilingCabinetProps = {
    cabinet: FilingCabinetData;
    preview?: boolean;
    previewBookId?: string | null;
    zoomed: boolean;
    openDrawerId: string | null;
    onOpenDrawerChange: (drawerId: string | null) => void;
    onZoomChange: (zoomed: boolean) => void;
    openedItemId?: string | null;
    onOpenItem: (
        book: CabinetFilingItem,
        cover: FilingItemCover,
        drawerLabel: string,
        origin: FilingItemOrigin,
    ) => void;
};

export default function FilingCabinet({
    cabinet,
    preview = false,
    previewBookId,
    zoomed,
    openDrawerId,
    onOpenDrawerChange,
    onZoomChange,
    openedItemId,
    onOpenItem,
}: FilingCabinetProps) {
    const reduceMotion = useReducedMotion();
    const transition = reduceMotion ? INSTANT : SLIDE;
    const insideRef = useRef<HTMLButtonElement>(null);
    const wasZoomed = useRef(false);

    const drawerCount = cabinet.drawers.length;
    const cabinetHeight = HEIGHT;
    const slotHeight = SLOT_HEIGHT;
    const drawerWidth = WIDTH - FRAME_PADDING * 2;
    const drawerHeight =
        (cabinetHeight -
            TOP_BAND -
            BASE_BAND -
            DRAWER_GAP * 2 -
            DRAWER_GAP * Math.max(0, drawerCount - 1)) /
        Math.max(1, drawerCount);
    const drawerTop = (index: number) =>
        TOP_BAND + DRAWER_GAP + index * (drawerHeight + DRAWER_GAP);

    const openIndex = cabinet.drawers.findIndex(
        (drawer) => drawer.id === openDrawerId,
    );
    const openDrawer = openIndex >= 0 ? cabinet.drawers[openIndex] : null;
    const responsiveCloseup = openDrawer?.books[0]?.kind === 'lever_arch';
    const [viewport, setViewport] = useState(() => ({
        width: typeof window === 'undefined' ? 1440 : window.innerWidth,
        height: typeof window === 'undefined' ? 1000 : window.innerHeight,
    }));
    useEffect(() => {
        if (!zoomed || !responsiveCloseup) return;
        const update = () =>
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [zoomed, responsiveCloseup]);
    const closeupFit = responsiveCloseup
        ? Math.min(
              1,
              (viewport.width - 32) / (CLOSEUP_WIDTH * CLOSEUP_SCALE_TO * 1.2),
              (viewport.height - 144) /
                  ((CLOSEUP_HEIGHT * 0.616 + CLOSEUP_DEPTH * 0.789) *
                      CLOSEUP_SCALE_TO *
                      1.1),
          )
        : 1;
    const closeupFrom = responsiveCloseup
        ? closeupPose(CLOSEUP_SCALE_FROM * closeupFit, CLOSEUP_TILT_FROM)
        : CLOSEUP_FROM;
    const closeupTo = responsiveCloseup
        ? closeupPose(CLOSEUP_SCALE_TO * closeupFit, CLOSEUP_TILT_TO)
        : CLOSEUP_TO;

    useEffect(() => {
        if (!zoomed && wasZoomed.current) {
            insideRef.current?.focus({ preventScroll: true });
        }

        wasZoomed.current = zoomed;
    }, [zoomed]);

    function toggleDrawer(id: string) {
        onOpenDrawerChange(openDrawerId === id ? null : id);
    }

    const showLocation =
        cabinet.location !== '' && cabinet.location !== cabinet.name;

    return (
        <div
            id={`cabinet-${cabinet.id}`}
            role="group"
            aria-label={cabinet.name}
            className={cn(
                'relative flex shrink-0 flex-col overflow-visible',
                openDrawer && 'z-10',
            )}
            style={{
                width: SLOT_WIDTH,
                height: slotHeight,
                contentVisibility: openDrawer ? 'visible' : 'auto',
                containIntrinsicSize: `${SLOT_WIDTH}px ${slotHeight}px`,
            }}
        >
            <div
                className="pointer-events-none absolute top-0 text-center"
                style={{
                    left: 0,
                    width: SLOT_PAD_LEFT + WIDTH,
                }}
            >
                <p
                    className="truncate text-sm font-semibold text-slate-950 dark:text-white"
                    title={cabinet.name}
                >
                    {cabinet.name}
                </p>
            </div>
            <div
                className="relative shrink-0 overflow-visible"
                style={{
                    width: SLOT_WIDTH,
                    height: SLOT_PAD_TOP + cabinetHeight + SLOT_PAD_BOTTOM,
                    paddingTop: SLOT_PAD_TOP,
                    paddingBottom: SLOT_PAD_BOTTOM,
                    paddingLeft: SLOT_PAD_LEFT,
                    paddingRight: SLOT_PAD_RIGHT,
                    perspective: `${PERSPECTIVE}px`,
                    perspectiveOrigin: `${SLOT_PAD_LEFT + WIDTH / 2}px ${SLOT_PAD_TOP + HEIGHT / 2 - Math.tan((12 * Math.PI) / 180) * PERSPECTIVE}px`,
                }}
            >
                <div
                    className="relative"
                    style={{
                        width: WIDTH,
                        height: cabinetHeight,
                        transformStyle: 'preserve-3d',
                        transform: REST_TRANSFORM,
                    }}
                    data-css-cabinet-body
                >
                    <div
                        aria-hidden="true"
                        className="cabinet-floor-shadow pointer-events-none absolute"
                        style={{
                            left: -10,
                            top: cabinetHeight + 2,
                            width: WIDTH + 20,
                            height: DEPTH + 20,
                            transformOrigin: 'center top',
                            transform: 'rotateX(-90deg) translateY(-10px)',
                        }}
                    />
                    <Face
                        className="cabinet-vector-back inset-0"
                        style={{ transform: `translateZ(${-DEPTH}px)` }}
                    />
                    <Face
                        className="cabinet-vector-side-shade top-0 left-full"
                        style={{
                            width: DEPTH,
                            height: cabinetHeight,
                            transformOrigin: 'left center',
                            transform: 'rotateY(90deg)',
                        }}
                    />
                    <Face
                        className="cabinet-vector-side top-0 right-full border"
                        style={{
                            width: DEPTH,
                            height: cabinetHeight,
                            transformOrigin: 'right center',
                            transform: 'rotateY(-90deg)',
                        }}
                    />
                    <Face
                        className="cabinet-vector-top bottom-full left-0 border"
                        style={{
                            width: WIDTH,
                            height: DEPTH,
                            transformOrigin: 'bottom center',
                            transform: 'rotateX(90deg)',
                        }}
                    />
                    <Face
                        className="cabinet-vector-bottom top-full left-0"
                        style={{
                            width: WIDTH,
                            height: DEPTH,
                            transformOrigin: 'top center',
                            transform: 'rotateX(-90deg)',
                        }}
                    />

                    <div
                        data-cabinet-shell
                        aria-hidden="true"
                        className="cabinet-vector-frame absolute inset-0 border"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {cabinet.drawers.map((drawer, index) => (
                            <span
                                key={drawer.id}
                                className="cabinet-vector-cavity absolute"
                                style={{
                                    left: FRAME_PADDING,
                                    top: drawerTop(index),
                                    width: drawerWidth,
                                    height: drawerHeight,
                                }}
                            />
                        ))}
                        <span
                            className="cabinet-case-rail absolute inset-y-0 left-0"
                            style={{
                                width: FRAME_PADDING,
                                transform: 'translateZ(2px)',
                            }}
                        />
                        <span
                            className="cabinet-case-rail absolute inset-y-0 right-0"
                            style={{
                                width: FRAME_PADDING,
                                transform: 'translateZ(2px)',
                            }}
                        />
                        <span
                            className="cabinet-case-cap absolute inset-x-0 top-0"
                            style={{
                                height: TOP_BAND,
                                transform: 'translateZ(3px)',
                            }}
                        >
                            <span className="cabinet-case-lock absolute right-1 bottom-0 -translate-y-1/2" />
                        </span>
                        <span
                            className="cabinet-case-base absolute inset-x-0 bottom-0"
                            style={{
                                height: BASE_BAND,
                                transform: 'translateZ(3px)',
                            }}
                        />
                    </div>

                    {cabinet.drawers.map((drawer, index) => (
                        <CabinetDrawer
                            key={drawer.id}
                            drawer={drawer}
                            left={FRAME_PADDING}
                            top={drawerTop(index)}
                            width={drawerWidth}
                            height={drawerHeight}
                            depth={DRAWER_DEPTH}
                            travel={DRAWER_TRAVEL}
                            open={index === openIndex}
                            locked={zoomed || preview}
                            showBooks={index === openIndex && !zoomed}
                            previewBookId={
                                preview && index === openIndex
                                    ? previewBookId
                                    : undefined
                            }
                            transition={transition}
                            insideRef={
                                index === openIndex ? insideRef : undefined
                            }
                            onToggle={() => toggleDrawer(drawer.id)}
                            onViewInside={() => onZoomChange(true)}
                        />
                    ))}
                </div>
            </div>

            {showLocation && (
                <p
                    className="pointer-events-none absolute bottom-0 truncate text-center text-[10px] text-slate-500 dark:text-neutral-400"
                    style={{ width: SLOT_PAD_LEFT + WIDTH }}
                    title={cabinet.location}
                >
                    {cabinet.location}
                </p>
            )}

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {zoomed && openDrawer && (
                            <motion.div
                                key={openDrawer.id}
                                className={cn(
                                    'pointer-events-none fixed inset-0 z-50 grid place-items-center',
                                    responsiveCloseup &&
                                        'grid-cols-[minmax(0,1fr)]',
                                )}
                                style={{ perspective: '1200px' }}
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={reduceMotion ? undefined : { opacity: 0 }}
                                transition={reduceMotion ? INSTANT : FADE}
                            >
                                <motion.div
                                    className="pointer-events-auto relative"
                                    style={{
                                        width: CLOSEUP_WIDTH,
                                        height: CLOSEUP_HEIGHT,
                                        transformStyle: 'preserve-3d',
                                        transformOrigin: '50% 50%',
                                    }}
                                    initial={
                                        reduceMotion
                                            ? false
                                            : { transform: closeupFrom }
                                    }
                                    animate={{ transform: closeupTo }}
                                    exit={
                                        reduceMotion
                                            ? undefined
                                            : { transform: closeupFrom }
                                    }
                                    transition={
                                        reduceMotion ? INSTANT : CLOSEUP
                                    }
                                >
                                    <CabinetDrawer
                                        drawer={openDrawer}
                                        left={0}
                                        top={0}
                                        width={CLOSEUP_WIDTH}
                                        height={CLOSEUP_HEIGHT}
                                        depth={CLOSEUP_DEPTH}
                                        travel={0}
                                        open
                                        locked
                                        showBooks
                                        transition={INSTANT}
                                        onToggle={() => undefined}
                                        onViewInside={() => undefined}
                                        openedItemId={openedItemId}
                                        onOpenItem={(book, cover, origin) =>
                                            onOpenItem(
                                                book,
                                                cover,
                                                openDrawer.label,
                                                origin,
                                            )
                                        }
                                    />
                                </motion.div>
                                <ul
                                    className="sr-only"
                                    aria-label={`${filingTitle(openDrawer.books[0]?.kind, true)} in ${openDrawer.label}`}
                                >
                                    {openDrawer.books.map((book) => (
                                        <li key={book.id}>
                                            {book.label}, {book.documentCount}{' '}
                                            documents
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}
