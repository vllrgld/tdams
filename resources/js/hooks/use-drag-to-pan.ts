import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type MouseEvent as ReactMouseEvent,
} from 'react';

// Delay pointer capture until movement becomes a pan, preserving ordinary
// region clicks and keyboard activation inside the viewer.
export function useDragToPan(enabled = true) {
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        left: number;
        top: number;
        moved: boolean;
    } | null>(null);
    const suppressClick = useRef(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [panning, setPanning] = useState(false);

    useEffect(
        () => () => {
            if (resetTimer.current !== null) clearTimeout(resetTimer.current);
        },
        [],
    );

    const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        drag.current = null;
        setPanning(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (current.moved) {
            suppressClick.current = true;
            if (resetTimer.current !== null) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => {
                suppressClick.current = false;
            }, 0);
        }
    };

    return {
        panning,
        panHandlers: {
            onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
                if (!enabled || !event.isPrimary || event.button !== 0) return;
                const target = event.target;
                if (!(target instanceof Element)) return;
                if (
                    target.closest(
                        'input, a, textarea, select, label, button:not([data-pan-region])',
                    )
                )
                    return;
                const viewer = event.currentTarget;
                const rect = viewer.getBoundingClientRect();
                if (
                    event.clientX >=
                        rect.left + viewer.clientLeft + viewer.clientWidth ||
                    event.clientY >=
                        rect.top + viewer.clientTop + viewer.clientHeight
                )
                    return;
                suppressClick.current = false;
                drag.current = {
                    pointerId: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    left: viewer.scrollLeft,
                    top: viewer.scrollTop,
                    moved: false,
                };
            },
            onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
                const current = drag.current;
                if (!current || current.pointerId !== event.pointerId) return;
                const dx = event.clientX - current.x;
                const dy = event.clientY - current.y;
                if (!current.moved && Math.hypot(dx, dy) < 4) return;
                if (!current.moved) {
                    current.moved = true;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setPanning(true);
                }
                event.currentTarget.scrollLeft = current.left - dx;
                event.currentTarget.scrollTop = current.top - dy;
                event.preventDefault();
            },
            onPointerUp: finish,
            onPointerCancel: finish,
            onLostPointerCapture: finish,
            onPointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
                if (drag.current && !drag.current.moved) finish(event);
            },
            onClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
                if (!suppressClick.current || event.detail === 0) return;
                suppressClick.current = false;
                event.preventDefault();
                event.stopPropagation();
            },
            onDragStart(event: React.DragEvent<HTMLDivElement>) {
                if (enabled) event.preventDefault();
            },
        },
    };
}
