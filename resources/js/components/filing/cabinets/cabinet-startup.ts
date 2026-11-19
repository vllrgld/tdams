type Startup = { start: (ready: () => void) => void; priority: number };

export function createCabinetStartupQueue(
    requestFrame: (callback: () => void) => number,
    cancelFrame: (frame: number) => void,
) {
    let waiting: Startup[] = [];
    let active: Startup | null = null;
    let frame: number | null = null;
    const advance = () => {
        if (active || frame !== null || waiting.length === 0) return;
        frame = requestFrame(() => {
            frame = null;
            const next = waiting.shift();
            if (!next) return;
            active = next;
            next.start(() => finish(next));
        });
    };
    const finish = (startup: Startup) => {
        if (active !== startup) return;
        active = null;
        advance();
    };
    return (start: Startup['start'], priority = 0) => {
        const startup = { start, priority };
        waiting.push(startup);
        waiting.sort((first, second) => second.priority - first.priority);
        advance();
        return () => {
            waiting = waiting.filter((candidate) => candidate !== startup);
            finish(startup);
            if (waiting.length === 0 && frame !== null) {
                cancelFrame(frame);
                frame = null;
            }
        };
    };
}

export const scheduleCabinetStartup = createCabinetStartupQueue(
    (callback) => requestAnimationFrame(callback),
    (frame) => cancelAnimationFrame(frame),
);
