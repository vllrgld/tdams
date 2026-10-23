import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { BOOK_COVER } from '@/pages/archive/data/cabinets';
import BookCoverFace from './book-cover-face';

const BOOK_W = 260;
const BOOK_H = 360;
const BOOK_D = 56;
const REST = { x: 8, y: -28 };
const MAX_TILT = 22;

export default function RotatableClosedBook({
    label,
    coverTitle,
}: {
    label: string;
    coverTitle: string;
}) {
    const reduceMotion = useReducedMotion();
    const dragRef = useRef<{
        pointerId: number;
        x: number;
        y: number;
        rotX: number;
        rotY: number;
    } | null>(null);
    const [rotation, setRotation] = useState(REST);
    const canDrag = reduceMotion !== true;

    useEffect(() => {
        if (reduceMotion) {
            setRotation(REST);
        }
    }, [reduceMotion]);

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (!canDrag || event.button !== 0) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            rotX: rotation.x,
            rotY: rotation.y,
        };
    }

    function onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current;

        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        const nextX = drag.rotX - (event.clientY - drag.y) * 0.35;
        const nextY = drag.rotY + (event.clientX - drag.x) * 0.4;

        setRotation({
            x: Math.min(MAX_TILT, Math.max(-MAX_TILT, nextX)),
            y: nextY,
        });
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>) {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="flex items-center justify-center py-6"
                style={{ perspective: '1200px' }}
            >
                <div
                    role="img"
                    aria-label={`${label} book preview`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className={cn(
                        'relative touch-none select-none',
                        canDrag && 'cursor-grab active:cursor-grabbing',
                    )}
                    style={{
                        width: BOOK_W,
                        height: BOOK_H,
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    }}
                >
                    <div
                        className={cn(
                            'absolute inset-0 overflow-hidden border border-black/30 shadow-xl',
                            BOOK_COVER.cover,
                            BOOK_COVER.text,
                        )}
                        style={{ transform: 'translateZ(0px)' }}
                    >
                        <BookCoverFace title={coverTitle} size="preview" />
                    </div>
                    <div
                        className={cn(
                            'book-cover-linen absolute inset-0 border border-black/30',
                            BOOK_COVER.cover,
                        )}
                        style={{ transform: `translateZ(${-BOOK_D}px)` }}
                    />
                    <div
                        className={cn(
                            'book-cover-linen absolute top-0 right-full overflow-hidden border border-black/25',
                            BOOK_COVER.cover,
                            BOOK_COVER.text,
                        )}
                        style={{
                            width: BOOK_D,
                            height: BOOK_H,
                            transformOrigin: 'right center',
                            transform: 'rotateY(-90deg)',
                        }}
                    >
                        <div className="flex h-full w-full items-center justify-center px-1 py-5">
                            <span className="max-h-full overflow-hidden text-xs leading-none font-semibold tracking-[0.12em] [text-orientation:upright] [writing-mode:vertical-rl]">
                                {label}
                            </span>
                        </div>
                    </div>
                    <div
                        className="book-page-edge absolute top-0 left-full border border-black/10"
                        style={{
                            width: BOOK_D,
                            height: BOOK_H,
                            transformOrigin: 'left center',
                            transform: 'rotateY(90deg)',
                        }}
                    />
                    <div
                        className="book-page-edge-head absolute bottom-full left-0 border border-black/10"
                        style={{
                            width: BOOK_W,
                            height: BOOK_D,
                            transformOrigin: 'bottom center',
                            transform: 'rotateX(90deg)',
                        }}
                    />
                    <div
                        className="book-page-edge-head absolute top-full left-0 border border-black/10"
                        style={{
                            width: BOOK_W,
                            height: BOOK_D,
                            transformOrigin: 'top center',
                            transform: 'rotateX(-90deg)',
                        }}
                    />
                </div>
            </div>
            {canDrag && (
                <p className="text-center text-xs text-slate-500 dark:text-neutral-500">
                    Drag to rotate.{' '}
                    <button
                        type="button"
                        onClick={() => setRotation(REST)}
                        className="text-slate-600 underline-offset-2 hover:text-blue-900 hover:underline dark:text-neutral-400 dark:hover:text-blue-200"
                    >
                        Reset view
                    </button>
                </p>
            )}
        </div>
    );
}
