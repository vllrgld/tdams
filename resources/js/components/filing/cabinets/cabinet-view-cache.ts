type Entry = {
    visible: boolean;
    nearby: boolean;
    retained: boolean;
    used: number;
    change: (retained: boolean) => void;
};

export function createCabinetViewCache(limit = 12) {
    const entries = new Set<Entry>();
    let clock = 0;
    function retain(entry: Entry, retained: boolean) {
        if (entry.retained === retained) return;
        entry.retained = retained;
        if (retained) entry.used = ++clock;
        entry.change(retained);
    }
    const count = () => [...entries].filter((entry) => entry.retained).length;
    const oldest = (onlyDistant: boolean) =>
        [...entries]
            .filter(
                (entry) =>
                    entry.retained &&
                    !entry.visible &&
                    (!onlyDistant || !entry.nearby),
            )
            .sort((first, second) => first.used - second.used)[0];
    function reconcile() {
        for (const entry of entries) {
            if (entry.visible) retain(entry, true);
        }
        while (count() > limit) {
            const candidate = oldest(false);
            if (!candidate) break;
            retain(candidate, false);
        }
        for (const entry of entries) {
            if (!entry.nearby || entry.retained) continue;
            if (count() >= limit) {
                const candidate = oldest(true);
                if (!candidate) continue;
                retain(candidate, false);
            }
            retain(entry, true);
        }
    }
    return {
        register(change: Entry['change']) {
            const entry: Entry = {
                visible: false,
                nearby: false,
                retained: false,
                used: 0,
                change,
            };
            entries.add(entry);
            return {
                update(visible: boolean, nearby: boolean) {
                    if (!entries.has(entry)) return;
                    if (visible && !entry.visible) entry.used = ++clock;
                    entry.visible = visible;
                    entry.nearby = nearby;
                    reconcile();
                },
                release() {
                    entries.delete(entry);
                    reconcile();
                },
            };
        },
    };
}

export const cabinetViewCache = createCabinetViewCache();
