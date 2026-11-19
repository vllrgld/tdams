import * as React from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '@/lib/utils';

function Progress({
    className,
    children,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            className={cn('flex w-full flex-wrap items-center gap-y-2', className)}
            {...props}
        >
            {children}
            <ProgressPrimitive.Track
                data-slot="progress-track"
                className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
            >
                <ProgressPrimitive.Indicator
                    data-slot="progress-indicator"
                    className="h-full rounded-full bg-primary transition-[width] duration-300 data-indeterminate:w-2/5 data-indeterminate:animate-[progress-indeterminate_1.5s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:transition-none"
                />
            </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>
    );
}

function ProgressLabel({
    className,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Label>) {
    return (
        <ProgressPrimitive.Label
            data-slot="progress-label"
            className={cn('text-sm font-medium', className)}
            {...props}
        />
    );
}

function ProgressValue({
    className,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Value>) {
    return (
        <ProgressPrimitive.Value
            data-slot="progress-value"
            className={cn('ml-auto text-sm tabular-nums', className)}
            {...props}
        />
    );
}

export { Progress, ProgressLabel, ProgressValue };
