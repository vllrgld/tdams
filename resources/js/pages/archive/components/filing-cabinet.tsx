import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type Transition,
} from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type {
    BookCover,
    CabinetBook,
    FilingCabinet as FilingCabinetData,
} from '../data/cabinets';
import CabinetDrawer from './cabinet-drawer';

const WIDTH = 180;
const HEIGHT = 300;
const DEPTH = 160;
const FRAME_PADDING = 10;
const DRAWER_GAP = 8;
const DRAWER_DEPTH = DEPTH - 12;
const DRAWER_TRAVEL = Math.round(DEPTH * 0.65);
const PERSPECTIVE = 1000;
const REST_ROTATE_X = -12;
const REST_ROTATE_Y = 30;
const REST_TRANSFORM = `rotateX(${REST_ROTATE_X}deg) rotateY(${REST_ROTATE_Y}deg)`;

const CLOSEUP_WIDTH = 520;
const CLOSEUP_HEIGHT = 140;
const CLOSEUP_DEPTH = 440;
const CLOSEUP_SCALE_FROM = 0.72;
const CLOSEUP_SCALE_TO = 1.55;
const CLOSEUP_TILT_FROM = -32;
const CLOSEUP_TILT_TO = -62;

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
        rotatedDrawerY(halfH, -CLOSEUP_DEPTH, tiltDeg),
    ];
    const centerY = ((Math.min(...ys) + Math.max(...ys)) / 2) * scale;

    return `translateY(${-centerY}px) scale(${scale}) rotateX(${tiltDeg}deg)`;
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
    zoomed: boolean;
    onZoomChange: (zoomed: boolean) => void;
    onOpenBook: (
        book: CabinetBook,
        cover: BookCover,
        drawerLabel: string,
    ) => void;
};

export default function FilingCabinet({
    cabinet,
    zoomed,
    onZoomChange,
    onOpenBook,
}: FilingCabinetProps) {
    const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
    const reduceMotion = useReducedMotion();
    const transition = reduceMotion ? INSTANT : SLIDE;
    const insideRef = useRef<HTMLButtonElement>(null);
    const wasZoomed = useRef(false);

    const drawerCount = cabinet.drawers.length;
    const drawerWidth = WIDTH - FRAME_PADDING * 2;
    const drawerHeight =
        (HEIGHT - FRAME_PADDING * 2 - DRAWER_GAP * (drawerCount - 1)) /
        drawerCount;
    const drawerTop = (index: number) =>
        FRAME_PADDING + index * (drawerHeight + DRAWER_GAP);

    const openIndex = cabinet.drawers.findIndex(
        (drawer) => drawer.id === openDrawerId,
    );
    const openDrawer = openIndex >= 0 ? cabinet.drawers[openIndex] : null;

    useEffect(() => {
        if (!zoomed && wasZoomed.current) {
            insideRef.current?.focus({ preventScroll: true });
        }

        wasZoomed.current = zoomed;
    }, [zoomed]);

    function toggleDrawer(id: string) {
        setOpenDrawerId((current) => (current === id ? null : id));
    }

    return (
        <div
            role="group"
            aria-label={cabinet.name}
            className="relative flex min-w-0 flex-col items-center gap-4"
        >
            <div
                className="flex w-full items-center justify-center pt-10 pb-14"
                style={{ perspective: `${PERSPECTIVE}px` }}
            >
                <div
                    className="relative"
                    style={{
                        width: WIDTH,
                        height: HEIGHT,
                        transformStyle: 'preserve-3d',
                        transform: REST_TRANSFORM,
                    }}
                >
                    <div
                        className="pointer-events-none absolute right-0 bottom-full left-0 mb-4 text-center"
                        style={{
                            transform: `translateZ(${-DEPTH / 2}px)`,
                        }}
                    >
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {cabinet.name}
                        </p>
                    </div>
                    <Face
                        className="inset-0 bg-neutral-500 dark:bg-black"
                        style={{ transform: `translateZ(${-DEPTH}px)` }}
                    />
                    <Face
                        className="top-0 left-full bg-neutral-400 dark:bg-neutral-900"
                        style={{
                            width: DEPTH,
                            height: HEIGHT,
                            transformOrigin: 'left center',
                            transform: 'rotateY(90deg)',
                        }}
                    />
                    <Face
                        className="top-0 right-full border border-neutral-500 bg-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
                        style={{
                            width: DEPTH,
                            height: HEIGHT,
                            transformOrigin: 'right center',
                            transform: 'rotateY(-90deg)',
                        }}
                    />
                    <Face
                        className="bottom-full left-0 border border-neutral-400 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700"
                        style={{
                            width: WIDTH,
                            height: DEPTH,
                            transformOrigin: 'bottom center',
                            transform: 'rotateX(90deg)',
                        }}
                    />
                    <Face
                        className="top-full left-0 bg-neutral-500 dark:bg-black"
                        style={{
                            width: WIDTH,
                            height: DEPTH,
                            transformOrigin: 'top center',
                            transform: 'rotateX(-90deg)',
                        }}
                    />

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 border border-neutral-400 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                        {cabinet.drawers.map((drawer, index) => (
                            <span
                                key={drawer.id}
                                className="absolute bg-neutral-800 dark:bg-black"
                                style={{
                                    left: FRAME_PADDING,
                                    top: drawerTop(index),
                                    width: drawerWidth,
                                    height: drawerHeight,
                                }}
                            />
                        ))}
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
                            locked={zoomed}
                            showBooks={index === openIndex && !zoomed}
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

            {openDrawer && (
                <div className="text-center" aria-live="polite">
                    <p className="text-xs text-slate-700 tabular-nums dark:text-neutral-300">
                        {`${openDrawer.label} · ${openDrawer.range} · ${openDrawer.books.length} books`}
                    </p>
                    {!zoomed && (
                        <p className="text-xs text-slate-500 dark:text-neutral-500">
                            Click inside the drawer to look closer
                        </p>
                    )}
                </div>
            )}

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {zoomed && openDrawer && (
                            <motion.div
                                key={openDrawer.id}
                                className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
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
                                            : { transform: CLOSEUP_FROM }
                                    }
                                    animate={{ transform: CLOSEUP_TO }}
                                    exit={
                                        reduceMotion
                                            ? undefined
                                            : { transform: CLOSEUP_FROM }
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
                                        onOpenBook={(book, cover) =>
                                            onOpenBook(
                                                book,
                                                cover,
                                                openDrawer.label,
                                            )
                                        }
                                    />
                                </motion.div>
                                <div className="pointer-events-auto absolute bottom-8 text-center">
                                    <p className="text-sm font-semibold text-white">
                                        {cabinet.name} · {openDrawer.label}
                                    </p>
                                    <p className="text-xs text-neutral-300 tabular-nums">
                                        {openDrawer.range} ·{' '}
                                        {openDrawer.books.length} books
                                    </p>
                                    {openDrawer.books.length > 0 && (
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Click a book to open it
                                        </p>
                                    )}
                                </div>
                                <ul
                                    className="sr-only"
                                    aria-label={`Books in ${openDrawer.label}`}
                                >
                                    {openDrawer.books.map((book) => (
                                        <li key={book.id}>
                                            {book.label},{' '}
                                            {book.documents.length} documents
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
