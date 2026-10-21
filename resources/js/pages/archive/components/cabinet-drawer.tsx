import { motion, type Transition } from 'motion/react';
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type Ref,
} from 'react';
import { cn } from '@/lib/utils';
import {
    BOOK_COVER,
    type BookCover,
    type CabinetBook,
    type CabinetDrawer as CabinetDrawerData,
} from '../data/cabinets';

const MAX_VISIBLE_BOOKS = 8;
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
    onOpenBook?: (book: CabinetBook, cover: BookCover) => void;
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
    onOpenBook,
}: CabinetDrawerProps) {
    const [focusPeek, setFocusPeek] = useState(false);
    const [pointerOver, setPointerOver] = useState(false);
    const [peekLocked, setPeekLocked] = useState(false);
    const previousOpen = useRef(open);
    const visibleBooks = showBooks
        ? drawer.books.slice(0, MAX_VISIBLE_BOOKS)
        : [];
    const usableDepth = Math.max(depth - BOOK_INNER_PAD * 2, MAX_VISIBLE_BOOKS);
    const bookStride = usableDepth / MAX_VISIBLE_BOOKS;
    const bookThickness = Math.max(10, bookStride - BOOK_GAP);
    const peek = Math.round(travel * 0.14);
    const sideTop = drawerRimOffset(height);
    const sideHeight = height - sideTop;
    const insideEnabled = open && !locked;
    const canPeek = !open && !locked && !peekLocked;
    const bookHeight = height * 0.72;
    const bookWidth = width * 0.86;
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
            onPointerEnter={() => setPointerOver(true)}
            onPointerLeave={() => {
                setPointerOver(false);
                setPeekLocked(false);
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
                const bookZ = -(BOOK_INNER_PAD + index * bookStride);
                const rest = `translateY(0px) scale(1) translateZ(${bookZ}px)`;
                const popped = `translateY(-14px) scale(1.05) translateZ(${bookZ}px)`;

                return (
                    <motion.div
                        key={book.id}
                        role={onOpenBook ? 'button' : undefined}
                        tabIndex={onOpenBook ? 0 : -1}
                        aria-label={
                            onOpenBook ? `Open ${book.label}` : book.label
                        }
                        className={cn(
                            'absolute bottom-0',
                            onOpenBook && 'cursor-pointer',
                        )}
                        style={{
                            left: '7%',
                            width: bookWidth,
                            height: bookHeight,
                            transformStyle: 'preserve-3d',
                            transformOrigin: '50% 100%',
                        }}
                        initial={false}
                        animate={{ transform: rest }}
                        whileHover={{ transform: popped }}
                        whileFocus={
                            onOpenBook ? { transform: popped } : undefined
                        }
                        transition={
                            'duration' in transition &&
                            transition.duration === 0
                                ? transition
                                : BOOK_POP
                        }
                        onClick={(event) => {
                            if (!onOpenBook) {
                                return;
                            }

                            event.stopPropagation();
                            onOpenBook(book, colors);
                        }}
                        onKeyDown={(event) => {
                            if (
                                !onOpenBook ||
                                (event.key !== 'Enter' && event.key !== ' ')
                            ) {
                                return;
                            }

                            event.preventDefault();
                            event.stopPropagation();
                            onOpenBook(book, colors);
                        }}
                    >
                        <div
                            className={cn(
                                'absolute inset-0 flex items-end justify-center border border-black/20 pb-1',
                                colors.cover,
                            )}
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                className="h-[22%] w-auto max-h-10 object-contain"
                            />
                        </div>
                        <div
                            className={cn(
                                'absolute inset-0 border border-black/30',
                                colors.cover,
                            )}
                            style={{
                                transform: `translateZ(${-bookThickness}px)`,
                            }}
                        />
                        <div
                            className={cn(
                                'absolute right-full border border-black/25',
                                colors.cover,
                            )}
                            style={{
                                top: 0,
                                width: bookThickness,
                                height: bookHeight,
                                transformOrigin: 'right center',
                                transform: 'rotateY(-90deg)',
                            }}
                        />
                        <div
                            className={cn(
                                'absolute left-full border border-black/25',
                                colors.cover,
                            )}
                            style={{
                                top: 0,
                                width: bookThickness,
                                height: bookHeight,
                                transformOrigin: 'left center',
                                transform: 'rotateY(90deg)',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            className="absolute top-full left-0 border border-black/15 bg-neutral-100 dark:bg-neutral-300"
                            style={{
                                width: bookWidth,
                                height: bookThickness,
                                transformOrigin: 'top center',
                                transform: 'rotateX(-90deg)',
                            }}
                        />
                        <div
                            className={cn(
                                'absolute bottom-full left-0 flex items-center justify-center gap-1.5 border border-black/30 text-[7px] leading-none font-semibold whitespace-nowrap tabular-nums',
                                colors.spine,
                                colors.text,
                            )}
                            style={{
                                width: bookWidth,
                                height: bookThickness,
                                transformOrigin: 'bottom center',
                                transform: 'rotateX(90deg)',
                            }}
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                className="h-[70%] w-auto object-contain"
                            />
                            {book.label}
                        </div>
                    </motion.div>
                );
            })}

            <button
                type="button"
                onClick={onToggle}
                disabled={locked}
                aria-expanded={open}
                aria-label={`${drawer.label}, ${drawer.range}, ${drawer.books.length} books`}
                className={cn(
                    'absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-neutral-400 bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-default dark:border-neutral-600 dark:bg-neutral-700',
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
                <span className="max-w-[85%] truncate border border-neutral-400 bg-white px-1.5 py-0.5 text-[9px] leading-none font-semibold text-neutral-700 dark:border-neutral-500 dark:bg-neutral-200 dark:text-neutral-900">
                    {drawer.label}
                </span>
                <span
                    aria-hidden="true"
                    className="h-1.5 w-10 rounded-full bg-neutral-500 dark:bg-neutral-400"
                />
            </button>
        </motion.div>
    );
}
