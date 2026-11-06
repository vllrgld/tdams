export type ArchiveAnimation = 'full' | 'fade';
export type ArchiveAnimationKey =
    | 'bookPickup'
    | 'bookReturn'
    | 'folderPickup'
    | 'folderReturn';
export type ArchiveAnimations = Record<ArchiveAnimationKey, ArchiveAnimation>;

const DEFAULTS: ArchiveAnimations = {
    bookPickup: 'full',
    bookReturn: 'full',
    folderPickup: 'full',
    folderReturn: 'full',
};

export function normalizeArchiveAnimations(value: unknown): ArchiveAnimations {
    if (!value || typeof value !== 'object') return { ...DEFAULTS };
    return Object.fromEntries(
        Object.keys(DEFAULTS).map((key) => [
            key,
            (value as Record<string, unknown>)[key] === 'fade'
                ? 'fade'
                : 'full',
        ]),
    ) as ArchiveAnimations;
}
