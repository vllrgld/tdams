type ScrollTarget = Pick<HTMLElement, 'scrollTo'>;

export function createPanScrollController(
    requestFrame: (callback: FrameRequestCallback) => number = (callback) =>
        requestAnimationFrame(callback),
    cancelFrame: (handle: number) => void = (handle) =>
        cancelAnimationFrame(handle),
) {
    let frame: number | null = null;
    let pending: { viewer: ScrollTarget; left: number; top: number } | null =
        null;

    const cancel = () => {
        if (frame !== null) cancelFrame(frame);
        frame = null;
        pending = null;
    };

    const flush = () => {
        const next = pending;
        cancel();
        if (next) next.viewer.scrollTo(next.left, next.top);
    };

    return {
        queue(viewer: ScrollTarget, left: number, top: number) {
            pending = { viewer, left, top };
            if (frame === null) {
                frame = requestFrame(() => {
                    frame = null;
                    flush();
                });
            }
        },
        flush,
        cancel,
    };
}
