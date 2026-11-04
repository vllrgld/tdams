import { motion, type Transition } from 'motion/react';
import { memo, type CSSProperties, type ReactNode } from 'react';
import {
    COVER_LOGO_SIZE,
    coverTitleLines,
} from '@/pages/manage/books/book-cover-face';
import { DEFAULT_COVER_TITLE } from '../../data/cabinets';

export const FOLDER_ASPECT_RATIO = 297 / 210;

const REAR_OUTLINE =
    'M 26 -42 H 470 Q 498 -42 498 -18 Q 498 0 524 0 H 974 Q 1000 0 1000 26 V 707 H 0 V -16 Q 0 -42 26 -42 Z';
const FRONT_OUTLINE =
    'M 26 48 H 450 Q 478 48 490 24 Q 502 0 528 0 H 974 Q 1000 0 1000 26 V 707 H 0 V 74 Q 0 48 26 48 Z';

type FolderDetail = 'full' | 'closed';

function FolderPaperEdges({ depth }: { depth: number }) {
    const thickness = depth * 0.8;
    const front = -depth * 0.1;

    return (
        <>
            {['1%', '99%'].map((left) => (
                <div
                    key={left}
                    data-folder-paper-edge
                    aria-hidden="true"
                    className="folder-paper-edge pointer-events-none absolute top-[4%] h-[94%]"
                    style={{
                        left,
                        width: thickness,
                        transformOrigin: 'left top',
                        transform: `translateZ(${front}px) rotateY(90deg)`,
                    }}
                />
            ))}
            {['4%', '98%'].map((top) => (
                <div
                    key={top}
                    data-folder-paper-edge
                    aria-hidden="true"
                    className="folder-paper-edge folder-paper-edge-head pointer-events-none absolute inset-x-[1%]"
                    style={{
                        top,
                        height: thickness,
                        transformOrigin: 'left top',
                        transform: `translateZ(${front}px) rotateX(-90deg)`,
                    }}
                />
            ))}
        </>
    );
}

function FolderCover({
    detail,
    open,
    transition,
    onComplete,
    children,
}: {
    detail: FolderDetail;
    open: boolean;
    transition: Transition;
    onComplete?: () => void;
    children: ReactNode;
}) {
    const style: CSSProperties = {
        transformStyle: 'preserve-3d',
        transformOrigin: '50% 100%',
    };

    // Drawer folders only move as a whole; their covers never animate there.
    if (detail === 'closed') {
        return (
            <div data-folder-cover className="absolute inset-0" style={style}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            data-folder-cover
            className="absolute inset-0"
            style={style}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: open ? -158 : 0 }}
            transition={transition}
            onAnimationComplete={(definition) => {
                if (
                    typeof definition === 'object' &&
                    'rotateX' in definition &&
                    definition.rotateX === (open ? -158 : 0)
                )
                    onComplete?.();
            }}
        >
            {children}
        </motion.div>
    );
}

