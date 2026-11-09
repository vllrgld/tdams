export const commandSearchGroups = [
    'Pages',
    'Actions',
    'Settings',
    'Cabinets',
    'Drawers',
    'Books',
    'Folders',
    'Documents',
] as const;

type CommandEntry = { title: string; hint: string; keywords: string };

export function getActiveCommandIndex(current: number, count: number): number {
    if (count === 0) return -1;
    return current < 0 || current >= count ? 0 : current;
}

export function matchesCommand(entry: CommandEntry, query: string): boolean {
    const haystack =
        `${entry.title} ${entry.hint} ${entry.keywords}`.toLowerCase();
    const words = haystack
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3);

    return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every(
            (term) =>
                haystack.includes(term) ||
                words.some(
                    (word) => term.startsWith(word) || word.startsWith(term),
                ),
        );
}

export function orderCommandResults<T extends { group: string }>(
    items: readonly T[],
): T[] {
    const order = new Map<string, number>(
        commandSearchGroups.map((group, index) => [group, index]),
    );

    return [...items].sort(
        (left, right) =>
            (order.get(left.group) ?? order.size) -
            (order.get(right.group) ?? order.size),
    );
}
