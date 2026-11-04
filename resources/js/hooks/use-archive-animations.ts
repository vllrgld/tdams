import { useMemo, useSyncExternalStore } from 'react';

export type ArchiveAnimation = 'full' | 'fade';
export type ArchiveAnimationKey =
    | 'bookPickup'
    | 'bookReturn'
    | 'folderPickup'
    | 'folderReturn';
export type ArchiveAnimations = Record<ArchiveAnimationKey, ArchiveAnimation>;

const STORAGE_KEY = 'archive-animations';
const DEFAULTS: ArchiveAnimations = {
    bookPickup: 'full',
    bookReturn: 'full',
    folderPickup: 'full',
    folderReturn: 'full',
};
const listeners = new Set<() => void>();

function read(): string | null {
    try {
        return typeof window === 'undefined'
            ? null
            : localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function parse(raw: string | null): ArchiveAnimations {
    try {
        const value: unknown = JSON.parse(raw ?? 'null');
        if (!value || typeof value !== 'object') return DEFAULTS;
        return Object.fromEntries(
            Object.keys(DEFAULTS).map((key) => [
                key,
                (value as Record<string, unknown>)[key] === 'fade'
                    ? 'fade'
                    : 'full',
            ]),
        ) as ArchiveAnimations;
    } catch {
        return DEFAULTS;
    }
}

function subscribe(callback: () => void) {
    listeners.add(callback);
    const storage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) callback();
    };
    window.addEventListener('storage', storage);
    return () => {
        listeners.delete(callback);
        window.removeEventListener('storage', storage);
    };
}

export function useArchiveAnimations() {
    const raw = useSyncExternalStore(subscribe, read, () => null);
    const animations = useMemo(() => parse(raw), [raw]);
    const updateAnimation = (
        key: ArchiveAnimationKey,
        mode: ArchiveAnimation,
    ): boolean => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ...parse(read()), [key]: mode }),
            );
            listeners.forEach((listener) => listener());
            return true;
        } catch {
            return false;
        }
    };
    return { animations, updateAnimation };
}
