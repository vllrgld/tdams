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
import { filingCover } from '@/lib/filing-appearance';
import type {
    FilingItemCover,
    FilingItemOrigin,
    CabinetFilingItem,
    CabinetDrawer as CabinetDrawerData,
} from '@/types/filing';
import { useFilingItemPortal } from '../shared/filing-item-portal';
import { measureHoverAndRestPose } from '../shared/filing-item-pose';
import ClosedBookMesh from '../books/closed-book-mesh';
import ClosedFolderMesh, {
    FOLDER_ASPECT_RATIO,
    FOLDER_COVER_WIDTH,
} from '../folders/closed-folder-mesh';

const BOOKS_PER_ROW = 8;
const ROW_COUNT = 2;
const MAX_VISIBLE_BOOKS = BOOKS_PER_ROW * ROW_COUNT;
const BOOK_INNER_PAD = 8;
const BOOK_GAP = 2;
const FOLDER_CLOSEUP_TILT = 10;

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
    previewBookId?: string | null;
    transition: Transition;
    insideRef?: Ref<HTMLButtonElement>;
    onToggle: () => void;
    onViewInside: () => void;
    openedItemId?: string | null;
    onOpenItem?: (
        book: CabinetFilingItem,
        cover: FilingItemCover,
        origin: FilingItemOrigin,
    ) => void;
};

