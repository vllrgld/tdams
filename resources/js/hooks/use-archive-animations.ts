import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { normalizeArchiveAnimations } from '@/lib/archive-animations';

export type {
    ArchiveAnimation,
    ArchiveAnimationKey,
    ArchiveAnimations,
} from '@/lib/archive-animations';

export function useArchiveAnimations() {
    const { auth } = usePage().props;
    const stored = auth.user?.accessibility_settings?.animations;
    const animations = useMemo(
        () => normalizeArchiveAnimations(stored),
        [stored],
    );
    return { animations };
}