function FolderCoverSurface({
    rear = false,
    reverse = false,
}: {
    rear?: boolean;
    reverse?: boolean;
}) {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 1000 707"
            preserveAspectRatio="none"
        >
            <path
                d={rear ? REAR_OUTLINE : FRONT_OUTLINE}
                transform={reverse ? 'translate(0 707) scale(1 -1)' : undefined}
                fill={rear ? '#f8fafc' : '#ffffff'}
                stroke="#cbd5e1"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

/** A paper folder with a raised rear tab, a folded front, and a paper stack. */
const ClosedFolderMesh = memo(function ClosedFolderMesh({
    label,
    coverTitle = DEFAULT_COVER_TITLE,
    coverSize = 'open',
    depth,
    showLabel = true,
    open = false,
    transition = { duration: 0 },
    onCoverComplete,
    content,
    insideCover,
    detail = 'full',
}: {
    label: string;
    coverTitle?: string;
    coverSize?: keyof typeof COVER_LOGO_SIZE;
    depth: number;
    showLabel?: boolean;
    open?: boolean;
    transition?: Transition;
    onCoverComplete?: () => void;
    content?: ReactNode;
    insideCover?: ReactNode;
    detail?: FolderDetail;
}) {
    return (
        <div
            data-folder-mesh
            className="relative h-full w-full"
            style={
                {
                    transformStyle: 'preserve-3d',
                    '--folder-depth': `${depth}px`,
                } as CSSProperties
            }
        >
            <div
                data-folder-rear
                className="absolute inset-0"
                style={{
                    transform: 'translateZ(calc(-1 * var(--folder-depth)))',
                    transformStyle: 'preserve-3d',
                }}
            >
                <FolderCoverSurface rear />
                <div
                    data-folder-tab-front
                    className="absolute -top-[6%] left-[5%] flex h-[8%] w-[42%] items-center overflow-hidden px-[2%]"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0.1px)',
                    }}
                >
                    {showLabel && (
                        <span className="truncate text-[clamp(6px,4cqw,18px)] font-medium text-slate-800">
                            {label}
                        </span>
                    )}
                </div>
            </div>
            {detail === 'closed' ? (
                <FolderPaperEdges depth={depth} />
            ) : (
                <>
                    {Array.from({ length: 8 }, (_, index) => (
                        <div
                            key={index}
                            data-folder-paper-layer
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-[1%] top-[4%] bottom-[2%] border border-slate-300/70 bg-white"
                            style={{
                                transform: `translateZ(${-depth * (0.9 - index * 0.1)}px)`,
                            }}
                        />
                    ))}
                    <div
                        data-folder-paper
                        className="absolute inset-x-[1%] top-[4%] bottom-[2%] border border-slate-200 bg-white"
                        style={{
                            transform:
                                'translateZ(calc(-0.1 * var(--folder-depth)))',
                        }}
                    >
                        {content}
                    </div>
                </>
            )}
            {/* A continuous fold joins the straight hinge edges of both covers.
                Keep it on the body so opening the cover cannot rotate it outward. */}
            <div
                data-folder-fold
                aria-hidden="true"
                className="pointer-events-none absolute top-full left-0 w-full border border-slate-200 bg-slate-50"
                style={{
                    height: depth,
                    transformOrigin: 'top center',
                    transform: 'rotateX(-90deg)',
                }}
            />
            <FolderCover
                detail={detail}
                open={open}
                transition={transition}
                onComplete={onCoverComplete}
            >
                <div
                    data-folder-front
                    className="absolute inset-0"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <FolderCoverSurface />
                    {/* Center the print on the cover area below its curved shoulder. */}
                    <div className="absolute inset-x-0 top-[3%] bottom-0 flex items-center justify-center">
                        <div
                            data-folder-cover-title
                            className="flex -rotate-90 flex-col items-center text-slate-800"
                            style={{
                                width: '64%',
                                gap: coverSize === 'open' ? 20 : 12,
                            }}
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                draggable={false}
                                className="shrink-0 object-contain opacity-90"
                                style={{
                                    width: COVER_LOGO_SIZE[coverSize],
                                    height: COVER_LOGO_SIZE[coverSize],
                                }}
                            />
                            {showLabel && (
                                <p className="w-full text-center font-cinzel text-[clamp(8px,5cqw,26px)] leading-tight font-semibold break-words">
                                    {coverTitleLines(coverTitle).map(
                                        (line, index) => (
                                            <span
                                                key={`${index}-${line}`}
                                                className="block"
                                            >
                                                {line}
                                            </span>
                                        ),
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {detail === 'full' && (
                    <div
                        data-folder-inside-cover
                        className="absolute inset-0"
                        style={{
                            transform: 'rotateX(180deg)',
                            backfaceVisibility: 'hidden',
                        }}
                    >
                        <FolderCoverSurface reverse />
                        {insideCover}
                    </div>
                )}
            </FolderCover>
        </div>
    );
});

export default ClosedFolderMesh;