function drawerRimOffset(height: number): number {
    return Math.min(12, height * 0.08);
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
    previewBookId,
    transition,
    insideRef,
    onToggle,
    onViewInside,
    openedItemId,
    onOpenItem,
}: CabinetDrawerProps) {
    const portal = useFilingItemPortal();
    const [focusPeek, setFocusPeek] = useState(false);
    const [pointerOver, setPointerOver] = useState(false);
    const [insideHovered, setInsideHovered] = useState(false);
    const [peekLocked, setPeekLocked] = useState(false);
    const [popsFrozen, setPopsFrozen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [booksHeldOpen, setBooksHeldOpen] = useState(showBooks);
    const previousOpen = useRef(open);
    const previousOpenedItemId = useRef(openedItemId);
    const isCloseup = Boolean(onOpenItem);
    const folders = drawer.books[0]?.kind === 'folder';
    const itemName = folders ? 'folder' : 'book';
    const pullHeight = isCloseup ? 64 : Math.min(26, height * 0.42);
    const pullPadding = isCloseup ? 5 : 2;
    const pullSlotHeight = Math.max(0, pullHeight - pullPadding * 2) * 0.3;
    const pullGripHeight = Math.max(
        0,
        pullHeight - pullPadding * 2 - pullSlotHeight - 2,
    );
    const pullTop = Math.min(height * 0.14, isCloseup ? 48 : 18);
    const documentTotal = drawer.books.reduce(
        (total, book) => total + book.documentCount,
        0,
    );
    const description = [
        drawer.label,
        drawer.range,
        `${drawer.books.length} ${itemName}${drawer.books.length === 1 ? '' : 's'}`,
        documentTotal > 0
            ? `${documentTotal} ${documentTotal === 1 ? 'document' : 'documents'}`
            : null,
    ]
        .filter(Boolean)
        .join(', ');
    const booksVisible = showBooks || booksHeldOpen;
    const visibleBooks = booksVisible
        ? drawer.books.slice(0, MAX_VISIBLE_BOOKS)
        : [];
    if (
        booksVisible &&
        previewBookId &&
        !visibleBooks.some((book) => book.id === previewBookId)
    ) {
        const selectedBook = drawer.books.find(
            (book) => book.id === previewBookId,
        );

        // Keep the selected item visible in drawers with more than 16 items.
        if (selectedBook) {
            visibleBooks[visibleBooks.length - 1] = selectedBook;
        }
    }
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
    const sideTop = isCloseup ? height * 0.15 : drawerRimOffset(height);
    const sideHeight = height - sideTop;
    const insideEnabled = open && !locked && !isCloseup;
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
        const previous = previousOpenedItemId.current;
        previousOpenedItemId.current = openedItemId;

        if (openedItemId) {
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
    }, [openedItemId]);

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
            onPointerOver={(event) => {
                setInsideHovered(
                    event.target instanceof Element &&
                        Boolean(event.target.closest('[data-drawer-interior]')),
                );
            }}
            onPointerLeave={() => {
                setPointerOver(false);
                setInsideHovered(false);
                setPeekLocked(false);
                setPopsFrozen(false);
                setHoveredId(null);
            }}
            transition={transition}
        >
            <div
                aria-hidden="true"
                className="cabinet-drawer-side absolute left-0"
                style={side}
            />
            <div
                aria-hidden="true"
                className="cabinet-drawer-side cabinet-drawer-side-shade absolute left-full"
                style={side}
            />
            <div
                aria-hidden="true"
                className="cabinet-vector-well absolute top-full left-0"
                style={{
                    width,
                    height: depth,
                    transformOrigin: 'top center',
                    transform: 'rotateX(-90deg)',
                }}
            />
            <div
                aria-hidden="true"
                className="cabinet-vector-well absolute left-0"
                style={{
                    top: sideTop,
                    width,
                    height: sideHeight,
                    transform: `translateZ(${-depth}px)`,
                }}
            />

            <button
                ref={insideRef}
                data-drawer-interior
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
                    insideEnabled &&
                        insideHovered &&
                        'border-blue-800 bg-blue-600/40 ring-2 ring-blue-800/50',
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
                const colors = filingCover(book.kind);
                const folder = book.kind === 'folder';
                const row = Math.floor(index / BOOKS_PER_ROW);
                const col = index % BOOKS_PER_ROW;
                const itemHeight = folder
                    ? Math.min(
                          // Include the raised rear tab in the preview clearance.
                          isCloseup ? height * 0.98 : bookHeight / 1.06,
                          usableWidth / FOLDER_ASPECT_RATIO,
                      )
                    : bookHeight;
                const itemWidth = folder
                    ? itemHeight * FOLDER_ASPECT_RATIO
                    : bookWidth;
                const itemDepth = folder
                    ? Math.max(2, (usableDepth / MAX_VISIBLE_BOOKS) * 0.28)
                    : coverDepth;
                const bookLeft = folder
                    ? (width - itemWidth) / 2
                    : innerPad + col * colStride + (colStride - bookWidth) / 2;
                const folderTilt =
                    folder && isCloseup ? FOLDER_CLOSEUP_TILT : 0;
                // Leave room for the leaning rear tab behind the final folder.
                const folderSlotDepth =
                    usableDepth -
                    Math.sin((folderTilt * Math.PI) / 180) * itemHeight * 1.06;
                const bookZ = folder
                    ? -(
                          innerPad +
                          (index * folderSlotDepth) / MAX_VISIBLE_BOOKS
                      )
                    : -(innerPad + row * (rowDepth + aisle));
                const previewSelected = open && previewBookId === book.id;
                const popLift = previewSelected
                    ? -Math.min(40, itemHeight * 0.6)
                    : isCloseup
                      ? -56
                      : -18;
                const showTitle = isCloseup || coverDepth >= 28;
                const host = portal?.host ?? null;
                const lifted =
                    openedItemId === book.id && (folder || host !== null);
                const canPop = !lifted && !popsFrozen && (!folder || isCloseup);
                const poppedUp =
                    previewSelected || (canPop && hoveredId === book.id);
                const mesh = folder ? (
                    <ClosedFolderMesh
                        detail="closed"
                        coverScale={itemWidth / FOLDER_COVER_WIDTH}
                        label={book.label}
                        coverTitle={book.coverTitle}
                        depth={itemDepth}
                        showLabel={isCloseup || previewSelected}
                    />
                ) : (
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
                    if (insideEnabled) {
                        onViewInside();
                        return;
                    }

                    if (!onOpenItem || lifted) {
                        return;
                    }

                    const visual = slot.querySelector('[data-book-visual]');

                    if (!(visual instanceof HTMLElement)) {
                        return;
                    }

                    onOpenItem(
                        book,
                        colors,
                        measureHoverAndRestPose(visual, 'none', itemDepth),
                    );
                };

                return (
                    <div
                        key={book.id}
                        data-preview-selected={previewSelected || undefined}
                        data-drawer-interior={insideEnabled || undefined}
                        ref={(node) => {
                            portal?.registerSlot(book.id, node);
                        }}
                        role={onOpenItem ? 'button' : undefined}
                        tabIndex={onOpenItem && !lifted ? 0 : -1}
                        aria-hidden={lifted || undefined}
                        aria-label={
                            onOpenItem ? `Open ${book.label}` : book.label
                        }
                        className={cn(
                            'absolute bottom-0',
                            insideEnabled && 'cursor-zoom-in',
                            onOpenItem && !lifted && 'cursor-pointer',
                            lifted && 'pointer-events-none',
                            poppedUp && 'z-10',
                        )}
                        style={{
                            left: bookLeft,
                            width: itemWidth,
                            height: itemHeight,
                            transform: `translateZ(${bookZ}px)${folderTilt ? ` rotateX(${folderTilt}deg)` : ''}`,
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
                        {folder && (
                            <div
                                aria-hidden="true"
                                className="absolute -top-[6%] left-0 h-[8%] w-[52%]"
                            />
                        )}
                        <div
                            aria-hidden="true"
                            className="absolute top-0 left-full h-full"
                            style={{
                                width: itemDepth,
                                transformOrigin: 'left center',
                                transform: 'rotateY(90deg)',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            className="absolute bottom-full left-0 w-full"
                            style={{
                                height: itemDepth,
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
                                visibility:
                                    lifted && folder ? 'hidden' : undefined,
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
                            {lifted && host && !folder
                                ? createPortal(mesh, host)
                                : mesh}
                        </motion.div>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={onToggle}
                disabled={locked}
                aria-expanded={open}
                aria-label={description}
                className={cn(
                    'cabinet-vector-front absolute inset-0 flex cursor-pointer justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-default',
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
                        'cabinet-pull',
                        isCloseup && 'cabinet-pull-closeup',
                    )}
                    style={{
                        top: pullTop,
                        width: Math.min(isCloseup ? 144 : 44, width * 0.28),
                        height: pullHeight - pullGripHeight * 0.25,
                    }}
                >
                    <span
                        aria-hidden="true"
                        className="cabinet-pull-slot"
                        style={{ height: pullSlotHeight }}
                    />
                    <span aria-hidden="true" className="cabinet-pull-grip" />
                </span>
                <span
                    className={cn(
                        'absolute left-1/2 flex w-[82%] -translate-x-1/2 items-center justify-center',
                        isCloseup ? 'gap-3 text-lg' : 'gap-1 text-[8px]',
                        'leading-none',
                    )}
                    style={{ bottom: Math.max(4, height * 0.1) }}
                >
                    <span
                        className={cn(
                            'cabinet-label-holder truncate font-semibold',
                            isCloseup ? 'text-lg' : 'text-[8px]',
                            'leading-none',
                        )}
                    >
                        {drawer.label}
                    </span>
                    <span
                        className={cn(
                            'cabinet-vector-count font-semibold whitespace-nowrap tabular-nums',
                            isCloseup ? 'text-sm' : 'text-[8px]',
                            'leading-none',
                        )}
                    >
                        {drawer.books.length} {itemName}
                        {drawer.books.length === 1 ? '' : 's'}
                    </span>
                </span>
            </button>
        </motion.div>
    );
}
