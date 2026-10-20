import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUpRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import DocumentThumbnail from './document-thumbnail';
import { declarationYear } from '../lib/formatters';
import type {
    ArchivedDocument,
    DocumentChainResponse,
    PreviousDeclarationEntry,
} from '../types';

const arrowDotCount = 7;
const arrowDotStaggerMs = 65;
const arrowDotDurationMs = 135;
const arrowheadDurationMs = 170;
const arrowheadDelayMs =
    (arrowDotCount - 1) * arrowDotStaggerMs + arrowDotDurationMs;
const arrowSequenceDurationMs = arrowheadDelayMs + arrowheadDurationMs;
const dragThresholdPx = 6;
const momentumFriction = 0.0038;
const momentumMinVelocity = 0.02;
const momentumMaxVelocity = 2.6;

type ChainCard = {
    id: string;
    year: string;
    title: string;
    label: string;
    archived: ArchivedDocument | null;
    isOrigin: boolean;
};

type DocumentChainProps = {
    document: ArchivedDocument | null;
    onOpenChange: (open: boolean) => void;
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentChain({
    document,
    onOpenChange,
    onViewDocument,
}: DocumentChainProps) {
    const [chainCards, setChainCards] = useState<ChainCard[]>([]);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const originCardRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        pointerId: number;
        startX: number;
        startScrollLeft: number;
    } | null>(null);
    const suppressClickRef = useRef(false);
    const velocityRef = useRef(0);
    const lastMoveRef = useRef<{ x: number; t: number } | null>(null);
    const momentumFrameRef = useRef<number | null>(null);

    const cancelMomentum = () => {
        if (momentumFrameRef.current !== null) {
            cancelAnimationFrame(momentumFrameRef.current);
            momentumFrameRef.current = null;
        }
    };

    const startMomentum = () => {
        const scroller = scrollerRef.current;

        if (
            !scroller ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        let velocity = Math.max(
            -momentumMaxVelocity,
            Math.min(momentumMaxVelocity, velocityRef.current),
        );

        if (Math.abs(velocity) < momentumMinVelocity) {
            return;
        }

        cancelMomentum();

        let lastTime = performance.now();

        const tick = (now: number) => {
            const node = scrollerRef.current;

            if (!node) {
                momentumFrameRef.current = null;
                return;
            }

            const dt = Math.min(32, now - lastTime);
            lastTime = now;
            velocity *= Math.exp(-momentumFriction * dt);

            if (Math.abs(velocity) < momentumMinVelocity) {
                momentumFrameRef.current = null;
                return;
            }

            const next = clampScrollLeft(node, node.scrollLeft + velocity * dt);
            const max = Math.max(0, node.scrollWidth - node.clientWidth);

            node.scrollLeft = next;

            if (next <= 0 || next >= max) {
                momentumFrameRef.current = null;
                return;
            }

            momentumFrameRef.current = requestAnimationFrame(tick);
        };

        momentumFrameRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        setHoveredId(null);
        cancelMomentum();

        if (!document) {
            setChainCards([]);
            setSelectedId(null);
            setLoadingPrevious(false);
            return;
        }

        const originCard = toCurrentCard(document);

        setChainCards([originCard]);
        setSelectedId(null);

        const controller = new AbortController();

        setLoadingPrevious(true);

        fetch(`/documents/${document.id}/chain`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load document chain.');
                }

                return (await response.json()) as DocumentChainResponse;
            })
            .then((chain) => {
                setChainCards(toChainCards(chain.entries, chain.originId));
                setLoadingPrevious(false);
            })
            .catch((error: Error) => {
                if (error.name !== 'AbortError') {
                    setChainCards([originCard]);
                    setLoadingPrevious(false);
                }
            });

        return () => {
            controller.abort();
            cancelMomentum();
        };
    }, [document]);

    useLayoutEffect(() => {
        originCardRef.current?.scrollIntoView({
            inline: 'center',
            block: 'nearest',
        });
    }, [chainCards]);

    const stopDrag = (pointerId: number, withMomentum: boolean) => {
        const scroller = scrollerRef.current;

        try {
            if (scroller?.hasPointerCapture(pointerId)) {
                scroller.releasePointerCapture(pointerId);
            }
        } catch {
            // Pointer may already have been released.
        }

        const shouldCoast = withMomentum && suppressClickRef.current;

        dragRef.current = null;
        lastMoveRef.current = null;
        setIsDragging(false);

        if (shouldCoast) {
            startMomentum();
        }

        window.setTimeout(() => {
            suppressClickRef.current = false;
        }, 0);
    };

    if (!document) {
        return null;
    }

    const cards =
        chainCards.length > 0 ? chainCards : [toCurrentCard(document)];
    const originIndex = cards.findIndex((card) => card.isOrigin);

    const overlay = (
        <div
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange(false);
                    setSelectedId(null);
                }
            }}
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden backdrop-blur-[4px]"
        >
            <div
                ref={scrollerRef}
                role="group"
                aria-busy={loadingPrevious}
                aria-label="Documents ordered from oldest to newest"
                onPointerDown={(event) => {
                    if (event.button !== 0) {
                        return;
                    }

                    if (
                        event.target instanceof Element &&
                        event.target.closest('button, a, [data-slot="button"]')
                    ) {
                        return;
                    }

                    const scroller = scrollerRef.current;

                    if (!scroller) {
                        return;
                    }

                    cancelMomentum();
                    suppressClickRef.current = false;
                    velocityRef.current = 0;
                    lastMoveRef.current = {
                        x: event.clientX,
                        t: performance.now(),
                    };
                    dragRef.current = {
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startScrollLeft: scroller.scrollLeft,
                    };

                    try {
                        scroller.setPointerCapture(event.pointerId);
                    } catch {
                        // Capture needs a real pointer; synthetic events still pan this scroller.
                    }
                }}
                onPointerMove={(event) => {
                    const drag = dragRef.current;
                    const scroller = scrollerRef.current;

                    if (
                        !drag ||
                        !scroller ||
                        drag.pointerId !== event.pointerId
                    ) {
                        return;
                    }

                    const now = performance.now();
                    const lastMove = lastMoveRef.current;
                    const delta = event.clientX - drag.startX;

                    if (lastMove) {
                        const elapsed = now - lastMove.t;

                        if (elapsed > 0 && elapsed < 64) {
                            const instant =
                                -(event.clientX - lastMove.x) / elapsed;
                            velocityRef.current =
                                velocityRef.current * 0.68 + instant * 0.32;
                        }
                    }

                    lastMoveRef.current = { x: event.clientX, t: now };

                    if (
                        !suppressClickRef.current &&
                        Math.abs(delta) < dragThresholdPx
                    ) {
                        return;
                    }

                    if (!suppressClickRef.current) {
                        suppressClickRef.current = true;
                        setIsDragging(true);
                    }

                    scroller.scrollLeft = clampScrollLeft(
                        scroller,
                        drag.startScrollLeft - delta,
                    );
                    event.preventDefault();
                }}
                onPointerUp={(event) => stopDrag(event.pointerId, true)}
                onPointerCancel={(event) => stopDrag(event.pointerId, false)}
                className={`document-chain-scroller flex max-w-[94vw] shrink-0 touch-none items-center gap-3 overflow-x-auto overflow-y-hidden px-4 pt-10 pb-16 select-none [&_canvas]:pointer-events-none [&_img]:pointer-events-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            >
                {cards.map((item, index) => {
                    const isSelected = !item.isOrigin && selectedId === item.id;
                    const isHighlighted = isSelected || hoveredId === item.id;
                    const enterDelay =
                        Math.abs(index - Math.max(originIndex, 0)) * 90;

                    return (
                        <div
                            key={item.id}
                            className="document-chain-card-enter flex shrink-0 items-center"
                            style={{ animationDelay: `${enterDelay}ms` }}
                        >
                            <div
                                ref={item.isOrigin ? originCardRef : undefined}
                                className="relative flex shrink-0 flex-col items-center gap-1.5"
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div className="flex h-6 items-center justify-center text-blue-800 dark:text-blue-300">
                                    {item.isOrigin ? (
                                        <ArrowDown
                                            aria-label="Started from this document"
                                            className="document-chain-origin-arrow size-5"
                                        />
                                    ) : null}
                                </div>
                                <span
                                    className={`text-base font-bold tracking-wide text-slate-700 transition duration-200 dark:text-neutral-200 ${
                                        isHighlighted
                                            ? 'scale-110 text-blue-800 dark:text-blue-300'
                                            : ''
                                    }`}
                                >
                                    {item.year}
                                </span>
                                <article
                                    onClick={() => {
                                        if (suppressClickRef.current) {
                                            return;
                                        }

                                        setSelectedId(item.id);
                                    }}
                                    className={`group relative flex h-88 w-80 shrink-0 origin-center flex-col overflow-hidden border text-left shadow-sm transition duration-200 ${
                                        isDragging
                                            ? ''
                                            : 'hover:z-10 hover:scale-105 hover:border-blue-800 hover:shadow-lg hover:ring-2 hover:ring-blue-800/20 dark:hover:border-blue-800 dark:hover:ring-blue-800/20'
                                    } ${
                                        isSelected
                                            ? 'z-10 scale-105 border-blue-800 shadow-lg ring-2 ring-blue-800/20 dark:border-blue-800 dark:ring-blue-800/20'
                                            : 'border-slate-200 dark:border-neutral-700'
                                    }`}
                                >
                                    {item.archived ? (
                                        <div className="relative shrink-0">
                                            <DocumentThumbnail
                                                mimeType={
                                                    item.archived.mimeType
                                                }
                                                url={item.archived.viewUrl}
                                                title={
                                                    item.archived
                                                        .originalFilename
                                                }
                                                className="!h-60"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onPointerDown={(event) => {
                                                    event.stopPropagation();
                                                }}
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (!item.archived) {
                                                        return;
                                                    }

                                                    onViewDocument(
                                                        item.archived,
                                                    );
                                                    onOpenChange(false);
                                                }}
                                                aria-label={`Open ${item.title}`}
                                                title={`Open ${item.title}`}
                                                className={`absolute top-2 right-2 z-20 h-8 cursor-pointer rounded-none bg-card/95 px-2 text-xs shadow-sm dark:bg-black/95 ${
                                                    isDragging
                                                        ? 'pointer-events-none opacity-0'
                                                        : isHighlighted
                                                          ? 'opacity-100'
                                                          : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100'
                                                }`}
                                            >
                                                Open
                                                <ArrowUpRight
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex h-60 w-full shrink-0 items-center justify-center bg-slate-100 text-slate-400 dark:bg-neutral-900 dark:text-neutral-500">
                                            <FileText
                                                aria-hidden="true"
                                                className="size-10"
                                            />
                                        </div>
                                    )}
                                    <div className="flex min-h-0 flex-1 flex-col justify-center border-t border-slate-100 bg-card p-4 dark:border-neutral-800 dark:bg-black">
                                        <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                            {item.title}
                                        </p>
                                    </div>
                                </article>
                                {item.isOrigin && loadingPrevious ? (
                                    <div
                                        role="status"
                                        className="absolute top-full left-1/2 mt-4 flex -translate-x-1/2 items-center gap-2 text-sm whitespace-nowrap text-slate-700 dark:text-neutral-200"
                                    >
                                        <Spinner />
                                        Loading document chain…
                                    </div>
                                ) : null}
                            </div>
                            {index < cards.length - 1 && (
                                <div
                                    aria-hidden="true"
                                    className="w-24 shrink-0 -translate-y-3 text-blue-800 dark:text-blue-300"
                                >
                                    <svg
                                        viewBox="0 0 80 40"
                                        className="block w-full overflow-visible"
                                        fill="none"
                                    >
                                        {chainArrowDots(index).map(
                                            ([cx, cy], dotIndex) => (
                                                <circle
                                                    key={dotIndex}
                                                    cx={cx}
                                                    cy={cy}
                                                    r="1.5"
                                                    fill="currentColor"
                                                    className="document-chain-arrow-dot"
                                                    style={{
                                                        animationDelay: `${index * arrowSequenceDurationMs + dotIndex * arrowDotStaggerMs}ms`,
                                                    }}
                                                />
                                            ),
                                        )}
                                        <path
                                            d={chainArrowHead(index)}
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="document-chain-arrowhead"
                                            style={{
                                                animationDelay: `${index * arrowSequenceDurationMs + arrowheadDelayMs}ms`,
                                            }}
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (typeof window === 'undefined') {
        return overlay;
    }

    return createPortal(overlay, window.document.body);
}

function chainArrowDots(index: number): [number, number][] {
    const curve =
        index % 2 === 0
            ? {
                  p0: [2, 32] as [number, number],
                  c1: [20, 1] as [number, number],
                  c2: [48, 3] as [number, number],
                  p3: [68, 23] as [number, number],
              }
            : {
                  p0: [2, 23] as [number, number],
                  c1: [16, 40] as [number, number],
                  c2: [46, 32] as [number, number],
                  p3: [68, 18] as [number, number],
              };

    return Array.from({ length: arrowDotCount }, (_, i) =>
        cubicBezierPoint(i / (arrowDotCount - 1), curve),
    );
}

function chainArrowHead(index: number): string {
    const dots = chainArrowDots(index);
    const [fromX, fromY] = dots[dots.length - 2];
    const [toX, toY] = dots[dots.length - 1];
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const tipX = toX + ux * 11;
    const tipY = toY + uy * 11;
    const baseX = toX + ux * 1.2;
    const baseY = toY + uy * 1.2;
    const nx = -uy * 4.4;
    const ny = ux * 4.4;

    return `M ${roundCoord(baseX + nx)} ${roundCoord(baseY + ny)} L ${roundCoord(tipX)} ${roundCoord(tipY)} L ${roundCoord(baseX - nx)} ${roundCoord(baseY - ny)}`;
}

function cubicBezierPoint(
    t: number,
    curve: {
        p0: [number, number];
        c1: [number, number];
        c2: [number, number];
        p3: [number, number];
    },
): [number, number] {
    const u = 1 - t;
    const x =
        u ** 3 * curve.p0[0] +
        3 * u ** 2 * t * curve.c1[0] +
        3 * u * t ** 2 * curve.c2[0] +
        t ** 3 * curve.p3[0];
    const y =
        u ** 3 * curve.p0[1] +
        3 * u ** 2 * t * curve.c1[1] +
        3 * u * t ** 2 * curve.c2[1] +
        t ** 3 * curve.p3[1];

    return [roundCoord(x), roundCoord(Math.min(37, Math.max(3.5, y)))];
}

function roundCoord(value: number): number {
    return Number(value.toFixed(1));
}

function clampScrollLeft(scroller: HTMLDivElement, left: number): number {
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);

    return Math.min(max, Math.max(0, left));
}

function toCurrentCard(document: ArchivedDocument): ChainCard {
    return {
        id: `current-${document.id}`,
        year: declarationYear(document.declarationDate),
        title: document.taxDeclarationNumber ?? document.originalFilename,
        label: 'Current document',
        archived: document,
        isOrigin: true,
    };
}

function toChainCards(
    entries: PreviousDeclarationEntry[],
    originId: number,
): ChainCard[] {
    const originIndex = entries.findIndex(
        (entry) => entry.document?.id === originId,
    );

    return entries.map((entry, index) => {
        const archived = entry.document;
        const isOrigin = archived?.id === originId;

        let label = 'Later declaration';

        if (isOrigin) {
            label = 'Current document';
        } else if (archived === null) {
            label = 'Not in archive yet';
        } else if (originIndex === -1 || index < originIndex) {
            label = 'Previous declaration';
        }

        return {
            id: isOrigin
                ? `current-${archived.id}`
                : archived
                  ? `chain-${archived.id}`
                  : `missing-${entry.taxDeclarationNumber}-${index}`,
            year: declarationYear(
                archived?.declarationDate ?? entry.declarationDate,
            ),
            title: isOrigin
                ? (archived.taxDeclarationNumber ?? archived.originalFilename)
                : `Tax declaration ${entry.taxDeclarationNumber}`,
            label,
            archived,
            isOrigin,
        };
    });
}
