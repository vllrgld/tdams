import { motion, type Transition } from 'motion/react';
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
    BOOK_COVER,
    type BookCover,
    type BookOrigin,
    type CabinetBook,
    type CabinetDrawer as CabinetDrawerData,
} from '../data/cabinets';
import { useBookPortal } from './book-portal';
import { measureHoverAndRestPose } from './book-world-pose';
import ClosedBookMesh from './closed-book-mesh';

const BOOKS_PER_ROW = 8;
const ROW_COUNT = 2;
const MAX_VISIBLE_BOOKS = BOOKS_PER_ROW * ROW_COUNT;
const BOOK_INNER_PAD = 8;
const BOOK_GAP = 2;

type CabinetDrawerProps = {
    drawer: CabinetDrawerData;
    left: number;
    top: number;
    width: number;
    height: number;
    depth: number;
    travel: number;
    open: boolean;
    locked: boolean;
    showBooks?: boolean;
    transition: Transition;
    insideRef?: Ref<HTMLButtonElement>;
    onToggle: () => void;
    onViewInside: () => void;
    openedBookId?: string | null;
    onOpenBook?: (
        book: CabinetBook,
        cover: BookCover,
        origin: BookOrigin,
    ) => void;
};

function drawerRimOffset(height: number): number {
    return height * 0.15;
}

function translateZ(value: number): string {
    return `translateZ(${value}px)`;
}

const BOOK_POP: Transition = {
    duration: 0.75,
    ease: [0.4, 0, 0.2, 1],
};

