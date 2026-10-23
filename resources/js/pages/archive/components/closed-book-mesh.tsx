import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import BookCoverFace from '@/pages/manage/books/book-cover-face';
import type { BookCover } from '../data/cabinets';

const COVER_ART_W = 440;
const COVER_ART_H = 595;

export default function ClosedBookMesh({
    depth,
    label,
    coverTitle,
    cover,
    showTitle,
    showCover,
    headCap = false,
    documentCount = 0,
}: {
    width?: number;
    height?: number;
    depth: number;
    label: string;
    coverTitle: string;
    cover: BookCover;
    showTitle?: boolean;
    showCover?: boolean;
    headCap?: boolean;
    documentCount?: number;
}) {
    const spineTextClass = showCover
        ? 'text-lg tracking-[0.08em]'
        : depth >= 120
          ? 'text-sm tracking-[0.08em]'
          : 'text-[6px]';

    return (
        <div
            className="relative h-full w-full"
            style={
                {
                    transformStyle: 'preserve-3d',
                    '--d': `var(--book-depth, ${depth}px)`,
                } as CSSProperties
            }
        >
            <div
                data-book-head
                className={cn(
                    'book-page-edge absolute border border-black/10',
                    headCap ? 'inset-x-0 bottom-0 h-[10%]' : 'inset-0',
                )}
            />
            <div
                className="book-page-edge absolute inset-0 border border-black/10"
                style={{
                    transform: 'translateZ(calc(-1 * var(--d)))',
                }}
            />
            <div
                className={cn(
                    'book-cover-linen absolute right-full overflow-hidden border border-black/20',
                    cover.cover,
                    cover.text,
                )}
                style={{
                    top: 0,
                    width: 'var(--d)',
                    height: '100%',
                    transformOrigin: 'right center',
                    transform: 'rotateY(-90deg)',
                }}
            />
            <div
                className={cn(
                    'book-cover-linen absolute left-full overflow-hidden border border-black/20',
                    cover.cover,
                    cover.text,
                )}
                style={{
                    top: 0,
                    width: 'var(--d)',
                    height: '100%',
                    transformOrigin: 'left center',
                    transform: 'rotateY(90deg)',
                    containerType: 'size',
                }}
            >
                {showCover ? (
                    <div
                        className="absolute"
                        style={{
                            top: '50%',
                            left: '50%',
                            width: COVER_ART_W,
                            height: COVER_ART_H,
                            transform: `translate(-50%, -50%) rotate(90deg) scale(var(--cover-scale, min(100cqw / ${COVER_ART_H}, 100cqh / ${COVER_ART_W})))`,
                        }}
                    >
                        <BookCoverFace title={coverTitle} size="open" />
                    </div>
                ) : null}
            </div>
            <div
                aria-hidden="true"
                className="book-page-edge absolute top-full left-0 border border-black/10"
                style={{
                    width: '100%',
                    height: 'var(--d)',
                    transformOrigin: 'top center',
                    transform: 'rotateX(-90deg)',
                }}
            />
            <div
                className={cn(
                    'book-cover-linen absolute bottom-full left-0 overflow-hidden border border-black/30',
                    cover.cover,
                    cover.text,
                )}
                style={{
                    width: '100%',
                    height: 'var(--d)',
                    transformOrigin: 'bottom center',
                    transform: 'rotateX(90deg)',
                }}
            >
                {showTitle ? (
                    <div className="flex h-full w-full items-center justify-center px-px py-1">
                        <span
                            className={cn(
                                'max-h-full overflow-hidden leading-none font-semibold [text-orientation:upright] [writing-mode:vertical-rl]',
                                spineTextClass,
                            )}
                        >
                            {label}
                        </span>
                    </div>
                ) : null}
                {documentCount > 0 ? (
                    <span
                        aria-hidden="true"
                        className="absolute bottom-0.5 left-1/2 h-0.5 w-2/3 -translate-x-1/2 bg-blue-200/90"
                    />
                ) : null}
            </div>
        </div>
    );
}
