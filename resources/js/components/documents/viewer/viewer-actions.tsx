import type { RefObject } from 'react';
import FloatingActionMenu, {
    type FloatingActionMenuOption,
} from '@/components/ui/floating-action-menu';

export default function ViewerActions({
    label,
    triggerRef,
    options,
}: {
    label: string;
    triggerRef?: RefObject<HTMLButtonElement | null>;
    options: readonly FloatingActionMenuOption[];
}) {
    return (
        <FloatingActionMenu
            className="absolute right-4 bottom-4 z-20"
            label={label}
            menuLabel={label}
            triggerRef={triggerRef}
            options={options}
        />
    );
}