export default function CabinetDrawer({
    drawer,
    left,
    top,
    width,
    height,
    depth,
    travel,
    open,
    locked,
    showBooks = open,
    transition,
    insideRef,
    onToggle,
    onViewInside,
    openedBookId,
    onOpenBook,
}: CabinetDrawerProps) {
    const portal = useBookPortal();
    const [focusPeek, setFocusPeek] = useState(false);
    const [pointerOver, setPointerOver] = useState(false);
    const [peekLocked, setPeekLocked] = useState(false);
    const [popsFrozen, setPopsFrozen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [booksHeldOpen, setBooksHeldOpen] = useState(showBooks);
    const previousOpen = useRef(open);
    const previousOpenedBookId = useRef(openedBookId);
    const isCloseup = Boolean(onOpenBook);
    const documentTotal = drawer.books.reduce(
        (total, book) => total + book.documentCount,
        0,
    );
    const booksVisible = showBooks || booksHeldOpen;
    const visibleBooks = booksVisible
        ? drawer.books.slice(0, MAX_VISIBLE_BOOKS)
        : [];
    const innerPad = isCloseup ? BOOK_INNER_PAD : 4;
    const usableWidth = Math.max(width - innerPad * 2, BOOKS_PER_ROW);
    const usableDepth = Math.max(depth - innerPad * 2, ROW_COUNT);
    const aisle = isCloseup
        ? BOOK_GAP * 3
        : Math.max(10, Math.round(depth * 0.1));
    const rowDepth = (usableDepth - aisle) / ROW_COUNT;
    const colStride = usableWidth / BOOKS_PER_ROW;
    const colGap = isCloseup ? BOOK_GAP : 3;
    const bookWidth = Math.max(isCloseup ? 4 : 6, colStride - colGap);
    const coverDepth = Math.max(isCloseup ? 10 : 16, rowDepth - colGap);
    const peek = Math.round(travel * 0.14);
    const sideTop = drawerRimOffset(height);
    const sideHeight = height - sideTop;
    const insideEnabled = open && !locked;
    const canPeek = !open && !locked && !peekLocked;
    const bookHeight = isCloseup
        ? height * 0.72
        : Math.max(10, height - sideTop - 2);
    const restZ = open
        ? travel
        : canPeek && (pointerOver || focusPeek)
          ? peek
          : 1;

    useEffect(() => {
        if (previousOpen.current === open) {
            return;
        }

        previousOpen.current = open;
        setPeekLocked(true);
        setFocusPeek(false);
    }, [open]);

    useEffect(() => {
        const previous = previousOpenedBookId.current;
        previousOpenedBookId.current = openedBookId;

        if (openedBookId) {
            setHoveredId(null);
            return;
        }

        if (!previous) {
            return;
        }

        setPopsFrozen(true);
        setHoveredId(null);

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [openedBookId]);

    useEffect(() => {
        if (showBooks) {
            setBooksHeldOpen(true);
            return;
        }

        if (open) {
            setBooksHeldOpen(false);
        }
    }, [showBooks, open]);

    const side: CSSProperties = {
        top: sideTop,
        width: depth,
        height: sideHeight,
        transformOrigin: 'left center',
        transform: 'rotateY(90deg)',
    };

    return (
        <motion.div
            className="absolute"
            style={{
                left,
                top,
                width,
                height,
                transformStyle: 'preserve-3d',
            }}
            initial={false}
            animate={{ transform: translateZ(restZ) }}
            onAnimationComplete={() => {
                if (!open && !showBooks) {
                    setBooksHeldOpen(false);
                }
            }}
            onPointerEnter={() => setPointerOver(true)}
            onPointerLeave={() => {
                setPointerOver(false);
                setPeekLocked(false);
                setPopsFrozen(false);
                setHoveredId(null);
            }}
            transition={transition}
        >
            <div
                aria-hidden="true"
                className="absolute left-0 bg-neutral-300 dark:bg-neutral-800"
                style={side}
            />
            <div
                aria-hidden="true"
                className="absolute left-full bg-neutral-300 dark:bg-neutral-800"
                style={side}
            />
            <div
                aria-hidden="true"
                className="absolute top-full left-0 bg-neutral-400 dark:bg-neutral-900"
                style={{
                    width,
                    height: depth,
                    transformOrigin: 'top center',
                    transform: 'rotateX(-90deg)',
                }}
            />
            <div
                aria-hidden="true"
                className="absolute left-0 bg-neutral-400 dark:bg-neutral-900"
                style={{
                    top: sideTop,
                    width,
                    height: sideHeight,
                    transform: `translateZ(${-depth}px)`,
                }}
            />

            <button
                ref={insideRef}
                type="button"
                onClick={onViewInside}
                disabled={!insideEnabled}
                tabIndex={insideEnabled ? 0 : -1}
                aria-label={`View contents of ${drawer.label}`}
                className={cn(
                    'absolute left-0 border-transparent bg-transparent',
                    insideEnabled
                        ? 'cursor-zoom-in hover:border-blue-800 hover:bg-blue-600/40 hover:ring-2 hover:ring-blue-800/50 focus-visible:border-blue-800 focus-visible:bg-blue-600/40 focus-visible:ring-2 focus-visible:ring-blue-800/50'
                        : 'pointer-events-none',
                )}
                style={{
                    top: sideTop,
                    width,
                    height: depth,
                    transformOrigin: 'top center',
                    transform: 'rotateX(-90deg)',
                }}
            />

            {visibleBooks.map((book, index) => {
                const colors = BOOK_COVER;
                const row = Math.floor(index / BOOKS_PER_ROW);
                const col = index % BOOKS_PER_ROW;
                const bookLeft =
                    innerPad + col * colStride + (colStride - bookWidth) / 2;
                const bookZ = -(innerPad + row * (rowDepth + aisle));
                const popLift = isCloseup ? -40 : -14;
                const showTitle = isCloseup || coverDepth >= 28;
                const host = portal?.host ?? null;
                const lifted = openedBookId === book.id && host !== null;
                const canPop = !lifted && !popsFrozen;
                const poppedUp = canPop && hoveredId === book.id;
                const mesh = (
                    <ClosedBookMesh
                        depth={coverDepth}
                        label={book.label}
                        coverTitle={book.coverTitle}
                        cover={colors}
                        showTitle={showTitle}
                        showCover={isCloseup}
                        headCap={!isCloseup && row === 0}
                        documentCount={book.documentCount}
                    />
                );

                const openFromSlot = (slot: HTMLElement) => {
                    if (!onOpenBook || lifted) {
                        return;
                    }

                    const visual = slot.querySelector('[data-book-visual]');

                    if (!(visual instanceof HTMLElement)) {
                        return;
                    }

                    onOpenBook(
                        book,
                        colors,
                        measureHoverAndRestPose(visual, 'none', coverDepth),
                    );
                };

                return (
                    <div
                        key={book.id}
                        ref={(node) => {
                            portal?.registerSlot(book.id, node);
                        }}
                        role={onOpenBook ? 'button' : undefined}
                        tabIndex={onOpenBook && !lifted ? 0 : -1}
                        aria-hidden={lifted || undefined}
                        aria-label={
                            onOpenBook ? `Open ${book.label}` : book.label
                        }
                        className={cn(
                            'absolute bottom-0',
                            onOpenBook && !lifted && 'cursor-pointer',
                            lifted && 'pointer-events-none',
                            poppedUp && 'z-10',
                        )}
                        style={{
                            left: bookLeft,
                            width: bookWidth,
                            height: bookHeight,
                            transform: `translateZ(${bookZ}px)`,
                            transformStyle: 'preserve-3d',
                            transformOrigin: '50% 100%',
                            ['--cover-scale' as string]: Math.min(
                                bookHeight / 440,
                                coverDepth / 595,
                            ),
                        }}
                        onPointerEnter={() => {
                            if (!canPop) {
                                return;
                            }

                            setHoveredId(book.id);
                        }}
                        onPointerLeave={() => {
                            setHoveredId((current) =>
                                current === book.id ? null : current,
                            );
                        }}
                        onFocus={() => {
                            if (!canPop) {
                                return;
                            }

                            setHoveredId(book.id);
                        }}
                        onBlur={() => {
                            setHoveredId((current) =>
                                current === book.id ? null : current,
                            );
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                            openFromSlot(event.currentTarget);
                        }}
                        onKeyDown={(event) => {
                            if (event.key !== 'Enter' && event.key !== ' ') {
                                return;
                            }

                            event.preventDefault();
                            event.stopPropagation();
                            openFromSlot(event.currentTarget);
                        }}
                    >
                        <div aria-hidden="true" className="absolute inset-0" />
                        <div
                            aria-hidden="true"
                            className="absolute top-0 left-full h-full"
                            style={{
                                width: coverDepth,
                                transformOrigin: 'left center',
                                transform: 'rotateY(90deg)',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            className="absolute bottom-full left-0 w-full"
                            style={{
                                height: coverDepth,
                                transformOrigin: 'bottom center',
                                transform: 'rotateX(90deg)',
                            }}
                        />
                        <motion.div
                            data-book-visual
                            className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none"
                            style={{
                                transformStyle: 'preserve-3d',
                                transformOrigin: '50% 100%',
                            }}
                            initial={false}
                            animate={{
                                transform: poppedUp
                                    ? `translateY(${popLift}px) scale(${isCloseup ? 1 : 1.05})`
                                    : 'translateY(0px) scale(1)',
                            }}
                            transition={
                                'duration' in transition &&
                                transition.duration === 0
                                    ? transition
                                    : BOOK_POP
                            }
                        >
                            {lifted && host ? createPortal(mesh, host) : mesh}
                        </motion.div>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={onToggle}
                disabled={locked}
                aria-expanded={open}
                aria-label={`${drawer.label}, ${drawer.range}, ${drawer.books.length} books${documentTotal > 0 ? `, ${documentTotal} documents` : ''}`}
                className={cn(
                    'absolute inset-0 flex cursor-pointer flex-col items-center justify-center border border-neutral-400 bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-default dark:border-neutral-600 dark:bg-neutral-700',
                    isCloseup ? 'gap-3' : 'gap-1.5',
                    locked && 'pointer-events-none',
                )}
                onFocus={() => {
                    if (canPeek) {
                        setFocusPeek(true);
                    }
                }}
                onBlur={() => {
                    setFocusPeek(false);
                    setPeekLocked(false);
                }}
            >
                <span
                    className={cn(
                        'max-w-[85%] truncate border border-neutral-400 bg-white leading-none font-semibold text-neutral-700 dark:border-neutral-500 dark:bg-neutral-200 dark:text-neutral-900',
                        isCloseup
                            ? 'px-3 py-1 text-lg'
                            : 'px-1.5 py-0.5 text-[9px]',
                    )}
                >
                    {drawer.label}
                </span>
                <span
                    aria-hidden="true"
                    className={cn(
                        'rounded-full bg-neutral-500 dark:bg-neutral-400',
                        isCloseup ? 'h-3 w-20' : 'h-1.5 w-10',
                    )}
                />
                {drawer.books.length > 0 ? (
                    <span
                        className={cn(
                            'leading-none font-medium text-neutral-600 tabular-nums dark:text-neutral-300',
                            isCloseup ? 'text-base' : 'text-[8px]',
                        )}
                    >
                        {drawer.books.length}
                    </span>
                ) : null}
            </button>
        </motion.div>
    );
}
