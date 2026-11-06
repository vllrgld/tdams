import {
    useId,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { BOOK_COVER } from '@/lib/filing-appearance';
import type { FilingKind } from '@/types/filing';
import ClosedFolderMesh, {
    FOLDER_ASPECT_RATIO,
} from '@/components/filing/folders/closed-folder-mesh';
import BookCoverFace from './books/book-cover-face';

const BOOK_W = 260;
const BOOK_H = 360;
const BOOK_D = 56;
const REST = { x: 8, y: -28 };
const MAX_TILT = 22;

export default function RotatableFilingItem({
    label,
    coverTitle,
    compact = false,
    kind = 'book',
    upright = false,
}: {
    label: string;
    coverTitle: string;
    compact?: boolean;
    kind?: FilingKind;
    upright?: boolean;
}) {
    const instructionsId = useId();
    const scale = compact ? 0.8 : 1;
    const portrait = kind === 'folder' && upright;
    const folderWidth = portrait ? BOOK_H : 300;
    const width = (kind === 'folder' ? folderWidth : BOOK_W) * scale;
    const height =
        (kind === 'folder' ? folderWidth / FOLDER_ASPECT_RATIO : BOOK_H) *
        scale;
    const dragRef = useRef<{
        pointerId: number;
        x: number;
        y: number;
        rotX: number;
        rotY: number;
    } | null>(null);
    const [rotation, setRotation] = useState(REST);

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
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

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (
            ![
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Home',
            ].includes(event.key)
        )
            return;
        event.preventDefault();
        if (event.key === 'Home') {
            setRotation(REST);
            return;
        }
        setRotation((current) => ({
            x: Math.min(
                MAX_TILT,
                Math.max(
                    -MAX_TILT,
                    current.x +
                        (event.key === 'ArrowUp'
                            ? 5
                            : event.key === 'ArrowDown'
                              ? -5
                              : 0),
                ),
            ),
            y:
                current.y +
                (event.key === 'ArrowLeft'
                    ? -10
                    : event.key === 'ArrowRight'
                      ? 10
                      : 0),
        }));
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
                style={{
                    perspective: '1200px',
                    width: portrait ? height : undefined,
                    minHeight: portrait ? width + 48 : undefined,
                }}
            >
                <div
                    role="group"
                    aria-label={`${label} ${kind} preview`}
                    aria-describedby={instructionsId}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onLostPointerCapture={() => {
                        dragRef.current = null;
                    }}
                    className="relative shrink-0 cursor-grab touch-none outline-offset-8 select-none focus-visible:outline-2 focus-visible:outline-blue-900 active:cursor-grabbing dark:focus-visible:outline-blue-200"
                    style={{
                        width,
                        height,
                        containerType: 'inline-size',
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)${portrait ? ' rotateZ(90deg)' : ''}`,
                    }}
                >
                    {kind === 'folder' ? (
                        <ClosedFolderMesh
                            label={label}
                            coverTitle={coverTitle}
                            coverSize="preview"
                            depth={14 * scale}
                        />
                    ) : (
                        <>
                            <div
                                className={cn(
                                    'absolute inset-0 overflow-hidden border border-black/30 shadow-xl',
                                    BOOK_COVER.cover,
                                    BOOK_COVER.text,
                                )}
                                style={{ transform: 'translateZ(0px)' }}
                            >
                                <BookCoverFace
                                    title={coverTitle}
                                    size="preview"
                                />
                            </div>
                            <div
                                className={cn(
                                    'book-cover-linen absolute inset-0 border border-black/30',
                                    BOOK_COVER.cover,
                                )}
                                style={{
                                    transform: `translateZ(${-BOOK_D * scale}px)`,
                                }}
                            />
                            <div
                                className={cn(
                                    'book-cover-linen absolute top-0 right-full overflow-hidden border border-black/25',
                                    BOOK_COVER.cover,
                                    BOOK_COVER.text,
                                )}
                                style={{
                                    width: BOOK_D * scale,
                                    height: BOOK_H * scale,
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
                                    width: BOOK_D * scale,
                                    height,
                                    transformOrigin: 'left center',
                                    transform: 'rotateY(90deg)',
                                }}
                            />
                            <div
                                className="book-page-edge-head absolute bottom-full left-0 border border-black/10"
                                style={{
                                    width,
                                    height: BOOK_D * scale,
                                    transformOrigin: 'bottom center',
                                    transform: 'rotateX(90deg)',
                                }}
                            />
                            <div
                                className="book-page-edge-head absolute top-full left-0 border border-black/10"
                                style={{
                                    width,
                                    height: BOOK_D * scale,
                                    transformOrigin: 'top center',
                                    transform: 'rotateX(-90deg)',
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
            <p
                id={instructionsId}
                className="text-center text-xs text-slate-600 dark:text-neutral-400"
            >
                Drag or use arrow keys to rotate.{' '}
                <button
                    type="button"
                    onClick={() => setRotation(REST)}
                    className="text-slate-600 underline-offset-2 hover:text-blue-900 hover:underline dark:text-neutral-400 dark:hover:text-blue-200"
                >
                    Reset view
                </button>
            </p>
        </div>
    );
}
