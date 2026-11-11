import type { ReactNode, RefObject } from 'react';
import { useDragToPan } from '@/hooks/use-drag-to-pan';
import { cn } from '@/lib/utils';

export default function PannableViewport({
    viewerRef,
    enabled = true,
    className,
    children,
}: {
    viewerRef: RefObject<HTMLDivElement | null>;
    enabled?: boolean;
    className?: string;
    children: ReactNode;
}) {
    const { panning, panHandlers } = useDragToPan(enabled);

    return (
        <div
            ref={viewerRef}
            data-document-viewport
            {...panHandlers}
            className={cn(
                'relative min-h-0 flex-1 overflow-auto',
                className,
                enabled &&
                    'cursor-grab touch-none select-none [&_button]:cursor-grab',
                panning &&
                    'cursor-grabbing [&_[data-pan-region]]:pointer-events-none [&_button]:cursor-grabbing',
            )}
        >
            {children}
        </div>
    );
}
